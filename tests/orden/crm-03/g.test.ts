// CRM-03 · G1, G2 (H) · el horario en el hub (D-303 (1)) y CRON_SECRET en cada web (D-300). Sesión A (2026-10-15): tests rojos.
//
// Medido (hallazgo del revisor, verificado por A): la casilla de equipo manda el array `staff` entero tal como estaba al abrir la ficha
// (`client-config-tab.tsx:466-529`) y `guardarConfig` hace `set` con `merge` (`guardar-config.ts:183`): Firestore reemplaza los arrays,
// así que el horario que la dueña cargó en el CRM después de abrir la ficha se pierde. `variablesDeDeploy` da variables sólo a
// peluquería y ninguna es CRON_SECRET (`variables-deploy.ts:20-31`). Caja negra: `import()` dinámico con el cargador de .ts/.tsx.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, dbFalsa, fuente, importarModulo, porJson } from "./_comun.ts";

const CLIENTE = "crm03-salon";
const dia = (start: string, end: string) => ({ isOpen: true, hours: { start, end }, breaks: [] as any[] });
const semana = (start: string, end: string) => ({ sunday: dia(start, end), monday: dia(start, end), tuesday: dia(start, end), wednesday: dia(start, end), thursday: dia(start, end), friday: dia(start, end), saturday: { isOpen: false, hours: { start: "00:00", end: "00:00" }, breaks: [] } });

test("guardarConfig conserva el horario que cargó la dueña: con la fusión de Firestore modelada, guardar desde la casilla de equipo una ficha abierta antes de que el CRM cambiara el horario —editando la bio de una persona— deja en el config, de cada persona que sigue, el schedule, los blockedDates, los dateOverrides y los blockedSlots guardados y la bio nueva; una persona nueva entra con el horario que trae; una persona quitada se va; y sin un documento guardado escribe lo que trae", async () => {
  const gc = await importarModulo("src/lib/guardar-config.ts");
  const ti = await importarModulo("src/lib/textos-idioma.ts");
  assert.equal(typeof gc?.guardarConfig, "function", "src/lib/guardar-config.ts exporta guardarConfig");
  // El config de la plantilla A (copiado por MARCA-01; sólo lectura), con tres personas.
  const base = JSON.parse(readFileSync(resolve(ROOT, "tests/orden/marca-01/peluqueria-paleta-a.json"), "utf8"));
  const [p0, p1, p2] = base.staff as any[];
  const ficha = porJson({ ...base, staff: [{ ...p0, schedule: semana("09:00", "20:00") }, { ...p1, schedule: semana("09:00", "20:00") }, { ...p2, schedule: semana("09:00", "20:00") }] });
  // Lo que guardó el CRM DESPUÉS de abrir la ficha: horarios nuevos, días libres, fechas bloqueadas y franjas.
  const delCrm = (p: any, i: number) => ({ ...p, schedule: semana(`1${i}:00`, "18:00"), blockedDates: [`2026-11-0${i + 1}`], dateOverrides: { [`2026-10-2${i}`]: { type: "dayOff" } }, blockedSlots: [{ id: `b${i}`, date: "2026-10-30", start: "12:00", end: "13:00", reason: "x" }] });
  const guardado = porJson({ ...ficha, staff: ficha.staff.map(delCrm) });
  // La casilla de equipo: la bio de la primera persona; el cuerpo es el que arma la ficha (borradosIdioma sobre lo cargado).
  const editada = porJson({ ...ficha, staff: ficha.staff.map((p: any, i: number) => (i === 0 ? { ...p, bio: "ביו חדשה (CRM-03)" } : p)) });
  const cuerpo = typeof ti?.borradosIdioma === "function" ? ti.borradosIdioma(ficha, editada) : editada;
  const m = await dbFalsa({ [`config/${CLIENTE}`]: guardado, [`hub_clients/h1`]: { clientId: CLIENTE, niche: "peluqueria" } });
  const r = await gc!.guardarConfig(CLIENTE, cuerpo, { db: m.db as any, quien: "crm-03 G1" });
  assert.equal(r.ok, true, `guardarConfig guarda (${JSON.stringify(r.issues ?? r.error ?? "").slice(0, 300)})`);
  const final = m.doc("config", CLIENTE)!;
  const fallas: string[] = [];
  for (const [i, p] of (guardado.staff as any[]).entries()) {
    const f = final.staff.find((x: any) => x.id === p.id);
    for (const k of ["schedule", "blockedDates", "dateOverrides", "blockedSlots"]) if (JSON.stringify(f?.[k]) !== JSON.stringify(p[k])) fallas.push(`${p.id}: conserva ${k} de lo guardado (queda ${JSON.stringify(f?.[k])?.slice(0, 80)})`);
    if (i === 0 && f?.bio !== "ביו חדשה (CRM-03)") fallas.push(`${p.id}: con la bio nueva (queda ${f?.bio})`);
  }
  // Una persona nueva y una quitada.
  const nueva = { ...p2, id: "nueva", slug: "nueva", name: "חדשה", schedule: semana("08:00", "12:00") };
  // Quitar como la casilla (quitarMiembro: también sus textos por idioma) y agregar una persona.
  const eq = await importarModulo("src/components/config-editors/staff-editor.tsx");
  const sinTercera = typeof eq?.quitarMiembro === "function" ? eq.quitarMiembro(ficha, 2) : { ...ficha, staff: ficha.staff.slice(0, 2) };
  const conCambios = porJson({ ...sinTercera, staff: [...(sinTercera.staff as any[]), nueva] });
  const m2 = await dbFalsa({ [`config/${CLIENTE}`]: guardado, [`hub_clients/h1`]: { clientId: CLIENTE, niche: "peluqueria" } });
  const r2 = await gc!.guardarConfig(CLIENTE, typeof ti?.borradosIdioma === "function" ? ti.borradosIdioma(ficha, conCambios) : conCambios, { db: m2.db as any, quien: "crm-03 G1" });
  assert.equal(r2.ok, true, `guarda con una persona nueva y una quitada (${JSON.stringify(r2.issues ?? r2.error ?? "").slice(0, 400)})`);
  const f2 = m2.doc("config", CLIENTE)!.staff as any[];
  if (JSON.stringify(f2.map((x) => x.id)) !== JSON.stringify([p0.id, p1.id, "nueva"])) fallas.push(`la persona quitada se va y la nueva entra (quedan ${f2.map((x) => x.id).join(", ")})`);
  if (JSON.stringify(f2.find((x) => x.id === "nueva")?.schedule) !== JSON.stringify(nueva.schedule)) fallas.push("la persona nueva entra con el horario que trae");
  if (JSON.stringify(f2.find((x) => x.id === p0.id)?.dateOverrides) !== JSON.stringify(guardado.staff[0].dateOverrides)) fallas.push(`${p0.id}: conserva su dateOverrides también cuando cambia la lista`);
  // Sin documento guardado.
  const m3 = await dbFalsa({ [`hub_clients/h1`]: { clientId: CLIENTE, niche: "peluqueria" } });
  const r3 = await gc!.guardarConfig(CLIENTE, porJson(editada), { db: m3.db as any, quien: "crm-03 G1" });
  assert.equal(r3.ok, true, "guarda sin un documento previo");
  if (JSON.stringify((m3.doc("config", CLIENTE)!.staff as any[]).map((x) => x.schedule)) !== JSON.stringify(editada.staff.map((x: any) => x.schedule))) fallas.push("sin un documento guardado escribe lo que trae");
  assert.deepEqual(fallas, [], `el horario de la dueña al guardar desde el hub:\n${fallas.join("\n")}`);
});

