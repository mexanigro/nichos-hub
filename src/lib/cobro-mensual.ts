// CARDCOM-01 (2026-10-13) — el cobro mensual de UN cliente, el mismo que corre el cron: lo llaman la ruta
// /api/cron/cardcom-charges (por cada vencido de su consulta) y scripts/cobro-mensual-uno.ts. Sin firebase ni next: la base
// y Cardcom entran por parámetro, así el script (node --experimental-strip-types) y el test usan exactamente esto.
import { chargeDueClient, isDue, tenantIdOf, type ChargePorts, type ChargeResult, type DueClient } from "./recurring-charge.ts";

type DocLeido = { id: string; data(): Record<string, unknown> | undefined };

/** hub_clients/{doc} → DueClient (nextChargeAt Timestamp o Date → Date). */
export function toDueClient(doc: DocLeido): DueClient {
  const c = (doc.data() ?? {}) as Record<string, any>;
  const next = c.nextChargeAt;
  return {
    docId: doc.id,
    clientId: typeof c.clientId === "string" ? c.clientId : undefined,
    businessName: c.businessName, email: c.email, adminEmail: c.adminEmail,
    cardcomToken: c.cardcomToken, cardcomTokenExpMonth: c.cardcomTokenExpMonth, cardcomTokenExpYear: c.cardcomTokenExpYear,
    paymentStatus: c.paymentStatus, pastDueAt: c.pastDueAt, plan: c.plan, tier: c.tier,
    nextChargeAt: next && typeof next.toDate === "function" ? next.toDate() : next instanceof Date ? next : null,
  };
}

type RefMinima = { id: string; set(f: Record<string, unknown>): Promise<unknown>; update(f: Record<string, unknown>): Promise<unknown> };
export type DbCobro = { collection(nombre: string): { doc(id?: string): RefMinima } };

/** Puertos Firestore del cobro: hub_payments nuevo por cobro, hub_payments y hub_clients por update. */
export function puertosFirestore(db: DbCobro, chargeToken: ChargePorts["chargeToken"]): ChargePorts {
  return {
    chargeToken,
    async createPayment(fields) { const ref = db.collection("hub_payments").doc(); await ref.set(fields); return ref.id; },
    async updatePayment(paymentId, fields) { await db.collection("hub_payments").doc(paymentId).update(fields); },
    async updateClient(docId, fields) { await db.collection("hub_clients").doc(docId).update(fields); },
  };
}

/** Cobra sólo si vence (isDue); si no, `not_due` sin llamar a Cardcom ni escribir. Un mismo `now` para el chequeo y el cobro. */
export async function cobrarSiVence(ports: ChargePorts, c: DueClient): Promise<ChargeResult> {
  const now = (ports.now ?? (() => new Date()))();
  if (!isDue(c, now)) return { clientId: tenantIdOf(c), ok: false, reason: "not_due" };
  return chargeDueClient({ ...ports, now: () => now }, c);
}
