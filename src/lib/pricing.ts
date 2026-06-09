import type { BookingTier } from "@/types";

export type PlanType = "solo_web" | "web_crm" | "completo" | "base" | "pro" | "enterprise";

export const SOLO_WEB_AMOUNT = 480;
export const PLAN_AMOUNT = 770;
export const WEB_CRM_AMOUNT = PLAN_AMOUNT;
export const COMPLETO_AMOUNT = PLAN_AMOUNT;
export const CURRENCY = "ILS";

export const TIER_PRICING: Record<BookingTier, number> = {
  base: 770,
  pro: 960,
  enterprise: 1270,
};

export const TIER_LIMITS: Record<BookingTier, number> = {
  base: 100,
  pro: 300,
  enterprise: Infinity,
};

export const TIER_LABELS: Record<BookingTier, string> = {
  base: "Base",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const TIER_ORDER: BookingTier[] = ["base", "pro", "enterprise"];

export function getNextTier(current: BookingTier): BookingTier | null {
  const idx = TIER_ORDER.indexOf(current);
  return idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

export function getTierAmount(tier: BookingTier): number {
  return TIER_PRICING[tier];
}

export function getPlanAmount(plan?: PlanType): number {
  if (plan === "solo_web") return SOLO_WEB_AMOUNT;
  if (plan === "pro") return TIER_PRICING.pro;
  if (plan === "enterprise") return TIER_PRICING.enterprise;
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
