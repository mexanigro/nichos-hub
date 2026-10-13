/**
 * CARDCOM-01 (2026-10-13) — el cobro mensual de UN cliente (cobrarSiVence) con Cardcom y Firestore inyectados: el mismo que
 * corre la ruta del cron y scripts/cobro-mensual-uno.ts. Las dos direcciones: cobra al vencido y no al que no vence; y un
 * rechazo de Cardcom deja el cobro registrado como fallido.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cobrarSiVence, puertosFirestore, toDueClient, type DbCobro } from "./cobro-mensual.ts";
import type { ChargePorts } from "./recurring-charge.ts";

const NOW = new Date("2026-10-13T12:00:00.000Z");

/** Firestore en memoria: hub_clients/{doc} y hub_payments/{auto}. */
function firestoreFalsa(cliente: Record<string, unknown>) {
  const col: Record<string, Map<string, Record<string, unknown>>> = {
    hub_clients: new Map([["doc-1", { ...cliente }]]),
    hub_payments: new Map(),
  };
  let n = 0;
  const db: DbCobro = {
    collection(nombre) {
      const m = (col[nombre] ??= new Map());
      return {
        doc(id) {
          const docId = id ?? `pay-${++n}`;
          return {
            id: docId,
            async set(f) { m.set(docId, { ...f }); },
            async update(f) { if (!m.has(docId)) throw new Error(`no existe ${nombre}/${docId}`); m.set(docId, { ...m.get(docId), ...f }); },
          };
        },
      };
    },
  };
  const leer = () => toDueClient({ id: "doc-1", data: () => col.hub_clients.get("doc-1") });
  return { db, col, leer };
}

function cardcomFalso(respuesta: { success: boolean; transactionId?: string; error?: string }) {
  const llamadas: Array<Parameters<ChargePorts["chargeToken"]>[0]> = [];
  const chargeToken: ChargePorts["chargeToken"] = async (p) => { llamadas.push(p); return respuesta; };
  return { chargeToken, llamadas };
}

const base = {
  clientId: "demo-prueba", businessName: "Prueba", cardcomToken: "tok-guid", cardcomTokenExpMonth: "12", cardcomTokenExpYear: "29",
  paymentStatus: "active",
};
// Timestamp de Firestore: toDueClient lo pasa a Date.
const ts = (d: Date) => ({ toDate: () => d });

test("vencido: cobra 250 con su token; hub_payments success y nextChargeAt un mes después", async () => {
  const fs = firestoreFalsa({ ...base, nextChargeAt: ts(new Date("2026-10-13T11:00:00.000Z")) });
  const cc = cardcomFalso({ success: true, transactionId: "tx-1" });
  const r = await cobrarSiVence({ ...puertosFirestore(fs.db, cc.chargeToken), now: () => NOW }, fs.leer());

  assert.deepEqual(r, { clientId: "demo-prueba", ok: true, transactionId: "tx-1" });
  assert.equal(cc.llamadas.length, 1);
  assert.equal(cc.llamadas[0].amount, 250);
  assert.equal(cc.llamadas[0].token, "tok-guid");
  const pagos = [...fs.col.hub_payments.values()];
  assert.equal(pagos.length, 1);
  assert.equal(pagos[0].type, "subscription_recurring");
  assert.equal(pagos[0].status, "success");
  assert.equal(pagos[0].amount, 250);
  assert.equal(pagos[0].clientId, "demo-prueba");
  const c = fs.col.hub_clients.get("doc-1")!;
  assert.equal(c.paymentStatus, "active");
  assert.equal((c.nextChargeAt as Date).toISOString(), "2026-11-13T12:00:00.000Z");
});

test("no vence: not_due, sin llamar a Cardcom y sin escribir nada", async () => {
  const fs = firestoreFalsa({ ...base, nextChargeAt: ts(new Date("2026-11-13T11:00:00.000Z")) });
  const antes = JSON.stringify(fs.col.hub_clients.get("doc-1"));
  const cc = cardcomFalso({ success: true, transactionId: "tx-1" });
  const r = await cobrarSiVence({ ...puertosFirestore(fs.db, cc.chargeToken), now: () => NOW }, fs.leer());

  assert.deepEqual(r, { clientId: "demo-prueba", ok: false, reason: "not_due" });
  assert.equal(cc.llamadas.length, 0);
  assert.equal(fs.col.hub_payments.size, 0);
  assert.equal(JSON.stringify(fs.col.hub_clients.get("doc-1")), antes);
});

test("sin fecha o archivado/sin estado de pago: no vence, no cobra", async () => {
  for (const extra of [{ nextChargeAt: null }, { paymentStatus: undefined, nextChargeAt: ts(new Date("2026-10-01T00:00:00Z")) }]) {
    const fs = firestoreFalsa({ ...base, ...extra });
    const cc = cardcomFalso({ success: true });
    const r = await cobrarSiVence({ ...puertosFirestore(fs.db, cc.chargeToken), now: () => NOW }, fs.leer());
    assert.equal(r.ok, false);
    assert.equal(cc.llamadas.length, 0);
    assert.equal(fs.col.hub_payments.size, 0);
  }
});

test("Cardcom rechaza: el cobro queda registrado failed y el cliente past_due con reintento a 24 h", async () => {
  const fs = firestoreFalsa({ ...base, nextChargeAt: ts(new Date("2026-10-13T11:00:00.000Z")) });
  const cc = cardcomFalso({ success: false, error: "declined" });
  const r = await cobrarSiVence({ ...puertosFirestore(fs.db, cc.chargeToken), now: () => NOW }, fs.leer());

  assert.deepEqual(r, { clientId: "demo-prueba", ok: false, reason: "declined" });
  const pagos = [...fs.col.hub_payments.values()];
  assert.equal(pagos.length, 1);
  assert.equal(pagos[0].status, "failed");
  assert.equal(pagos[0].error, "declined");
  assert.equal(pagos[0].amount, 250);
  const c = fs.col.hub_clients.get("doc-1")!;
  assert.equal(c.paymentStatus, "past_due");
  assert.equal((c.nextChargeAt as Date).toISOString(), "2026-10-14T12:00:00.000Z");
});

test("cableado: la ruta del cron y el script usan cobrarSiVence; ninguno cobra por su cuenta", () => {
  const leer = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
  const ruta = leer("../app/api/cron/cardcom-charges/route.ts");
  const script = leer("../../scripts/cobro-mensual-uno.ts");
  for (const [nombre, src] of [["ruta", ruta], ["script", script]] as const) {
    assert.ok(src.includes("cobrarSiVence("), `${nombre} no llama a cobrarSiVence`);
    assert.equal(/chargeDueClient\(|chargeToken\(\{/.test(src), false, `${nombre} cobra sin pasar por cobrarSiVence`);
  }
});
