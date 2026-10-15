// CRM-03 · W2 (H, webs) · editar el equipo desde el hub no pierde el horario de la dueña, en la demo de prueba (D-303 (1), D-310).
// Sesión A (2026-10-15): test rojo.
//
// Lo corre B al cierre y la verificadora (`rojo-verde --orden crm-03` entero, inciso s); `--todas` no lo corre en HEAD (D-151).
// Contra el Firestore real de la demo (Admin SDK, credenciales del .env.local de H): carga un día libre como lo guarda el CRM (en
// staff_overrides y en config.staff, como `staffConHorario` de T), guarda con `guardarConfig` de H el cuerpo de una ficha abierta
// ANTES —la bio de una persona cambiada— y mira el config. En `finally` vuelve config, staff_overrides y config_history a como
// estaban: los datos `videos-01` de VIDEOS-01 no cambian (pedido).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO, dbFalsa, envDeH, firestoreReal, importarModulo, porJson } from "./_comun.ts";

/** JSON con las claves ordenadas: Firestore puede devolver los mapas en otro orden. */
const estable = (v: any): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));
function fechaIL(dias: number): string {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  const [a, m, d] = hoy.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

test("editar el equipo desde el hub no pierde el horario de la dueña: en la demo de prueba, con un día libre cargado como lo guarda el CRM, guardarConfig de H con el cuerpo de una ficha abierta antes —la bio de una persona cambiada— deja ese día libre y ese horario en config, y todo vuelve a como estaba", async () => {
  for (const [k, v] of Object.entries(envDeH())) if (k.startsWith("FIREBASE_") || k.startsWith("NEXT_PUBLIC_FIREBASE_")) process.env[k] ??= v;
  const gc = await importarModulo("src/lib/guardar-config.ts");
  const ti = await importarModulo("src/lib/textos-idioma.ts");
  assert.equal(typeof gc?.guardarConfig, "function", "src/lib/guardar-config.ts exporta guardarConfig");
  // Precondición del árbol (inciso l): el mismo guardado sobre un Firestore en memoria conserva el día libre. En el árbol rojo cae
  // acá, sin tocar la demo.
  {
    const p = { id: "p", name: "p", schedule: { sunday: { isOpen: true, hours: { start: "09:00", end: "15:00" }, breaks: [] } } };
    const m = await dbFalsa({ "config/crm03-pre": { staff: [{ ...p, dateOverrides: { "2026-12-01": { type: "dayOff" } } }] }, "hub_clients/h": { clientId: "crm03-pre", niche: "peluqueria" } });
    await gc!.guardarConfig("crm03-pre", { staff: [{ ...p, bio: "x" }] }, { db: m.db as any, quien: "crm-03 W2 pre" });
    assert.equal(m.doc("config", "crm03-pre")?.staff?.[0]?.dateOverrides?.["2026-12-01"]?.type, "dayOff", "precondición del árbol: guardarConfig conserva el dateOverrides guardado al recibir la lista de la ficha (G1)");
  }
  const db = await firestoreReal();
  const cfgRef = db.collection("config").doc(DEMO.clientId);
  const antes = (await cfgRef.get()).data();
  assert.ok(antes?.staff?.length, "la demo de prueba tiene equipo en config");
  const persona = antes.staff[antes.staff.length - 1];
  const ovRef = db.collection("staff_overrides").doc(`${DEMO.clientId}_${persona.id}`);
  const ovAntes = await ovRef.get();
  const inicio = new Date();
  const fallas: string[] = [];
  try {
    const ficha = porJson(antes); // la ficha, abierta antes de que el CRM cargue el día libre
    let dia = fechaIL(5);
    for (let i = 5; i < 20; i++) { const f = fechaIL(i); if (!persona.dateOverrides?.[f]) { dia = f; break; } }
    // Lo que hace el CRM al guardar: staff_overrides de esa persona y su schedule/blockedDates/dateOverrides en config.staff.
    const dateOverrides = { ...(persona.dateOverrides ?? {}), [dia]: { type: "dayOff" } };
    await ovRef.set({ clientId: DEMO.clientId, staffId: persona.id, schedule: persona.schedule, blockedDates: persona.blockedDates ?? [], dateOverrides }, { merge: true });
    await cfgRef.update({ staff: antes.staff.map((s: any) => (s.id === persona.id ? { ...s, dateOverrides } : s)) });
    // La ficha guarda la bio nueva de esa persona.
    const editada = porJson({ ...ficha, staff: ficha.staff.map((s: any) => (s.id === persona.id ? { ...s, bio: `${s.bio ?? ""} (CRM-03 W2)`.trim() } : s)) });
    const cuerpo = typeof ti?.borradosIdioma === "function" ? ti.borradosIdioma(ficha, editada) : editada;
    const r = await gc!.guardarConfig(DEMO.clientId, cuerpo, { quien: "crm-03 W2" });
    if (!r.ok) fallas.push(`guardarConfig guarda el cuerpo de la ficha (${JSON.stringify(r).slice(0, 300)})`);
    const final = (await cfgRef.get()).data();
    const f = final.staff.find((s: any) => s.id === persona.id);
    if (f?.dateOverrides?.[dia]?.type !== "dayOff") fallas.push(`el día libre del ${dia} que cargó el CRM sigue en config (queda ${JSON.stringify(f?.dateOverrides)})`);
    if (estable(f?.schedule) !== estable(persona.schedule)) fallas.push("el horario de esa persona sigue en config");
    if (!String(f?.bio ?? "").includes("(CRM-03 W2)")) fallas.push("con la bio nueva de la ficha");
  } finally {
    await cfgRef.set(antes);
    if (ovAntes.exists) await ovRef.set(ovAntes.data()); else await ovRef.delete();
    const hist = await db.collection("config_history").doc(DEMO.clientId).collection("entries").where("changedBy", "==", "crm-03 W2").get();
    for (const d of hist.docs) if (d.createTime?.toDate?.() >= inicio || !d.createTime) await d.ref.delete();
    const despues = (await cfgRef.get()).data();
    if (estable(despues) !== estable(antes)) fallas.push("todo vuelve a como estaba (config)");
  }
  assert.deepEqual(fallas, [], `el horario de la dueña al editar el equipo desde el hub:\n${fallas.join("\n")}`);
});
