import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeInput,
  sanitizeForFirestore,
  validateEmail,
  validatePhone,
  validateClientId,
} from "./security.ts";

test("sanitizeInput: trim + límite de longitud", () => {
  assert.equal(sanitizeInput("  hola  "), "hola");
  assert.equal(sanitizeInput("abcdef", 3), "abc"); // trim antes de slice
});

test("sanitizeInput: quita tags HTML, scripts y event handlers", () => {
  assert.equal(sanitizeInput("<b>hi</b>"), "hi");
  assert.equal(sanitizeInput("<script>alert(1)</script>x"), "x");
  const out = sanitizeInput('<div onclick="x()">y</div>');
  assert.equal(out, "y");
  assert.ok(!/onclick/i.test(out));
});

test("sanitizeInput: no-string -> ''", () => {
  // @ts-expect-error probando entrada inválida en runtime
  assert.equal(sanitizeInput(123), "");
});

test("sanitizeForFirestore: solo campos permitidos", () => {
  const r = sanitizeForFirestore({ name: "x", evil: "y" }, ["name"]);
  assert.deepEqual(r, { name: "x" });
});

test("sanitizeForFirestore: bloquea prototype pollution y claves __", () => {
  const r = sanitizeForFirestore(
    { name: "ok", __danger: "no", constructor: "no" },
    ["name", "__danger", "constructor"],
  );
  assert.deepEqual(r, { name: "ok" });
});

test("validateEmail", () => {
  assert.equal(validateEmail("liam@arzac.studio"), true);
  assert.equal(validateEmail("no-arroba"), false);
  assert.equal(validateEmail("a@b"), false); // falta TLD con punto
  assert.equal(validateEmail("a @b.co"), false); // espacio
  assert.equal(validateEmail("x".repeat(255) + "@b.co"), false); // >254
});

test("validatePhone: formatos israelíes e internacionales", () => {
  assert.equal(validatePhone("+972 55-771-9141"), true);
  assert.equal(validatePhone("0557719141"), true);
  assert.equal(validatePhone("123"), false); // muy corto
  assert.equal(validatePhone("abcdefghij"), false); // no dígitos
});

test("validateClientId: alfanumérico-guiones, minúsculas, 3-81 chars", () => {
  assert.equal(validateClientId("barber-shop"), true);
  assert.equal(validateClientId("valid-123"), true);
  assert.equal(validateClientId("ab"), false); // muy corto
  assert.equal(validateClientId("UPPER"), false); // mayúsculas
});
