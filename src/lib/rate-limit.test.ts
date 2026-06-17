import test from "node:test";
import assert from "node:assert/strict";
import { isRateLimited } from "./rate-limit.ts";

// El limiter usa un Map a nivel de módulo, así que cada test usa una IP única
// para no arrastrar estado entre casos. Ventana grande (60s) para no expirar mid-test.
const WINDOW = 60_000;

test("permite las primeras `max` y bloquea la siguiente", () => {
  const ip = "10.0.0.1";
  const ep = "create-payment";
  // max=3 → 3 permitidas (false), la 4ª bloqueada (true)
  assert.equal(isRateLimited(ip, ep, 3, WINDOW), false);
  assert.equal(isRateLimited(ip, ep, 3, WINDOW), false);
  assert.equal(isRateLimited(ip, ep, 3, WINDOW), false);
  assert.equal(isRateLimited(ip, ep, 3, WINDOW), true);
  assert.equal(isRateLimited(ip, ep, 3, WINDOW), true);
});

test("contadores independientes por endpoint", () => {
  const ip = "10.0.0.2";
  assert.equal(isRateLimited(ip, "endpoint-a", 1, WINDOW), false); // 1ª de A
  assert.equal(isRateLimited(ip, "endpoint-a", 1, WINDOW), true); // A agotado
  // endpoint-b arranca limpio para la misma IP
  assert.equal(isRateLimited(ip, "endpoint-b", 1, WINDOW), false);
});

test("contadores independientes por IP", () => {
  const ep = "shared-endpoint";
  assert.equal(isRateLimited("10.0.0.3", ep, 1, WINDOW), false);
  assert.equal(isRateLimited("10.0.0.3", ep, 1, WINDOW), true);
  // otra IP en el mismo endpoint no está afectada
  assert.equal(isRateLimited("10.0.0.4", ep, 1, WINDOW), false);
});

test("max=1 bloquea desde el segundo request", () => {
  const ip = "10.0.0.5";
  assert.equal(isRateLimited(ip, "strict", 1, WINDOW), false);
  assert.equal(isRateLimited(ip, "strict", 1, WINDOW), true);
});
