export type PlanType = "web_crm" | "completo";

export const PLAN_AMOUNT = 770;
export const WEB_CRM_AMOUNT = PLAN_AMOUNT;
export const COMPLETO_AMOUNT = PLAN_AMOUNT;
export const CURRENCY = "ILS";

export function getPlanAmount(_plan?: PlanType): number {
  return PLAN_AMOUNT;
}

/** @deprecated — use PLAN_AMOUNT */
export const INITIAL_AMOUNT = PLAN_AMOUNT;
/** @deprecated — use PLAN_AMOUNT */
export const RECURRING_AMOUNT = PLAN_AMOUNT;
/** @deprecated */
export function getPaymentAmount(_isInitial: boolean): number {
  return PLAN_AMOUNT;
}
