import test from "node:test";
import assert from "node:assert/strict";
import {
  VALID_CLIENT_LANGUAGES,
  VALID_CLIENT_LANGUAGES_LABEL,
  DEFAULT_CLIENT_LANGUAGE,
  CLIENT_LANGUAGE_LABELS_ES,
  CLIENT_LANGUAGE_NAME_EN,
  isValidClientLanguage,
  normalizeClientLanguage,
} from "./client-language.ts";
import { detectLanguage } from "./detect-language.ts";

// ── "es" no es un idioma de web de cliente (N05 · T5, D-8 a) ──────────────────
// Estas cuatro aserciones son el gate: reintroducir "es" en VALID_CLIENT_LANGUAGES
// las rompe. El mercado es Israel y el template no tiene locale "es": ofrecerlo era
// una promesa que caía a inglés en silencio.

test('"es" no es un idioma de cliente valido', () => {
  assert.equal(isValidClientLanguage("es"), false);
  assert.ok(!(VALID_CLIENT_LANGUAGES as readonly string[]).includes("es"));
  assert.ok(!("es" in CLIENT_LANGUAGE_LABELS_ES));
  assert.ok(!("es" in CLIENT_LANGUAGE_NAME_EN));
});

test("los idiomas ofrecidos son exactamente he, en, ru, ar", () => {
  assert.deepEqual([...VALID_CLIENT_LANGUAGES], ["he", "en", "ru", "ar"]);
  for (const l of VALID_CLIENT_LANGUAGES) assert.equal(isValidClientLanguage(l), true);
});

test("el mensaje de error no anuncia un idioma que no se acepta", () => {
  assert.equal(VALID_CLIENT_LANGUAGES_LABEL, "he, en, ru, ar");
  assert.ok(!VALID_CLIENT_LANGUAGES_LABEL.includes("es"));
});

// ── un "es" heredado cae al default, con aviso, y nunca a undefined ───────────

test('normalizeClientLanguage("es") cae al default y avisa', () => {
  const original = console.warn;
  const avisos: string[] = [];
  console.warn = (...args: unknown[]) => void avisos.push(args.join(" "));
  try {
    const out = normalizeClientLanguage("es");
    assert.equal(out, DEFAULT_CLIENT_LANGUAGE);
    assert.notEqual(out, undefined);
    assert.equal(avisos.length, 1);
    assert.ok(avisos[0].includes('"es"'));
  } finally {
    console.warn = original;
  }
});

test("normalizeClientLanguage no avisa cuando el campo simplemente no esta", () => {
  const original = console.warn;
  const avisos: string[] = [];
  console.warn = (...args: unknown[]) => void avisos.push(args.join(" "));
  try {
    for (const v of [undefined, null, "", "   "]) {
      assert.equal(normalizeClientLanguage(v), DEFAULT_CLIENT_LANGUAGE);
    }
    assert.equal(avisos.length, 0);
  } finally {
    console.warn = original;
  }
});

test("normalizeClientLanguage siempre devuelve un idioma valido", () => {
  for (const v of [undefined, null, "", "es", "pt", "EN", 42, {}, []]) {
    assert.equal(isValidClientLanguage(normalizeClientLanguage(v)), true);
  }
});

// ── el aviso de idioma distinto sigue vivo para los cuatro que quedan ─────────
// `detect-language` conserva "es" a propósito: es el detector de lo que el owner
// pega, no la lista de lo que se ofrece. Pegar español en un cliente hebreo tiene
// que seguir disparando el warning.

test("detectar espanol sigue produciendo mismatch contra los cuatro idiomas", () => {
  const espanol = "Somos una barberia clasica en el centro de la ciudad con los mejores cortes";
  assert.equal(detectLanguage(espanol), "es");
  for (const esperado of VALID_CLIENT_LANGUAGES) {
    assert.notEqual(detectLanguage(espanol), esperado);
  }
});

test("cada idioma que se ofrece coincide consigo mismo", () => {
  const muestras: Record<string, string> = {
    he: "אנחנו מספרה קלאסית במרכז העיר עם התספורות הטובות ביותר בעיר",
    en: "We are a classic barbershop in the city center with the best haircuts around",
    ru: "Мы классическая парикмахерская в центре города с лучшими стрижками",
    ar: "نحن صالون حلاقة كلاسيكي في وسط المدينة مع أفضل قصات الشعر",
  };
  for (const l of VALID_CLIENT_LANGUAGES) {
    assert.equal(detectLanguage(muestras[l]), l, `deteccion de ${l}`);
  }
});
