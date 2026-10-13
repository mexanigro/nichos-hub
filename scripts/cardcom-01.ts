/**
 * cardcom-01.ts — CARDCOM-01 (Liam, 2026-10-13): las escrituras de la prueba del primer cobro real, SÓLO sobre la ficha de prueba.
 *   alta:    hub_clients.setupAmount = 1000 (el alta que paga Liam en /pago).
 *   limpiar: la ficha archived (y clients/{id}, como cuando el hub archiva), sin token ni nextChargeAt (el cron no puede volver a
 *            cobrarle), y los hub_payments de la prueba marcados «CARDCOM-01» y devueltos (no se borran).
 * EN SECO por defecto; escribe sólo con --aplicar. Al final, la consulta del cron: quién queda vencido con token.
 *   node --experimental-strip-types scripts/cardcom-01.ts alta|limpiar [--aplicar]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ID = "demo-n08-barber-a-segunda-14a0eef3";
const DESDE = new Date("2026-10-13T00:00:00Z"); // los hub_payments de la prueba; el pending de 1500 del 12/09 no es de ésta
const [modo, ...argv] = process.argv.slice(2);
const aplicar = argv.includes("--aplicar");
if (modo !== "alta" && modo !== "limpiar") {
  console.error("uso: cardcom-01 alta|limpiar [--aplicar]");
  process.exit(2);
}

for (const linea of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8").split(/\r?\n/)) {
  const t = linea.trim(), i = t.indexOf("=");
  if (!t || t.startsWith("#") || i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (/^FIREBASE_/.test(k)) process.env[k] ??= v;
}
const { db } = await import("../src/lib/firebase-admin.ts");
const { FieldValue, Timestamp } = await import("firebase-admin/firestore");
const fecha = (v: unknown) => (v && typeof (v as { toDate?: unknown }).toDate === "function" ? (v as { toDate(): Date }).toDate().toISOString() : v ?? null);

const snap = await db.collection("hub_clients").where("clientId", "==", ID).limit(1).get();
if (snap.empty) { console.error(`${ID}: no está en hub_clients`); process.exit(1); }
const ref = snap.docs[0].ref;
const c = snap.docs[0].data();
console.log(`${modo} · ${ID} (hub_clients/${ref.id}) · ${aplicar ? "APLICADO" : "EN SECO (nada escrito; repetir con --aplicar)"}`);

if (modo === "alta") {
  console.log(`  setupAmount: ${c.setupAmount ?? null} → 1000`);
  if (aplicar) await ref.update({ setupAmount: 1000, updatedAt: FieldValue.serverTimestamp() });
} else {
  console.log(`  hub_clients.status: ${c.status} → archived · clients/${ID}.status → archived`);
  console.log(`  borra: cardcomToken (${c.cardcomToken ? "existe" : "no existe"}), cardcomTokenExpMonth/Year, nextChargeAt (${fecha(c.nextChargeAt)})`);
  const pagos = (await db.collection("hub_payments").where("clientId", "==", ID).get()).docs
    .filter((p) => { const t = p.data().createdAt; return t && typeof t.toDate === "function" && t.toDate() >= DESDE; });
  for (const p of pagos) {
    const d = p.data();
    console.log(`  hub_payments/${p.id}: ${d.type} ${d.amount} ${d.status} → refunded · prueba CARDCOM-01 · devuelto`);
  }
  if (aplicar) {
    await ref.update({
      status: "archived", cardcomToken: FieldValue.delete(), cardcomTokenExpMonth: FieldValue.delete(), cardcomTokenExpYear: FieldValue.delete(),
      nextChargeAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp(),
    });
    await db.collection("clients").doc(ID).set({ status: "archived" }, { merge: true });
    for (const p of pagos) {
      await p.ref.update({ status: "refunded", statusAntes: p.data().status, prueba: "CARDCOM-01", devuelto: true, updatedAt: FieldValue.serverTimestamp() });
    }
  }
}

// La misma consulta que el cron (src/app/api/cron/cardcom-charges/route.ts).
const due = await db.collection("hub_clients").where("paymentStatus", "in", ["active", "past_due"]).where("nextChargeAt", "<=", Timestamp.now()).get();
const conToken = due.docs.filter((d) => d.data().cardcomToken);
console.log(`cron hoy: ${due.size} vencidos, ${conToken.length} con token${conToken.length ? `: ${conToken.map((d) => d.data().clientId).join(", ")}` : ""}`);
process.exit(0);