test("CRON_SECRET en cada web: variablesDeDeploy da CRON_SECRET para todos los nichos —peluquería y los otros—, cifrada, con el HMAC-SHA256 del CRON_SECRET del hub y el clientId, el mismo en dos llamadas y distinto entre dos clientes, nunca la clave del hub; redesplegar sin CRON_SECRET en el hub falla cerrado en «env» sin pedir el deployment; y el alta lo suma a las variables del proyecto", async () => {
  const vd = await importarModulo("src/lib/variables-deploy.ts");
  assert.equal(typeof vd?.variablesDeDeploy, "function", "src/lib/variables-deploy.ts exporta variablesDeDeploy");
  const entorno = { CRON_SECRET: "clave-del-hub" };
  const esperado = (id: string) => createHmac("sha256", "clave-del-hub").update(id).digest("hex");
  const fallas: string[] = [];
  for (const niche of ["peluqueria", "barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"]) {
    const vars = vd!.variablesDeDeploy({ brand: { name: "X" } }, { niche, clientId: "c1" }, entorno) as any[];
    const cron = vars.find((v) => v.key === "CRON_SECRET");
    if (!cron) { fallas.push(`${niche}: da CRON_SECRET`); continue; }
    if (cron.value !== esperado("c1")) fallas.push(`${niche}: el valor es HMAC-SHA256(CRON_SECRET del hub, clientId)`);
    if (cron.type !== "encrypted" || JSON.stringify(cron.target) !== JSON.stringify(["production", "preview"])) fallas.push(`${niche}: cifrada, en production y preview`);
  }
  const a = (vd!.variablesDeDeploy({}, { niche: "barberia", clientId: "c1" }, entorno) as any[]).find((v) => v.key === "CRON_SECRET");
  const b = (vd!.variablesDeDeploy({}, { niche: "barberia", clientId: "c2" }, entorno) as any[]).find((v) => v.key === "CRON_SECRET");
  if (a && b && (a.value === b.value || a.value === "clave-del-hub")) fallas.push("distinto entre dos clientes y nunca la clave del hub");
  // Redesplegar sin CRON_SECRET en el hub.
  const pedidos: string[] = [];
  const fetchVercel = async (ruta: string) => { pedidos.push(ruta); return new Response(JSON.stringify({ id: "dpl_x" }), { status: 200 }); };
  const r = await vd!.redesplegar({ hub: { niche: "barberia", clientId: "c1", vercelProjectId: "prj_x" }, config: {}, templateRepo: "o/r", fetchVercel, entorno: {} });
  if (r.ok !== false || r.stage !== "env") fallas.push(`redesplegar sin CRON_SECRET en el hub falla cerrado en «env» (hoy ${JSON.stringify(r)})`);
  if (pedidos.some((p) => p.startsWith("/v13/deployments"))) fallas.push("sin pedir el deployment");
  // El alta: deploy.ts suma lo de variablesDeDeploy a las variables del proyecto.
  if (!/envVars\.push\(\.\.\.variablesDeDeploy\(/.test(fuente("src/lib/deploy.ts"))) fallas.push("el alta (deploy.ts) suma variablesDeDeploy a las variables del proyecto");
  assert.deepEqual(fallas, [], `CRON_SECRET:\n${fallas.join("\n")}`);
});
