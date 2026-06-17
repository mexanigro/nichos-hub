import test from "node:test";
import assert from "node:assert/strict";
import { safeCompare } from "./safe-compare.ts";

test("safeCompare: iguales -> true", () => {
  assert.equal(safeCompare("secret-token", "secret-token"), true);
});

test("safeCompare: distinto contenido, misma longitud -> false", () => {
  assert.equal(safeCompare("secret", "secre7"), false);
});

test("safeCompare: longitudes distintas -> false", () => {
  assert.equal(safeCompare("abc", "abcd"), false);
});

test("safeCompare: a nulo/undefined/vacío -> false", () => {
  assert.equal(safeCompare(null, "x"), false);
  assert.equal(safeCompare(undefined, "x"), false);
  assert.equal(safeCompare("", ""), false); // "" es falsy → short-circuit
});
