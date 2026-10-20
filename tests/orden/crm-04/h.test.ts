// CRM-04 · H1, H2 (H) · el hub: guardarConfig en una transacción (D-346, REV 12) y el alta sin emails de plantilla (D-341).
// Sesión A (2026-10-20): tests rojos.
//
// Medido en H 6247cd9: `guardarConfig` lee `config/{id}` (`guardar-config.ts:189`) y escribe con `set` + `merge` (`:210`) sin
// transacción: el horario que el CRM guarda en el medio se pierde. `bootstrapTenantOwner` registra cualquier email (la demo tiene a
// `hello@example.com` de dueña, PASO-2) y `resolveOwnerNotificationEmail` lo devuelve. Caja negra: `import()` dinámico con el
// cargador de .ts/.tsx; el Firestore es `dbMemoria` de `_comun.ts` (transacciones optimistas, como Firestore).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { RESERVADO, ROOT, dbMemoria, importarModulo, porJson } from "./_comun.ts";

const CLIENTE = "crm04-salon";
const dia = (start: string, end: string) => ({ isOpen: true, hours: { start, end }, breaks: [] as any[] });
const semana = (start: string, end: string) => ({ sunday: dia(start, end), monday: dia(start, end), tuesday: dia(start, end), wednesday: dia(start, end), thursday: dia(start, end), friday: dia(start, end), saturday: { isOpen: false, hours: { start: "00:00", end: "00:00" }, breaks: [] } });

test("guardarConfig lee y escribe config/{id} en una transacción: un horario que el CRM guarda entre la lectura y la escritura queda guardado", async () => {
  const fallas: string[] = [];
  const gc = await importarModulo("src/lib/guardar-config.ts");
  if (typeof gc?.guardarConfig !== "function") fallas.push("src/lib/guardar-config.ts exporta guardarConfig");
  else {
    // El config de la plantilla A (copiado por MARCA-01; sólo lectura): la ficha se abrió con el horario de 09:00 a 20:00.
    const base = JSON.parse(readFileSync(resolve(ROOT, "tests/orden/marca-01/peluqueria-paleta-a.json"), "utf8"));
    const ficha = porJson({ ...base, staff: (base.staff as any[]).map((p) => ({ ...p, schedule: semana("09:00", "20:00") })) });
    // La casilla de equipo cambia la bio de la primera persona.
    const cuerpo = porJson({ ...ficha, staff: ficha.staff.map((p: any, i: number) => (i === 0 ? { ...p, bio: "ביו חדשה (CRM-04)" } : p)) });
    const delCrm = semana("12:00", "16:00");
    const mem = dbMemoria({ [`config/${CLIENTE}`]: ficha, "hub_clients/h1": { clientId: CLIENTE, niche: "peluqueria" } }, {
      // Entre la lectura de guardarConfig y su escritura, la dueña guarda en el CRM el horario de la primera persona.
      alLeer: async (ruta, n, db) => {
        if (ruta !== `config/${CLIENTE}` || n !== 1) return;
        const guardado = (await db.doc(`config/${CLIENTE}`).get()).data();
        await db.doc(`config/${CLIENTE}`).set({ staff: guardado.staff.map((p: any, i: number) => (i === 0 ? { ...p, schedule: delCrm } : p)) }, { merge: true });
      },
    });
    let r: any;
    try { r = await gc.guardarConfig(CLIENTE, cuerpo, { db: mem.db, quien: "crm-04 H1" }); } catch (e) { r = { ok: false, error: (e as Error).message }; }
    if (r?.ok !== true) fallas.push(`guardarConfig guarda (${JSON.stringify(r?.issues ?? r?.error ?? r).slice(0, 300)})`);
    const final = mem.doc(`config/${CLIENTE}`);
    const p0 = final?.staff?.[0];
    if (JSON.stringify(p0?.schedule) !== JSON.stringify(delCrm)) fallas.push(`el horario que el CRM guardó en el medio queda guardado (domingo ${p0?.schedule?.sunday?.hours?.start}–${p0?.schedule?.sunday?.hours?.end}; el del CRM, 12:00–16:00)`);
    if (p0?.bio !== "ביו חדשה (CRM-04)") fallas.push(`y la bio nueva de la casilla también (queda ${JSON.stringify(p0?.bio)})`);
    const escrituras = mem.escritas.filter((e) => e.ruta === `config/${CLIENTE}`).slice(1); // la primera es la del CRM, en el medio
    if (!escrituras.length) fallas.push("guardarConfig escribe config/{id}");
    else if (escrituras.some((e) => !e.tx)) fallas.push(`guardarConfig escribe config/{id} dentro de la transacción (${escrituras.filter((e) => !e.tx).length} escrituras sueltas)`);
  }
  assert.deepEqual(fallas, [], `H1 · guardarConfig en una transacción:\n${fallas.join("\n")}`);
});

