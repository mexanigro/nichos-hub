export const INITIAL_AMOUNT = 4200;
export const RECURRING_AMOUNT = 500;
export const CURRENCY = "ILS";

export function getPaymentAmount(isInitial: boolean): number {
  return isInitial ? INITIAL_AMOUNT : RECURRING_AMOUNT;
}
