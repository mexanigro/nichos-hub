export type PlanType = "web_crm" | "completo";

export const WEB_CRM_AMOUNT = 790;
export const COMPLETO_AMOUNT = 990;
export const CURRENCY = "ILS";

export function getPlanAmount(plan: PlanType): number {
  return plan === "completo" ? COMPLETO_AMOUNT : WEB_CRM_AMOUNT;
}

/** @deprecated — use getPlanAmount instead */
export const INITIAL_AMOUNT = WEB_CRM_AMOUNT;
/** @deprecated — use getPlanAmount instead */
export const RECURRING_AMOUNT = WEB_CRM_AMOUNT;
/** @deprecated */
export function getPaymentAmount(isInitial: boolean): number {
  return isInitial ? INITIAL_AMOUNT : RECURRING_AMOUNT;
}
