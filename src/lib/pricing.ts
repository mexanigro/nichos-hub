/**
 * Modelo comercial único (Liam, 2026-10-15): un plan — web + CRM + emails — por 250 NIS/mes, sin alta.
 * El primer mes se cobra al aceptar (/pago) y cubre un mes entero; el cron cobra los siguientes en la misma fecha.
 * Antes (N10 n10-precios-v1, 2026-09-12) había un alta de 1500, negociable en persona entre 1000 y 1500
 * (`hub_clients.setupAmount`): los `hub_payments` de type `initial` que quedan en datos son de esa época.
 * WhatsApp, IA y voz son opcionales «a cotizar», fuera de este modelo.
 */
export const CURRENCY = "ILS";
export const MONTHLY_AMOUNT = 250;

export const PLAN_ID = "web_crm";
export const PLAN_LABEL = "Web + CRM + Email";

/** Valores heredados en datos (`hub_clients.plan`, `hub_contract_leads.plan`); todos mapean al plan único. */
export type PlanType = "solo_web" | "web_crm" | "completo" | "base" | "pro" | "enterprise";

/** Cuota mensual de un documento hub_clients (cron): 250, sea cual sea su plan/tier heredado. */
export function monthlyChargeFor(_client: { plan?: unknown; tier?: unknown }): number {
  return MONTHLY_AMOUNT;
}
