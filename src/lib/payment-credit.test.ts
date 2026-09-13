/**
 * P-01 (Capa A, p01-recurrente-v1) — acreditación del pago del camino en persona.
 * RED sobre 3348dbc: verify-payment no persistía cardcomToken/exp/cardLastFour/nextChargeAt ni activaba al cliente
 * (N11 H-N11-1; censo: 0/18 hub_clients con token). Los tests de comportamiento usan puertos en memoria;
 * el guard por fuente exige que la ruta delegue en creditVerifiedPayment (los handlers de Next no se importan).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { creditVerifiedPayment, nextChargeAfter, type CreditPorts } from "./payment-credit.ts";

const NOW = new Date("2026-09-14T10:30:00.000Z");
const VERIFY = { transactionId: "tx-1", cardLastFour: "0008", token: "tok-guid", cardValidityMonth: "12", cardValidityYear: "28", amount: 1000 };

function fakePorts(opts: { paidAlready?: boolean; pending?: { id: string; amount?: number; type?: string } | null; client?: { id: string; status?: string } | null }) {
  const writes: Array<{ op: string; id: string; fields: Record<string, unknown> }> = [];
  const ports: CreditPorts = {
    findPaidByLowProfile: async () => (opts.paidAlready ? { transactionId: "tx-old", cardLastFour: "1111" } : null),
    findLatestPending: async () => (opts.pending === undefined ? { id: "pay-1", amount: 1000, type: "initial" } : opts.pending),
    markPaid: async (id, fields) => { writes.push({ op: "markPaid", id, fields }); return true; },
    findClient: async () => (opts.client === undefined ? { id: "doc-abc", status: "demo" } : opts.client),
    updateClient: async (id, fields) => { writes.push({ op: "updateClient", id, fields }); },
  };
  return { ports, writes };
}

test("nextChargeAfter: un mes calendario después, misma hora", () => {
  assert.equal(nextChargeAfter(NOW).toISOString(), "2026-10-14T10:30:00.000Z");
});

test("alta pagada: hub_payments paid (type initial, mismo id) y hub_clients con token, exp, últimos 4, nextChargeAt y status active", async () => {
  const { ports, writes } = fakePorts({});
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-1", verify: VERIFY, now: NOW });
  assert.equal(r.outcome, "credited");
  const paid = writes.find((w) => w.op === "markPaid")!;
  assert.equal(paid.id, "pay-1");
  assert.equal(paid.fields.status, "paid");
  assert.equal(paid.fields.cardcomLowProfileCode, "lp-1");
  assert.equal("type" in paid.fields, false, "no pisa el type del pendiente");
  const cli = writes.find((w) => w.op === "updateClient")!;
  assert.equal(cli.id, "doc-abc");
  assert.equal(cli.fields.cardcomToken, "tok-guid");
  assert.equal(cli.fields.cardcomTokenExpMonth, "12");
  assert.equal(cli.fields.cardcomTokenExpYear, "28");
  assert.equal(cli.fields.cardLastFour, "0008");
  assert.equal(cli.fields.paymentStatus, "active");
  assert.equal((cli.fields.nextChargeAt as Date).toISOString(), "2026-10-14T10:30:00.000Z");
  assert.equal((cli.fields.lastChargedAt as Date).toISOString(), NOW.toISOString());
  assert.equal(cli.fields.status, "active", "D-P1-1: un cliente que pagó es cliente");
  assert.ok(cli.fields.activatedAt instanceof Date);
});

test("cuota (cliente ya active): no toca status ni activatedAt, sí renueva nextChargeAt", async () => {
  const { ports, writes } = fakePorts({ pending: { id: "pay-2", amount: 250, type: "recurring" }, client: { id: "doc-abc", status: "active" } });
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-2", verify: { ...VERIFY, amount: 250 }, now: NOW });
  assert.equal(r.outcome, "credited");
  const cli = writes.find((w) => w.op === "updateClient")!;
  assert.equal("status" in cli.fields, false);
  assert.equal("activatedAt" in cli.fields, false);
  assert.equal((cli.fields.nextChargeAt as Date).toISOString(), "2026-10-14T10:30:00.000Z");
});

test("idempotente: el mismo lowProfileCode ya paid → already_verified y 0 escrituras", async () => {
  const { ports, writes } = fakePorts({ paidAlready: true });
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-1", verify: VERIFY, now: NOW });
  assert.equal(r.outcome, "already_verified");
  assert.equal(writes.length, 0);
});

test("monto distinto al pendiente → amount_mismatch y 0 escrituras", async () => {
  const { ports, writes } = fakePorts({ pending: { id: "pay-1", amount: 1500, type: "initial" } });
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-1", verify: VERIFY, now: NOW });
  assert.equal(r.outcome, "amount_mismatch");
  assert.equal(writes.length, 0);
});

test("sin pendiente → no_pending y 0 escrituras", async () => {
  const { ports, writes } = fakePorts({ pending: null });
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-1", verify: VERIFY, now: NOW });
  assert.equal(r.outcome, "no_pending");
  assert.equal(writes.length, 0);
});

test("sin token en el verify: acredita el pago pero deja cardcomToken null (el cron dirá no_token)", async () => {
  const { ports, writes } = fakePorts({});
  const r = await creditVerifiedPayment(ports, { clientId: "demo-x", lowProfileCode: "lp-1", verify: { ...VERIFY, token: undefined }, now: NOW });
  assert.equal(r.outcome, "credited");
  const cli = writes.find((w) => w.op === "updateClient")!;
  assert.equal(cli.fields.cardcomToken, null);
});

const ROUTE = fileURLToPath(new URL("../app/api/cardcom/verify-payment/route.ts", import.meta.url));
test("cableado: verify-payment/route.ts delega la acreditación en creditVerifiedPayment y no escribe paymentStatus a mano", () => {
  const src = readFileSync(ROUTE, "utf8");
  assert.ok(src.includes("creditVerifiedPayment("), "la ruta no llama a creditVerifiedPayment");
  assert.ok(src.indexOf("checkPaymentTerminal(") < src.indexOf("creditVerifiedPayment("), "el terminal se valida antes de acreditar");
  assert.equal(/paymentStatus:\s*"active"/.test(src), false, "la ruta no debe acreditar por su cuenta");
});
