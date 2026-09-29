// IDIOMAS-01 · C1 (H) · el validador del texto por idioma. Sesión A (2026-09-29): test rojo — `config-validator.ts` no exporta
// `validateTextosPorIdioma`, y su comentario de `:43–44` dice que `translations.{lang}` «no se valida aquí».
//
// D-136 (Liam, respuesta a A, 2026-09-29): la regla del id vale para los tres —un id de `translations.<lang>.services|staff|
// testimonials` tiene que existir en la raíz— y los límites de palabras son los que el contrato YA tiene, sólo en servicios:
// `name` de 1 a 5 (CT-1) y `description` de 6 a 12. `staff` y `testimonials` sin límite de palabras hasta su orden (D-129).
// Los fixtures A y C se leen de T por ruta fija (son la referencia; D1 los completa). Caja negra: el validador se importa con el
// cargador de `_comun.ts`; nada toca Firestore. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { OTROS, PALETAS, fixture, importarModulo } from "./_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
const VALIDADOR = "src/lib/config-validator.ts";

test("`validateTextosPorIdioma`, exportada por src/lib/config-validator.ts y encadenada a `validateConfig`, da error por cada id de `translations.<lang>.services|staff|testimonials` que no existe en la raíz y, sólo en servicios, por un `name` de fuera de 1 a 5 palabras o una `description` de fuera de 6 a 12; y los fixtures A y C pasan sin errores", async () => {
  // (1) La función. Hoy no existe: aquí está el rojo.
  const mod = await importarModulo(VALIDADOR);
  assert.equal(typeof mod.validateTextosPorIdioma, "function", `${VALIDADOR} debe exportar \`validateTextosPorIdioma(config)\` (exporta: ${Object.keys(mod).filter((k) => k.startsWith("validate")).join(", ")})`);
  const validar = mod.validateTextosPorIdioma as (c: unknown) => Issue[];
  const validateConfig = mod.validateConfig as (c: unknown) => Issue[];
  const errores = (issues: Issue[]) => issues.filter((i) => i.severity === "error").map((i) => i.path).sort();

  const BASE = {
    brand: { name: "Salón" },
    services: [{ id: "cut", name: "תספורת", description: "תספורת מדויקת עם ייעוץ קצר ופן בסיום", price: 120, duration: 30 }],
    staff: [{ id: "noa", name: "נועה", specialty: "צבע", bio: "צובעת עשר שנים." }],
    testimonials: [{ id: "r1", name: "יעל", rating: 5, text: "מעולה." }],
  };
  const con = (layer: Record<string, unknown>) => ({ ...structuredClone(BASE), translations: { en: layer } });

  // (2) Un id que no existe en la raíz es error, en las tres secciones y en las dos formas (objeto por id y array con id).
  const fantasma = errores(validar(con({
    services: { ghost: { name: "Ghost" } },
    staff: [{ id: "nadie", specialty: "x" }],
    testimonials: { r9: { text: "x" } },
  })));
  for (const p of ["translations.en.services.ghost", "translations.en.staff.nadie", "translations.en.testimonials.r9"]) {
    assert.ok(fantasma.some((e) => e.startsWith(p)), `un id que no existe en la raíz es error: «${p}» (errores: ${fantasma.join(", ")})`);
  }

  // (3) Servicios: nombre de 1 a 5 palabras y frase de 6 a 12, en las dos direcciones.
  const bien = errores(validar(con({ services: { cut: { name: "Cut", description: "A precise cut with a short consultation and blow-dry" } } })));
  assert.deepEqual(bien, [], `un nombre de una palabra y una frase de nueve son válidos (CT-1: 1 a 5; frase de 6 a 12): ${bien.join(", ")}`);
  const largo = errores(validar(con({ services: { cut: { name: "A very long haircut service name" } } })));
  assert.ok(largo.some((e) => e.startsWith("translations.en.services.cut.name")), `un nombre de seis palabras es error (CT-1): ${largo.join(", ")}`);
  const corta = errores(validar(con({ services: { cut: { description: "Too short here" } } })));
  assert.ok(corta.some((e) => e.startsWith("translations.en.services.cut.description")), `una frase de tres palabras es error (6 a 12): ${corta.join(", ")}`);
  const larga = errores(validar(con({ services: { cut: { description: "one two three four five six seven eight nine ten eleven twelve thirteen" } } })));
  assert.ok(larga.some((e) => e.startsWith("translations.en.services.cut.description")), `una frase de trece palabras es error (6 a 12): ${larga.join(", ")}`);

  // (4) Equipo y reseñas SIN límite de palabras (D-136): textos largos, ids que existen → ningún error.
  const libre = errores(validar(con({
    staff: { noa: { specialty: "Colour, balayage, lightening and long transitions for every kind of hair", bio: "Studio owner with fourteen years in colour, focused on natural transitions and on hair that stays healthy after the colour is done." } },
    testimonials: { r1: { text: "I came in for copper and left with exactly the shade I wanted, and after the colour my hair is still soft and shiny." } },
  })));
  assert.deepEqual(libre, [], `equipo y reseñas no tienen límite de palabras en esta orden (D-136): ${libre.join(", ")}`);

  // (5) Encadenada: lo que ella rechaza, `validateConfig` (la validación de guardar) también.
  assert.ok(errores(validateConfig(con({ services: { ghost: { name: "Ghost" } } }))).some((e) => e.startsWith("translations.en.services.ghost")), "validateConfig encadena validateTextosPorIdioma");

  // (6) Los fixtures reales pasan sin errores (D1 les agrega los textos de idiomas-{a,c}.json, que cumplen el contrato: medido).
  for (const p of PALETAS) {
    const e = errores(validar(fixture(p)));
    assert.deepEqual(e, [], `el fixture ${p} pasa sin errores de texto por idioma (${OTROS.join("/")}): ${e.join(", ")}`);
  }
});
