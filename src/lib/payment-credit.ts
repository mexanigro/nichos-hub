// P-01 (Capa A, p01-recurrente-v1) — acreditación de un pago Cardcom verificado en el camino en persona
// (/pago/{clientId} → verify-payment). Módulo puro con puertos: sin firebase, sin next, sin Cardcom.
// Antes (3348dbc) la ruta sólo escribía paymentStatus: active y el cron respondía no_token para siempre (N11 H-N11-1).
import type { VerifyPaymentResult } from "./cardcom.ts";

export type VerifiedPayment = Pick<VerifyPaymentResult, "transactionId" | "cardLastFour" | "token" | "cardValidityMonth" | "cardValidityYear" | "approvalNumber" | "amount">;
export type PendingPayment = { id: string; amount?: number; type?: string };
export type ClientRef = { id: string; status?: string };

export interface CreditPorts {
  /** hub_payments con este lowProfileCode ya en `paid` (idempotencia). */
  findPaidByLowProfile(lowProfileCode: string): Promise<{ transactionId?: string | null; cardLastFour?: string | null } | null>;
  /** hub_payments `pending` más reciente del clientId de tenant. */
  findLatestPending(clientId: string): Promise<PendingPayment | null>;
  /** Marca `paid` sólo si sigue `pending` (transacción). false = otro proceso ganó. */
  markPaid(paymentId: string, fields: Record<string, unknown>): Promise<boolean>;
  /** hub_clients por campo clientId (id de tenant). */
  findClient(clientId: string): Promise<ClientRef | null>;
  updateClient(docId: string, fields: Record<string, unknown>): Promise<void>;
}

export type CreditOutcome =
  | { outcome: "already_verified"; transactionId?: string | null; cardLastFour?: string | null }
  | { outcome: "no_pending" }
  | { outcome: "amount_mismatch"; charged: number; expected: number }
  | { outcome: "credited"; paymentId: string; clientDocId: string | null; activated: boolean; nextChargeAt: Date };

/** D-P1-2: un mes calendario después, misma hora. ponytail: setMonth desborda a fin de mes (31 ene → 3 mar); Capa B si molesta. */
export function nextChargeAfter(now: Date): Date {
  const d = new Date(now.getTime());
  d.setMonth(d.getMonth() + 1);
  return d;
}

/** Campos que deja en hub_clients un pago acreditado: token para el cron, próxima cuota y activación (D-P1-1). */
export function buildClientCreditFields(verify: VerifiedPayment, client: ClientRef, now: Date): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    paymentStatus: "active",
    cardcomToken: verify.token || null,
    cardcomTokenExpMonth: verify.cardValidityMonth || null,
    cardcomTokenExpYear: verify.cardValidityYear || null,
    cardcomTransactionId: verify.transactionId || null,
    cardLastFour: verify.cardLastFour || null,
    lastChargedAt: now,
    nextChargeAt: nextChargeAfter(now),
    pastDueAt: null,
    pastDueReason: null,
    updatedAt: now,
  };
  if (client.status === "demo") {
    fields.status = "active";
    fields.activatedAt = now;
  }
  return fields;
}

export async function creditVerifiedPayment(
  ports: CreditPorts,
  p: { clientId: string; lowProfileCode: string; verify: VerifiedPayment; now?: Date },
): Promise<CreditOutcome> {
  const now = p.now ?? new Date();
  const already = await ports.findPaidByLowProfile(p.lowProfileCode);
  if (already) return { outcome: "already_verified", transactionId: already.transactionId, cardLastFour: already.cardLastFour };

  const pending = await ports.findLatestPending(p.clientId);
  if (!pending) return { outcome: "no_pending" };

  // Tolerancia de 1 agora por redondeo (mismo criterio que antes).
  if (typeof pending.amount === "number" && p.verify.amount !== undefined && Math.abs(p.verify.amount - pending.amount) > 0.01) {
    return { outcome: "amount_mismatch", charged: p.verify.amount, expected: pending.amount };
  }

  const won = await ports.markPaid(pending.id, {
    status: "paid",
    cardcomTransactionId: p.verify.transactionId || null,
    cardcomLowProfileCode: p.lowProfileCode,
    cardLastFour: p.verify.cardLastFour || null,
    approvalNumber: p.verify.approvalNumber || null,
    updatedAt: now,
  });
  if (!won) return { outcome: "already_verified", transactionId: p.verify.transactionId ?? null, cardLastFour: p.verify.cardLastFour ?? null };

  const client = await ports.findClient(p.clientId);
  const nextChargeAt = nextChargeAfter(now);
  if (!client) return { outcome: "credited", paymentId: pending.id, clientDocId: null, activated: false, nextChargeAt };

  const fields = buildClientCreditFields(p.verify, client, now);
  await ports.updateClient(client.id, fields);
  return { outcome: "credited", paymentId: pending.id, clientDocId: client.id, activated: fields.status === "active", nextChargeAt };
}
