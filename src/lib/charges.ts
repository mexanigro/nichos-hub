import { db } from "@/lib/firebase-admin";
import { getChargeAmount, type ChargeKind } from "@/lib/pricing";

/**
 * Un solo criterio para «qué cobra este cliente ahora», compartido por /api/payments/contract y
 * /api/cardcom/create-payment: verify-payment compara el importe cobrado con el hub_payments pendiente,
 * así que los dos deben calcular exactamente lo mismo.
 *   - Sin alta pagada (`hub_payments` type initial + status paid) → initial = setupAmount del cliente (o 1500).
 *   - Con alta pagada → monthly = 250.
 */
export async function resolveClientCharge(
  clientId: string,
  clientData: { setupAmount?: unknown },
): Promise<{ kind: ChargeKind; amount: number }> {
  const paidInitial = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("type", "==", "initial")
    .where("status", "==", "paid")
    .limit(1)
    .get();
  const kind: ChargeKind = paidInitial.empty ? "initial" : "monthly";
  return { kind, amount: getChargeAmount(kind, clientData.setupAmount) };
}
