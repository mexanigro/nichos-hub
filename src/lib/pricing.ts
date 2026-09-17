/**
 * Modelo comercial único (N10 n10-precios-v1, decisiones de Liam 2026-09-12):
 * un plan — web + CRM + emails — con alta única y cuota mensual fija.
 *   - Alta por la web: 1500 NIS fija.
 *   - Alta en persona: negociable entre 1000 y 1500, fijada por cliente en el hub (`hub_clients.setupAmount`).
 *   - Cuota: 250 NIS/mes, no depende del alta.
 * WhatsApp, IA y voz son opcionales «a cotizar», fuera de este modelo.
 */
export const CURRENCY = "ILS";
export const SETUP_AMOUNT_DEFAULT = 1500;
export const SETUP_AMOUNT_MIN = 1000;
export const SETUP_AMOUNT_MAX = 1500;
export const MONTHLY_AMOUNT = 250;

export const PLAN_ID = "web_crm";
export const PLAN_LABEL = "Web + CRM + Email";

/** Valores heredados en datos (`hub_clients.plan`, `hub_contract_leads.plan`); todos mapean al plan único. */
export type PlanType = "solo_web" | "web_crm" | "completo" | "base" | "pro" | "enterprise";

export type ChargeKind = "initial" | "monthly";

/** Entero dentro del rango negociable. Cualquier otra cosa (string, decimal, fuera de rango) no es un importe de alta. */
export function isValidSetupAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= SETUP_AMOUNT_MIN && value <= SETUP_AMOUNT_MAX;
}

/** Importe de alta a cobrar: el negociado si es válido; si no, el fijo de la web. Nunca devuelve un valor inválido. */
export function resolveSetupAmount(value: unknown): number {
  return isValidSetupAmount(value) ? value : SETUP_AMOUNT_DEFAULT;
}

/**
 * Importe de un cobro. `initial` = alta (negociada o 1500); `monthly` = 250.
 * `_plan` se acepta para los llamadores con datos viejos: no cambia el importe.
 */
export function getChargeAmount(kind: ChargeKind, setupAmount?: unknown, _plan?: PlanType): number {
  return kind === "initial" ? resolveSetupAmount(setupAmount) : MONTHLY_AMOUNT;
}

/** Cuota mensual de un documento hub_clients (cron): 250, sea cual sea su plan/tier heredado. */
export function monthlyChargeFor(_client: { plan?: unknown; tier?: unknown }): number {
  return MONTHLY_AMOUNT;
}
