import type { PaymentStatus, PaymentType } from "../types/index.ts";

// Los tres caminos que escriben hub_payments no usan las mismas palabras:
//   /pago (contract + verify-payment)  type "recurring" (o "initial" antes de 2026-10-15) · status pending → paid
//   cron (recurring-charge.ts)         type "subscription_recurring" · status pending → success | failed, sin billingDate
//   compra web (cardcom-promote.ts)    type "subscription_initial" · status success
// El hub los muestra con un solo vocabulario: si no, la insignia de estado no conoce "success" (se rompía la ficha)
// y los cobros del cron, sin billingDate, quedaban fuera de las listas ordenadas por esa fecha.

const ESTADOS: Record<string, PaymentStatus> = {
  paid: "paid",
  success: "paid",
  pending: "pending",
  failed: "failed",
  cancelled: "cancelled",
};

export function estadoMostrado(estado: unknown): PaymentStatus {
  return (typeof estado === "string" && ESTADOS[estado]) || "pending";
}

/** «initial» es el alta de antes de 2026-10-15; todo lo demás es una cuota. */
export function tipoMostrado(tipo: unknown): PaymentType {
  return tipo === "initial" ? "initial" : "recurring";
}

/** La fecha de un pago: billingDate si la tiene; si no (cron), createdAt. */
export function fechaDePago(p: { billingDate?: Date | null; createdAt?: Date | null }): Date | undefined {
  return p.billingDate ?? p.createdAt ?? undefined;
}

/** Más reciente primero; los que no tienen fecha, al final. */
export function ordenarPagos<T extends { billingDate?: Date | null; createdAt?: Date | null }>(pagos: T[]): T[] {
  return [...pagos].sort((a, b) => (fechaDePago(b)?.getTime() ?? -Infinity) - (fechaDePago(a)?.getTime() ?? -Infinity));
}
