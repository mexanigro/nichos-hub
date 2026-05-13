export const INITIAL_AMOUNT = 800;
export const RECURRING_AMOUNT = 800;
export const CURRENCY = "ILS";

export function getPaymentAmount(isInitial: boolean): number {
  return isInitial ? INITIAL_AMOUNT : RECURRING_AMOUNT;
}
