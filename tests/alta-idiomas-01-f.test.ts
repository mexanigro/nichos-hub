// ALTA-IDIOMAS-01 · copia promovida (PLANTILLA-01, 2026-10-05, D-260) de tests/orden/alta-idiomas-01/f.test.ts. La orden quedó
// aprobada por Liam el 2026-10-05 (T 3222922 · H 5502f02) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: el cliente de Anthropic es falso y la fusión de Firestore se modela).
// ALTA-IDIOMAS-01 · F1 (H) · cada texto respeta su forma en su idioma (punto 4). Sesión A (2026-10-05): rojo.
//
// Los límites son los que el contrato YA tiene (D-243; CONTRATOS-HUECOS.md y las reglas de `config-validator.ts`): servicios, nombre
// de 1 a 5 palabras y frase de 6 a 12 (CT-1, `validateTextosPorIdioma`); con hero v6, eyebrow hasta 4, frase hasta 12, titular de 2 a
// 6 (prefijo + destacado + sufijo) y cada CTA de 1 a 2 (`validateVariantContracts`, R5); con team v6, la primera oración de la bio
// hasta 10 (CT-2, `validateFraseEquipo`). Medido por A: en H esos límites son AVISO en la raíz y no existen para
// `translations.<lang>.hero` —una frase de 20 palabras en ruso se guarda sin que nadie lo diga—. En una propuesta de Claude son ERROR
// en los cuatro idiomas, con su ruta y su idioma, y lo que tiene error no entra en el cuerpo del guardado; lo que sí entra pasa por
// `validateConfig` (que corre el PUT) sin errores. Y en el idioma base sólo se completa lo vacío (D-238).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fixtureA, guardarEnFirestore, importarModulo, sinCapas, type Issue } from "./orden/alta-idiomas-01/_comun.ts";

const MODULO = "src/lib/textos-claude.ts";

test("`validarPropuesta` da error, con idioma y ruta, por cada texto fuera de los límites del contrato en su idioma —servicios: nombre de 1 a 5 palabras y frase de 6 a 12; con hero v6: eyebrow hasta 4, frase hasta 12, titular de 2 a 6 y CTA de 1 a 2; con team v6: primera oración de la bio hasta 10— y por cada campo del idioma base que la clienta ya escribió; lo que tiene error no entra en `cuerpoDePropuesta`, y el config con lo demás guardado pasa `validateConfig` sin errores", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-242): hoy los límites son aviso en la raíz y no existen en translations.<lang>.hero`);
  const m = await importarModulo(MODULO);
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  const A = sinCapas(fixtureA());
  assert.ok(A.hero.variant === "v6" && A.sections.team.variant === "v6" && A.sections.services.variant === "v6", "precondición: el fixture A usa hero, services y team v6");
  assert.ok(typeof A.hero.subtitle === "string" && A.hero.subtitle.trim(), "precondición: el fixture A tiene hero.subtitle en el idioma base");

  const propuesta = {
    he: { "hero.subtitle": "צבע ותספורת בהרצליה פיתוח" },
    en: {
      "hero.eyebrow": "Colour studio Herzliya",
      "hero.subtitle": "A calm colour studio where every appointment starts with a long honest talk about hair",
      "hero.titlePrefix": "Colour that feels",
      "hero.titleHighlight": "truly yours every",
      "hero.titleSuffix": "single day",
      "hero.ctaPrimary": "Book your visit",
      "services.cut.name": "Women's cut",
      "services.cut.description": "A precise cut shaped for your hair and routine",
      "staff.noa.bio": "Studio owner who spends every single morning mixing colour for clients who want natural transitions. More later.",
    },
    ru: {
      "services.cut.name": "Женская стрижка с мытьём укладкой и консультацией мастера",
      "services.cut.description": "Стрижка по форме лица",
      "hero.ctaSecondary": "WhatsApp",
    },
    ar: { "hero.eyebrow": "صالون شعر في هرتسليا للنساء فقط" },
  };
  const errores = (m.validarPropuesta(A, "peluqueria", "he", propuesta) as Issue[]).filter((e) => e.severity === "error");
  const caminos = errores.map((e) => e.path);
  const debe = ["ru:services.cut.name", "ru:services.cut.description", "ar:hero.eyebrow", "en:hero.subtitle", "en:hero.ctaPrimary", "en:staff.noa.bio", "he:hero.subtitle"];
  for (const p of debe) assert.ok(caminos.includes(p), `validarPropuesta da error en ${p} (hubo: ${caminos.join(", ") || "ninguno"})`);
  assert.ok(caminos.some((p) => /^en:hero\.title(Prefix|Highlight|Suffix)$/.test(p)), "el titular de 8 palabras (2–6) da error en una de sus tres partes");
  for (const p of ["en:hero.eyebrow", "en:services.cut.name", "en:services.cut.description", "ru:hero.ctaSecondary"]) assert.ok(!caminos.includes(p), `${p} cumple su límite: sin error`);

  // Lo que tiene error no entra; lo demás se guarda y pasa el validador del PUT.
  const todos = Object.entries(propuesta).flatMap(([l, t]) => Object.keys(t).map((r) => `${l}:${r}`));
  const doc = await guardarEnFirestore(A, m.cuerpoDePropuesta(A, "peluqueria", "he", propuesta, todos));
  assert.equal(doc.hero.subtitle, A.hero.subtitle, "el idioma base no se reescribe (D-238)");
  assert.equal(doc.translations?.ru?.services?.cut?.name, undefined, "el nombre de 8 palabras no se guarda");
  assert.equal(doc.translations?.ar?.hero?.eyebrow, undefined, "el eyebrow de 6 palabras no se guarda");
  assert.equal(doc.translations?.en?.hero?.subtitle, undefined, "la frase de 15 palabras no se guarda");
  assert.equal(doc.translations?.en?.services?.cut?.name, "Women's cut", "lo que cumple sí se guarda");
  assert.equal(doc.translations?.ru?.hero?.ctaSecondary, "WhatsApp", "lo que cumple sí se guarda");
  const bloquean = (validateConfig(doc) as Issue[]).filter((e) => e.severity === "error");
  assert.deepEqual(bloquean, [], "el config guardado pasa validateConfig sin errores");
});
