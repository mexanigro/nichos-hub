/**
 * cobro-mensual-uno.ts — CARDCOM-01 (Liam, 2026-10-13): el cobro mensual de UN cliente, con la misma función que el cron
 * (cobrarSiVence de src/lib/cobro-mensual.ts: cobra sólo si vence, escribe lo mismo que el cron). Sólo ids de la lista fija.
 * Cobra en el terminal de producción: CARDCOM_SANDBOX se fuerza a false (en .env.local está en true para lo local).
 *
 *   EN SECO (por defecto): a quién, cuánto, con qué tarjeta (4 últimos) y si vence; no escribe ni cobra.
 *   --vencer: pone nextChargeAt = ahora antes de cobrar (la prueba no espera un mes). Sólo con --aplicar escribe.
 *   --aplicar: cobra y escribe.
 *     node --experimental-strip-types scripts/cobro-mensual-uno.ts --id <clientId> [--vencer] [--aplicar]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { DbCobro } from "../src/lib/cobro-mensual.ts";

// ponytail: lista fija a propósito; una clienta real la cobra el cron, nunca este script.
const PERMITIDOS = ["demo-n08-barber-a-segunda-14a0eef3"];

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const id = arg("id");
const aplicar = argv.includes("--aplicar");
const vencer = argv.includes("--vencer");
if (!id) { console.error("uso: cobro-mensual-uno --id <clientId> [--vencer] [--aplicar]"); process.exit(2); }
if (!PERMITIDOS.includes(id)) { console.error(`${id}: no está en la lista de prueba (${PERMITIDOS.join(", ")}); no se cobra`); process.exit(2); }

for (const linea of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8").split(/\r?\n/)) {
  const t = linea.trim(), i = t.indexOf("=");
  if (!t || t.startsWith("#") || i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (/^(FIREBASE_|CARDCOM_)/.test(k)) process.env[k] ??= v;
}
process.env.CARDCOM_SANDBOX = "false";

const { db } = await import("../src/lib/firebase-admin.ts");
const { chargeToken, TERMINAL } = await import("../src/lib/cardcom.ts");
const { cobrarSiVence, puertosFirestore, toDueClient } = await import("../src/lib/cobro-mensual.ts");
const { isDue } = await import("../src/lib/recurring-charge.ts");
const { monthlyChargeFor } = await import("../src/lib/pricing.ts");

const buscar = async () => {
  const s = await db.collection("hub_clients").where("clientId", "==", id).limit(1).get();
  if (s.empty) { console.error(`${id}: no está en hub_clients`); process.exit(1); }
  return s.docs[0];
};

let doc = await buscar();
const c = toDueClient(doc);
const d = doc.data();
console.log(`cobro mensual · ${aplicar ? "APLICADO" : "EN SECO (nada escrito ni cobrado; repetir con --aplicar)"} · terminal ${TERMINAL}`);
console.log(`  a quién: ${d.businessName} · ${id} (hub_clients/${doc.id}) · status ${d.status} · paymentStatus ${d.paymentStatus ?? null}`);
console.log(`  cuánto: ${monthlyChargeFor(c)} ILS`);
console.log(`  tarjeta: **** ${d.cardLastFour ?? "?"} · token ${c.cardcomToken ? "existe" : "NO existe"} · vigencia ${c.cardcomTokenExpMonth && c.cardcomTokenExpYear ? "presente" : "falta"}`);
console.log(`  nextChargeAt: ${c.nextChargeAt?.toISOString() ?? null} · vence ahora: ${isDue(c, new Date()) ? "sí" : "no"}${vencer ? " · --vencer lo pone en ahora" : ""}`);

if (!aplicar) process.exit(0);
if (!TERMINAL) { console.error("CARDCOM_TERMINAL vacío: no se cobra"); process.exit(1); }
if (!c.cardcomToken) { console.error("sin token de Cardcom: no se escribe ni se cobra (¿se pagó el alta?)"); process.exit(1); }

if (vencer) await doc.ref.update({ nextChargeAt: new Date() });
doc = await buscar();
const r = await cobrarSiVence(puertosFirestore(db as unknown as DbCobro, chargeToken), toDueClient(doc));
console.log(`  resultado: ${r.ok ? `cobrado · transacción ${r.transactionId ?? "?"}` : `NO cobrado · ${r.reason}`}`);
const despues = (await buscar()).data();
console.log(`  después: paymentStatus ${despues.paymentStatus} · nextChargeAt ${despues.nextChargeAt?.toDate?.().toISOString() ?? null}`);
process.exit(r.ok ? 0 : 1);
