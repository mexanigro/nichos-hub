import test from "node:test";
import assert from "node:assert/strict";
// Import por espacio de nombres: un export ausente da un assert funcional (undefined), no un error de enlace ESM.
import * as pricing from "./pricing.ts";

// Modelo comercial único (Liam, 2026-10-15): 250/mes por todo, sin alta; ILS.
// Un cambio accidental aquí es un bug de facturación: estos asserts congelan los valores de negocio.
test("constantes del plan único en ILS, sin alta", () => {
  assert.equal(pricing.CURRENCY, "ILS");
  assert.equal(pricing.MONTHLY_AMOUNT, 250);
  assert.equal(pricing.PLAN_LABEL, "Web + CRM + Email");
  for (const viejo of ["SETUP_AMOUNT_DEFAULT", "SETUP_AMOUNT_MIN", "SETUP_AMOUNT_MAX", "isValidSetupAmount", "resolveSetupAmount", "getChargeAmount"]) {
    assert.equal((pricing as Record<string, unknown>)[viejo], undefined, `${viejo} no existe: no hay alta`);
  }
});

test("monthlyChargeFor (cron): 250 para cualquier plan/tier heredado", () => {
  for (const plan of ["solo_web", "web_crm", "completo", "base", "pro", "enterprise", undefined] as const) {
    assert.equal(pricing.monthlyChargeFor({ plan, tier: plan }), 250, `plan ${plan}`);
  }
  assert.equal(pricing.monthlyChargeFor({}), 250);
});
