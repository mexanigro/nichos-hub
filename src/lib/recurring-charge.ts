// P-01 (Capa A) — cobro mensual de un cliente vencido, con puertos. Identidad del cliente en hub_payments =
// hub_clients.clientId (id de tenant, D-P1-3); antes el cron usaba el id del documento (C-10 de N11).
import type { ChargeTokenResult } from "./cardcom.ts";
import { monthlyChargeFor, PLAN_LABEL } from "./pricing.ts";
import { nextChargeAfter } from "./payment-credit.ts";

export type DueClient = {
  docId: string;
  clientId?: string;
  businessName?: string;
  email?: string;
  adminEmail?: string;
  cardcomToken?: string | null;
  cardcomTokenExpMonth?: string | null;
  cardcomTokenExpYear?: string | null;
  paymentStatus?: string;
  nextChargeAt?: Date | null;
  pastDueAt?: unknown;
  plan?: unknown;
  tier?: unknown;
};

export interface ChargePorts {
  chargeToken(params: { token: string; cardValidityMonth: string; cardValidityYear: string; amount: number; productName: string; customerEmail?: string; customerName?: string; language: "he" | "en"; externalId: string }): Promise<ChargeTokenResult>;
  createPayment(fields: Record<string, unknown>): Promise<string>;
  updatePayment(paymentId: string, fields: Record<string, unknown>): Promise<void>;
  updateClient(docId: string, fields: Record<string, unknown>): Promise<void>;
  now?: () => Date;
}

export type ChargeResult = { clientId: string; ok: true; transactionId?: string } | { clientId: string; ok: false; reason: string };

export function tenantIdOf(c: DueClient): string {
  return c.clientId || c.docId;
}

export function isDue(c: DueClient, now: Date): boolean {
  return (c.paymentStatus === "active" || c.paymentStatus === "past_due") && c.nextChargeAt instanceof Date && c.nextChargeAt.getTime() <= now.getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function chargeDueClient(ports: ChargePorts, c: DueClient): Promise<ChargeResult> {
  const clientId = tenantIdOf(c);
  const now = (ports.now ?? (() => new Date()))();
  const amount = monthlyChargeFor(c);

  if (!c.cardcomToken) return { clientId, ok: false, reason: "no_token" };
  if (!c.cardcomTokenExpMonth || !c.cardcomTokenExpYear) return { clientId, ok: false, reason: "no_token_expiry" };

  const externalId = `${clientId}-${now.getTime()}`;
  // Write-intent-first: el registro nace pending antes de cobrar; si el write posterior falla queda la evidencia.
  const paymentId = await ports.createPayment({
    clientId, clientDocId: c.docId, amount, currency: "ILS", type: "subscription_recurring", status: "pending", externalId, createdAt: now,
  });

  const pastDue = (reason: string) => ports.updateClient(c.docId, {
    paymentStatus: "past_due", pastDueAt: c.pastDueAt || now, pastDueReason: reason, nextChargeAt: new Date(now.getTime() + DAY_MS), updatedAt: now,
  });

  let result: ChargeTokenResult;
  try {
    result = await ports.chargeToken({
      token: c.cardcomToken, cardValidityMonth: c.cardcomTokenExpMonth, cardValidityYear: c.cardcomTokenExpYear, amount,
      productName: `${PLAN_LABEL} (mensualidad)`, customerEmail: c.email || undefined, customerName: c.businessName || c.adminEmail || undefined,
      language: "he", externalId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "charge_exception";
    await ports.updatePayment(paymentId, { status: "failed", error: msg });
    await pastDue("charge_exception");
    return { clientId, ok: false, reason: "charge_exception" };
  }

  if (result.success) {
    await ports.updatePayment(paymentId, { status: "success", cardcomTransactionId: result.transactionId || null, approvalNumber: result.approvalNumber || null });
    await ports.updateClient(c.docId, {
      paymentStatus: "active", lastChargedAt: now, nextChargeAt: nextChargeAfter(now), cardcomTransactionId: result.transactionId || null,
      pastDueAt: null, pastDueReason: null, updatedAt: now,
    });
    return { clientId, ok: true, transactionId: result.transactionId };
  }

  // ponytail: reintento a 24 h sin fin y sin suspender, como antes; la política de mora (24/72/168 h, aviso, suspensión) es P-03.
  await ports.updatePayment(paymentId, { status: "failed", error: result.error || null });
  await pastDue(result.error || "charge_failed");
  return { clientId, ok: false, reason: result.error || "charge_failed" };
}
