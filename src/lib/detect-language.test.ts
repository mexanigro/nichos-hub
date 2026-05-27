import test from "node:test";
import assert from "node:assert/strict";
import { detectLanguage } from "./detect-language.ts";

test("empty string returns unknown", () => {
  assert.equal(detectLanguage(""), "unknown");
  assert.equal(detectLanguage("   "), "unknown");
});

test("non-string returns unknown", () => {
  // @ts-expect-error testing runtime guard
  assert.equal(detectLanguage(undefined), "unknown");
  // @ts-expect-error testing runtime guard
  assert.equal(detectLanguage(null), "unknown");
  // @ts-expect-error testing runtime guard
  assert.equal(detectLanguage(42), "unknown");
});

test("Hebrew text is detected", () => {
  assert.equal(detectLanguage("שלום עולם"), "he");
  assert.equal(detectLanguage("ברוכים הבאים לסלון שלנו"), "he");
});

test("Cyrillic text is detected as Russian", () => {
  assert.equal(detectLanguage("Привет мир"), "ru");
  assert.equal(detectLanguage("Добро пожаловать в наш салон"), "ru");
});

test("Arabic text is detected", () => {
  assert.equal(detectLanguage("مرحبا بالعالم"), "ar");
  assert.equal(detectLanguage("أهلا وسهلا بكم في صالوننا"), "ar");
});

test("Spanish text is detected by markers", () => {
  assert.equal(
    detectLanguage("Esta es la mejor barbería de la ciudad para todos los hombres"),
    "es",
  );
  assert.equal(
    detectLanguage("Bienvenidos a nuestro salón, donde siempre cuidamos de tu estilo"),
    "es",
  );
});

test("English text is detected by markers", () => {
  assert.equal(
    detectLanguage("This is the best barbershop in the city for all the men"),
    "en",
  );
  assert.equal(
    detectLanguage("Welcome to our salon where we always take care of your style"),
    "en",
  );
});

test("very short or ambiguous Latin text returns unknown", () => {
  // Sin marcadores reconocibles.
  assert.equal(detectLanguage("Hola"), "unknown");
  assert.equal(detectLanguage("hi"), "unknown");
  // Solo nombre propio.
  assert.equal(detectLanguage("Maria Rodriguez"), "unknown");
});

test("mixed text — script with >=30% letters dominates", () => {
  // Mayoría hebrea con una palabra suelta en inglés.
  assert.equal(detectLanguage("שלום world שלום עולם שלום"), "he");
  // Mayoría inglesa con una letra hebrea suelta — debe ganar el inglés
  // por marcadores (no llega al 30% hebreo).
  const en = "The quick brown fox jumps over the lazy dog ש";
  assert.equal(detectLanguage(en), "en");
});

test("Spanish wins over English when both markers present but Spanish dominates", () => {
  // El texto en español puede contener "the" como nombre propio, pero el
  // bag-of-words español debe ganar por cantidad.
  assert.equal(
    detectLanguage("La mejor barbería para hombres en la ciudad con los mejores cortes"),
    "es",
  );
});

test("tied marker count returns unknown", () => {
  // "the" (en) y "la" (es) — 1 hit cada uno.
  assert.equal(detectLanguage("the la"), "unknown");
});

test("text with only punctuation/numbers returns unknown", () => {
  assert.equal(detectLanguage("123 456 ---"), "unknown");
  assert.equal(detectLanguage("!@#$%^&*()"), "unknown");
});

test("Spanish with diacritics is preserved", () => {
  assert.equal(
    detectLanguage("La estética más moderna donde también encontrarás los mejores tratamientos"),
    "es",
  );
});
