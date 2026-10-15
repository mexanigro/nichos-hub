import test from "node:test";
import assert from "node:assert/strict";
import { estadoMostrado, fechaDePago, ordenarPagos, tipoMostrado } from "./pago-mostrado.ts";

test("lo que escribe cada camino se muestra con el vocabulario del hub", () => {
  // cron (recurring-charge.ts): subscription_recurring · success | failed
  assert.equal(tipoMostrado("subscription_recurring"), "recurring");
  assert.equal(estadoMostrado("success"), "paid", "la insignia no conoce «success»: se rompía la ficha");
  assert.equal(estadoMostrado("failed"), "failed");
  // compra web (cardcom-promote.ts): subscription_initial · success
  assert.equal(tipoMostrado("subscription_initial"), "recurring");
  // /pago: recurring · pending → paid; el alta vieja queda como initial
  assert.equal(tipoMostrado("recurring"), "recurring");
  assert.equal(tipoMostrado("initial"), "initial");
  assert.equal(estadoMostrado("paid"), "paid");
  assert.equal(estadoMostrado("pending"), "pending");
  assert.equal(estadoMostrado("cancelled"), "cancelled");
  // lo desconocido no rompe: pendiente
  assert.equal(estadoMostrado("raro"), "pending");
  assert.equal(estadoMostrado(undefined), "pending");
  assert.equal(tipoMostrado(undefined), "recurring");
});

test("un cobro del cron, sin billingDate, tiene fecha y entra ordenado", () => {
  const cron = { id: "cron", createdAt: new Date("2026-11-12T09:00:00Z") };
  const pago = { id: "pago", billingDate: new Date("2026-10-12T09:00:00Z"), createdAt: new Date("2026-10-12T09:00:01Z") };
  const viejo = { id: "viejo", billingDate: new Date("2026-05-12T00:00:00Z") };
  assert.equal(fechaDePago(cron)?.toISOString(), "2026-11-12T09:00:00.000Z");
  assert.equal(fechaDePago(pago)?.toISOString(), "2026-10-12T09:00:00.000Z", "billingDate antes que createdAt");
  assert.deepEqual(ordenarPagos([viejo, cron, pago]).map((p) => p.id), ["cron", "pago", "viejo"]);
  assert.deepEqual(ordenarPagos<{ id: string; billingDate?: Date }>([{ id: "sin" }, viejo]).map((p) => p.id), ["viejo", "sin"], "sin fecha, al final");
});
