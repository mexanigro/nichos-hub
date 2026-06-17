import test from "node:test";
import assert from "node:assert/strict";
import {
  SOLO_WEB_AMOUNT,
  PLAN_AMOUNT,
  WEB_CRM_AMOUNT,
  COMPLETO_AMOUNT,
  CURRENCY,
  TIER_PRICING,
  TIER_LIMITS,
  TIER_LABELS,
  TIER_ORDER,
  getNextTier,
  getTierAmount,
  getPlanAmount,
} from "./pricing.ts";

// Montos base — son los precios cobrados a clientes; un cambio accidental aquí
// es un bug de facturación. Estos asserts congelan los valores de negocio.
test("montos constantes en ILS", () => {
  assert.equal(CURRENCY, "ILS");
  assert.equal(SOLO_WEB_AMOUNT, 480);
  assert.equal(PLAN_AMOUNT, 770);
  // web_crm y completo son alias de PLAN_AMOUNT
  assert.equal(WEB_CRM_AMOUNT, 770);
  assert.equal(COMPLETO_AMOUNT, 770);
});

test("TIER_PRICING por tier de booking", () => {
  assert.equal(TIER_PRICING.base, 770);
  assert.equal(TIER_PRICING.pro, 960);
  assert.equal(TIER_PRICING.enterprise, 1270);
});

test("TIER_LIMITS (turnos/mes)", () => {
  assert.equal(TIER_LIMITS.base, 100);
  assert.equal(TIER_LIMITS.pro, 300);
  assert.equal(TIER_LIMITS.enterprise, Infinity);
});

test("getTierAmount devuelve el precio del tier", () => {
  assert.equal(getTierAmount("base"), 770);
  assert.equal(getTierAmount("pro"), 960);
  assert.equal(getTierAmount("enterprise"), 1270);
});

test("getPlanAmount por PlanType", () => {
  assert.equal(getPlanAmount("solo_web"), 480);
  assert.equal(getPlanAmount("pro"), 960);
  assert.equal(getPlanAmount("enterprise"), 1270);
  // base, web_crm, completo y undefined caen al PLAN_AMOUNT por defecto (770)
  assert.equal(getPlanAmount("base"), 770);
  assert.equal(getPlanAmount("web_crm"), 770);
  assert.equal(getPlanAmount("completo"), 770);
  assert.equal(getPlanAmount(undefined), 770);
});

test("getNextTier escala base -> pro -> enterprise -> null", () => {
  assert.equal(getNextTier("base"), "pro");
  assert.equal(getNextTier("pro"), "enterprise");
  assert.equal(getNextTier("enterprise"), null);
});

test("TIER_ORDER y TIER_LABELS consistentes", () => {
  assert.deepEqual(TIER_ORDER, ["base", "pro", "enterprise"]);
  assert.equal(TIER_LABELS.base, "Base");
  assert.equal(TIER_LABELS.pro, "Pro");
  assert.equal(TIER_LABELS.enterprise, "Enterprise");
});
