/**
 * P-01 (Capa A) — cron de cobros alineado con lo que persiste verify-payment.
 * RED sobre 3348dbc: el cron identificaba al cliente por el id del documento (C-10; 16/18 hub_clients con doc.id ≠ clientId).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chargeDueClient, isDue, tenantIdOf, type ChargePorts, type DueClient } from "./recurring-charge.ts";

const NOW = new Date("2026-10-14T10:30:00.000Z");
const paidClient: DueClient = {
  docId: "hmCmmt-doc", clientId: "client_barber_01", businessName: "Barber", email: "b@x.il",
  cardcomToken: "tok-guid", cardcomTokenExpMonth: "12", cardcomTokenExpYear: "28",
  paymentStatus: "active", nextChargeAt: new Date("2026-10-14T10:30:00.000Z"),
};

function fakePorts(chargeResult: { success: boolean; transactionId?: string; approvalNumber?: string; error?: string }) {
  const calls: Array<{ op: string; args: unknown }> = [];
  const ports: ChargePorts = {
    chargeToken: async (p) => { calls.push({ op: "chargeToken", args: p }); return chargeResult; },
    createPayment: async (fields) => { calls.push({ op: "createPayment", args: fields }); return "pay-9"; },
    updatePayment: async (id, fields) => { calls.push({ op: "updatePayment", args: { id, fields } }); },
    updateClient: async (docId, fields) => { calls.push({ op: "updateClient", args: { docId, fields } }); },
    now: () => NOW,
  };
  return { ports, calls };
}

test("tenantIdOf: siempre hub_clients.clientId; el doc id sólo si no hay clientId (D-P1-3)", () => {
  assert.equal(tenantIdOf(paidClient), "client_barber_01");
  assert.equal(tenantIdOf({ docId: "legacy" }), "legacy");
});

test("isDue: active/past_due con nextChargeAt <= now; futuro o sin fecha no", () => {
  assert.equal(isDue(paidClient, NOW), true);
  assert.equal(isDue({ ...paidClient, nextChargeAt: new Date("2026-10-15T00:00:00.000Z") }, NOW), false);
  assert.equal(isDue({ ...paidClient, nextChargeAt: undefined }, NOW), false);
  assert.equal(isDue({ ...paidClient, paymentStatus: "past_due" }, NOW), true);
  assert.equal(isDue({ ...paidClient, paymentStatus: "pending" }, NOW), false);
});

test("recién pagado y vencido: cobra 250 con el token; hub_payments.clientId = clientId de tenant; éxito → nextChargeAt +1 mes", async () => {
  const { ports, calls } = fakePorts({ success: true, transactionId: "tx-9", approvalNumber: "A1" });
  const r = await chargeDueClient(ports, paidClient);
  assert.equal(r.ok, true);
  const charge = calls.find((c) => c.op === "chargeToken")!.args as { amount: number; token: string };
  assert.equal(charge.amount, 250);
  assert.equal(charge.token, "tok-guid");
  const created = calls.find((c) => c.op === "createPayment")!.args as { clientId: string; status: string; type: string };
  assert.equal(created.clientId, "client_barber_01", "identidad por clientId de tenant, no por doc id");
  assert.equal(created.status, "pending");
  assert.equal(created.type, "subscription_recurring");
  const upd = calls.find((c) => c.op === "updateClient")!.args as { docId: string; fields: Record<string, unknown> };
  assert.equal(upd.docId, "hmCmmt-doc");
  assert.equal(upd.fields.paymentStatus, "active");
  assert.equal((upd.fields.nextChargeAt as Date).toISOString(), "2026-11-14T10:30:00.000Z");
  assert.equal(calls.filter((c) => c.op === "createPayment").length, 1);
  assert.ok(calls.findIndex((c) => c.op === "createPayment") < calls.findIndex((c) => c.op === "chargeToken"), "write-intent-first");
});

test("sin token → no_token, sin llamar a Cardcom ni escribir", async () => {
  const { ports, calls } = fakePorts({ success: true });
  const r = await chargeDueClient(ports, { ...paidClient, cardcomToken: undefined });
  assert.deepEqual(r, { clientId: "client_barber_01", ok: false, reason: "no_token" });
  assert.equal(calls.length, 0);
});

test("fallo de Cardcom → pago failed, cliente past_due y reintento a 24 h", async () => {
  const { ports, calls } = fakePorts({ success: false, error: "declined" });
  const r = await chargeDueClient(ports, paidClient);
  assert.equal(r.ok, false);
  const upd = calls.find((c) => c.op === "updateClient")!.args as { fields: Record<string, unknown> };
  assert.equal(upd.fields.paymentStatus, "past_due");
  assert.equal((upd.fields.nextChargeAt as Date).toISOString(), "2026-10-15T10:30:00.000Z");
  const pay = calls.find((c) => c.op === "updatePayment")!.args as { fields: Record<string, unknown> };
  assert.equal(pay.fields.status, "failed");
});

const ROUTE = fileURLToPath(new URL("../app/api/cron/cardcom-charges/route.ts", import.meta.url));
test("cableado: el cron delega en chargeDueClient y no usa el id del documento como identidad", () => {
  const src = readFileSync(ROUTE, "utf8");
  assert.ok(src.includes("chargeDueClient("), "el cron no llama a chargeDueClient");
  assert.equal(/const clientId = clientDoc\.id/.test(src), false, "identidad por doc id (C-10)");
});
