// CRM-04 · W2 (H, webs) · la segunda dueña de la demo ya no está (D-341). Sesión A (2026-10-20): test rojo.
//
// Medido el 2026-10-20 (sólo lectura, Firestore de producción por el Admin SDK con el `.env.local` de H): la demo tiene dos dueñas en
// `admin_users`, `liam.arzac@gmail.com` y `hello@example.com` (la registró el alta del 5-10). Precondición del árbol (inciso l): el alta
// rechaza ese email (H2); en el rojo cae ahí, sin salir a la red. Sale a la red sólo para LEER `admin_users` (marca «, webs», D-151).
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO, RESERVADO, firestoreReal, importarModulo } from "./_comun.ts";

test("en el Firestore de producción no hay ningún admin_users con email de un dominio reservado y clientId de la demo", async () => {
  const fallas: string[] = [];
  // Del árbol: el alta ya no registra un email de plantilla.
  const ab = await importarModulo("src/lib/admin-bootstrap.ts");
  let rechaza = false;
  try {
    const db = { collection: () => ({ doc: () => ({ async get() { return { exists: false, data: () => undefined }; }, async set() {} }) }) };
    const auth = { async getUserByEmail(e: string) { return { uid: "u", email: e }; }, async setCustomUserClaims() {}, async revokeRefreshTokens() {} };
    const r = await ab?.bootstrapTenantOwner({ email: "hello@example.com", clientId: DEMO.clientId, db, auth });
    rechaza = r?.ok === false && r?.status === 400;
  } catch { rechaza = false; }
  assert.ok(rechaza, "precondición del árbol (H2): bootstrapTenantOwner rechaza hello@example.com con 400");
  // De la base: ninguna dueña con email reservado en la demo.
  try {
    const db = await firestoreReal();
    const s = await db.collection("admin_users").where("clientId", "==", DEMO.clientId).get();
    const reservados = s.docs.map((d: any) => String(d.data()?.email ?? d.id)).filter((e: string) => RESERVADO.test(e));
    if (reservados.length) fallas.push(`admin_users de la demo (${DEMO.clientId}) sin emails de dominios reservados (hoy: ${reservados.join(", ")})`);
  } catch (e) { fallas.push(`leer admin_users de producción: ${(e as Error).message.split("\n")[0]}`); }
  assert.deepEqual(fallas, [], `W2 · la segunda dueña de la demo:\n${fallas.join("\n")}`);
});
