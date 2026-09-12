import test from "node:test";
import assert from "node:assert/strict";
// Import por espacio de nombres: un export ausente da un assert funcional (undefined), no un error de enlace ESM.
import * as pricing from "./pricing.ts";

// Modelo comercial único (N10 n10-precios-v1, decisiones P-1…P-3 de Liam, 2026-09-12):
// alta 1500 por defecto, negociable en persona entre 1000 y 1500; cuota fija 250/mes; ILS.
// Un cambio accidental aquí es un bug de facturación: estos asserts congelan los valores de negocio.
test("constantes del plan único en ILS", () => {
  assert.equal(pricing.CURRENCY, "ILS");
  assert.equal(pricing.SETUP_AMOUNT_DEFAULT, 1500);
  assert.equal(pricing.SETUP_AMOUNT_MIN, 1000);
  assert.equal(pricing.SETUP_AMOUNT_MAX, 1500);
  assert.equal(pricing.MONTHLY_AMOUNT, 250);
});

test("isValidSetupAmount: rango cerrado 1000–1500, sólo enteros", () => {
  assert.equal(pricing.isValidSetupAmount(999), false, "999 fuera de rango");
  assert.equal(pricing.isValidSetupAmount(1000), true);
  assert.equal(pricing.isValidSetupAmount(1200), true);
  assert.equal(pricing.isValidSetupAmount(1500), true);
  assert.equal(pricing.isValidSetupAmount(1501), false, "1501 fuera de rango");
  assert.equal(pricing.isValidSetupAmount(1200.5), false, "sin decimales");
  assert.equal(pricing.isValidSetupAmount("1200"), false, "string no es importe");
  assert.equal(pricing.isValidSetupAmount(undefined), false);
});

test("getChargeAmount: inicial = alta negociada (o 1500), mensual = 250 siempre", () => {
  assert.equal(pricing.getChargeAmount("initial", 1200), 1200);
  assert.equal(pricing.getChargeAmount("initial", undefined), 1500, "sin importe fijado → default");
  assert.equal(pricing.getChargeAmount("initial", 999), 1500, "fuera de rango → default, nunca el valor inválido");
  assert.equal(pricing.getChargeAmount("initial", 1501), 1500);
  assert.equal(pricing.getChargeAmount("monthly", 1200), 250, "la cuota no depende del alta");
  assert.equal(pricing.getChargeAmount("monthly"), 250);
});

test("inicial ≠ mensual: un mismo cliente paga alta y luego cuota", () => {
  const initial = pricing.getChargeAmount("initial", 1000);
  const monthly = pricing.getChargeAmount("monthly", 1000);
  assert.notEqual(initial, monthly);
  assert.equal(initial, 1000);
  assert.equal(monthly, 250);
});

test("planes viejos en datos mapean al plan único: cualquier plan cobra 250/mes", () => {
  for (const plan of ["solo_web", "web_crm", "completo", "base", "pro", "enterprise", undefined] as const) {
    assert.equal(pricing.getChargeAmount("monthly", undefined, plan), 250, `plan ${plan}`);
  }
  assert.equal(pricing.PLAN_LABEL, "Web + CRM + Email");
});

test("monthlyChargeFor (cron): 250 para cualquier plan/tier heredado", () => {
  assert.equal(pricing.monthlyChargeFor({ plan: "enterprise", tier: "enterprise" }), 250);
  assert.equal(pricing.monthlyChargeFor({ plan: "solo_web", tier: "base" }), 250);
  assert.equal(pricing.monthlyChargeFor({}), 250);
  assert.notEqual(pricing.monthlyChargeFor({}), pricing.SETUP_AMOUNT_DEFAULT);
});

test("TIER_PRICING plano: los tiers heredados no cambian el precio (sin subida automática de precio)", () => {
  assert.equal(pricing.TIER_PRICING.base, 250);
  assert.equal(pricing.TIER_PRICING.pro, 250);
  assert.equal(pricing.TIER_PRICING.enterprise, 250);
  assert.equal(pricing.getTierAmount("enterprise"), 250);
});