const RESERVADOS = ["hello@example.com", "dueno@example.org", "a@example.net", "b@mail.example.com", "c@salon.example", "d@salon.test", "e@salon.invalid", "f@salon.localhost"];

test("bootstrapTenantOwner responde 400 sin escribir con un email de un dominio reservado (example.com, example.org, example.net y sus subdominios; .example, .test, .invalid, .localhost) y resolveOwnerNotificationEmail no devuelve un email así", async () => {
  const fallas: string[] = [];
  const ab = await importarModulo("src/lib/admin-bootstrap.ts");
  const pv = await importarModulo("src/lib/provisioning.ts");
  if (typeof ab?.bootstrapTenantOwner !== "function") fallas.push("src/lib/admin-bootstrap.ts exporta bootstrapTenantOwner");
  else {
    const correr = async (email: string) => {
      const escrito: string[] = [], llamadas: string[] = [];
      const db = { collection: (_n: string) => ({ doc: (id: string) => ({ async get() { return { exists: false, data: () => undefined }; }, async set() { escrito.push(id); } }) }) };
      const auth = {
        async getUserByEmail(e: string) { llamadas.push(`getUserByEmail ${e}`); return { uid: "u1", email: e, customClaims: {} }; },
        async setCustomUserClaims() { llamadas.push("setCustomUserClaims"); },
        async revokeRefreshTokens() { llamadas.push("revokeRefreshTokens"); },
      };
      let r: any;
      try { r = await ab.bootstrapTenantOwner({ email, clientId: "c1", db, auth, now: new Date("2026-10-20T10:00:00Z") }); } catch (e) { r = { ok: false, error: `lanzó: ${(e as Error).message}` }; }
      return { r, escrito, llamadas };
    };
    for (const email of [...RESERVADOS, "Hello@Example.COM"]) {
      const { r, escrito, llamadas } = await correr(email);
      if (r?.ok !== false || r?.status !== 400) fallas.push(`bootstrapTenantOwner(${email}) responde 400 (hoy ${JSON.stringify(r)})`);
      if (escrito.length || llamadas.length) fallas.push(`bootstrapTenantOwner(${email}) no escribe (escribió ${JSON.stringify(escrito)}; auth: ${JSON.stringify(llamadas)})`);
    }
    // Las dos direcciones: un email real sí se registra.
    for (const email of ["duena@gmail.com", "liam@arzac.studio", "x@examples.com", "y@test.co.il"]) {
      const { r, escrito } = await correr(email);
      if (r?.ok !== true || escrito.length !== 1) fallas.push(`bootstrapTenantOwner(${email}) registra a la dueña (hoy ${JSON.stringify(r)})`);
    }
  }
  if (typeof pv?.resolveOwnerNotificationEmail !== "function") fallas.push("src/lib/provisioning.ts exporta resolveOwnerNotificationEmail");
  else {
    for (const email of RESERVADOS) {
      for (const [cfg, hub] of [[{ adminEmail: email }, undefined], [{ adminEmail: email }, { adminEmail: "real@gmail.com" }], [{}, { adminEmail: email }]] as const) {
        const v = pv.resolveOwnerNotificationEmail(cfg, hub);
        if (typeof v === "string" && RESERVADO.test(v)) fallas.push(`resolveOwnerNotificationEmail(${JSON.stringify(cfg)}, ${JSON.stringify(hub)}) no devuelve ${v}`);
      }
    }
    const real = pv.resolveOwnerNotificationEmail({ adminEmail: "hello@example.com" }, { adminEmail: "real@gmail.com" });
    if (real !== undefined && real !== "real@gmail.com") fallas.push(`resolveOwnerNotificationEmail cae a la dueña real o a nada (hoy ${JSON.stringify(real)})`);
    if (pv.resolveOwnerNotificationEmail({ adminEmail: "real@gmail.com" }) !== "real@gmail.com") fallas.push("resolveOwnerNotificationEmail devuelve un email real");
  }
  assert.deepEqual(fallas, [], `H2 · el alta sin emails de plantilla:\n${fallas.join("\n")}`);
});
