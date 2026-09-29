// IDIOMAS-01 · C2 (H) · las casillas de servicios, equipo y reseñas, por idioma. Sesión A (2026-09-29): test rojo — no existe
// `src/lib/textos-idioma.ts`.
//
// D-128 (Liam, 2026-09-29): la clienta da lo que sabe, en su idioma, y el resto se escribe; el hueco donde vive ese texto se
// construye ahora. Hoy el selector de idioma vive EN LÍNEA en `client-content-tab.tsx:388–410` (`role="tablist"`,
// `aria-label="Idioma del texto"`) y sólo lo usa Contenido: base → raíz, otro idioma → `translations[lang]` (`:237–242`, `:295`).
// Las casillas de servicios, equipo y reseñas están en Config y no tienen selector. Esta orden lo extrae a `SelectorIdioma` —el
// MISMO para Contenido y para las tres casillas— y pone la escritura en una función pura, `aplicarTextoIdioma`.
// D-34: el hub se prueba sin navegador (la ficha está detrás de Google owner): por su lógica pura, por render en servidor y por
// el fuente. Caja negra: los módulos con el cargador de `_comun.ts`. Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, canonico, fuente, importarModulo, renderToString } from "./_comun.ts";

const TEXTOS = "src/lib/textos-idioma.ts";
const SELECTOR = "src/components/selector-idioma.tsx";
const CASILLAS = ["src/components/config-editors/services-editor.tsx", "src/components/config-editors/staff-editor.tsx", "src/components/config-editors/testimonials-editor.tsx"];
const CONTENIDO = "src/components/client-content-tab.tsx";
/** Las etiquetas en español de los cuatro idiomas (`CLIENT_LANGUAGE_LABELS_ES`), como las pinta hoy Contenido. */
const IDIOMAS = ["he", "en", "ru", "ar"] as const;

test("las casillas de servicios, equipo y reseñas usan el mismo selector de idioma que Contenido, `SelectorIdioma` de src/components/selector-idioma.tsx, y escriben el texto con `aplicarTextoIdioma` de src/lib/textos-idioma.ts: en el idioma base, el campo del elemento de la raíz con ese id; en otro idioma, `translations.<lang>.<sección>.<id>.<campo>`; sin tocar ninguna otra clave", async () => {
  // (1) La función pura. Hoy no existe: aquí está el rojo.
  assert.ok(existsSync(resolve(ROOT, TEXTOS)), `no existe ${TEXTOS}: las casillas no tienen dónde escribir el texto de cada idioma`);
  const t = await importarModulo(TEXTOS);
  assert.equal(typeof t.aplicarTextoIdioma, "function", `${TEXTOS} exporta aplicarTextoIdioma`);
  assert.equal(typeof t.leerTextoIdioma, "function", `${TEXTOS} exporta leerTextoIdioma`);
  const aplicar = t.aplicarTextoIdioma as (c: unknown, o: Record<string, unknown>) => Record<string, any>;
  const leer = t.leerTextoIdioma as (c: unknown, o: Record<string, unknown>) => unknown;

  const CONFIG = {
    brand: { name: "Salón" },
    services: [{ id: "cut", name: "תספורת", price: 120 }, { id: "blowdry", name: "פן", price: 80 }],
    staff: [{ id: "noa", name: "נועה", specialty: "צבע" }],
    testimonials: [{ id: "r1", name: "יעל", text: "מעולה." }],
    translations: { en: { hero: { subtitle: "Client subtitle" } } },
  };
  const antes = structuredClone(CONFIG);

  // (2) Idioma base → el campo del elemento de la raíz con ese id.
  const b = aplicar(CONFIG, { seccion: "services", id: "blowdry", campo: "name", valor: "פן ארוך", idioma: "he", base: "he" });
  assert.equal(b.services.find((s: any) => s.id === "blowdry").name, "פן ארוך", "en el idioma base escribe la raíz, en el elemento con ese id");
  assert.equal(b.services.find((s: any) => s.id === "cut").name, "תספורת", "no toca los otros elementos");
  assert.equal(b.translations.en.services, undefined, "en el idioma base no crea capa de idioma");

  // (3) Otro idioma → translations.<lang>.<sección>.<id>.<campo>, en las tres secciones.
  let c: Record<string, any> = CONFIG;
  c = aplicar(c, { seccion: "services", id: "cut", campo: "name", valor: "Haircut", idioma: "en", base: "he" });
  c = aplicar(c, { seccion: "staff", id: "noa", campo: "specialty", valor: "Colour", idioma: "ru", base: "he" });
  c = aplicar(c, { seccion: "testimonials", id: "r1", campo: "text", valor: "Excellent.", idioma: "en", base: "he" });
  assert.equal(c.translations.en.services.cut.name, "Haircut", "en: translations.en.services.cut.name");
  assert.equal(c.translations.ru.staff.noa.specialty, "Colour", "ru: translations.ru.staff.noa.specialty");
  assert.equal(c.translations.en.testimonials.r1.text, "Excellent.", "en: translations.en.testimonials.r1.text");
  assert.equal(c.services.find((s: any) => s.id === "cut").name, "תספורת", "escribir en inglés no toca el texto hebreo de la raíz");
  assert.equal(c.translations.en.hero.subtitle, "Client subtitle", "no toca ninguna otra clave de la capa");

  // (4) Pura: no muta lo que recibe.
  assert.deepEqual(canonico(CONFIG), canonico(antes), "aplicarTextoIdioma no muta el config que recibe");

  // (5) Leer: lo que la casilla muestra en cada idioma (la capa, o vacío = pendiente; en el base, la raíz).
  assert.equal(leer(c, { seccion: "services", id: "cut", campo: "name", idioma: "en", base: "he" }), "Haircut", "leer en: la capa");
  assert.equal(leer(c, { seccion: "services", id: "cut", campo: "name", idioma: "he", base: "he" }), "תספורת", "leer he: la raíz");
  const pendiente = leer(c, { seccion: "services", id: "blowdry", campo: "name", idioma: "ar", base: "he" });
  assert.ok(pendiente === "" || pendiente == null, `leer ar sin texto: vacío (pendiente), nunca el texto de otro idioma (dio «${String(pendiente)}»)`);

  // (6) El mismo selector que Contenido, extraído: un componente, con los cuatro idiomas y el base marcado.
  assert.ok(existsSync(resolve(ROOT, SELECTOR)), `no existe ${SELECTOR}`);
  const { SelectorIdioma } = (await importarModulo(SELECTOR)) as { SelectorIdioma: unknown };
  assert.equal(typeof SelectorIdioma, "function", `${SELECTOR} exporta SelectorIdioma`);
  const { createElement } = (await import("react")) as { createElement: (t: unknown, p?: unknown) => unknown };
  const html = await renderToString(createElement(SelectorIdioma, { idioma: "en", base: "he", onCambio: () => {} }));
  assert.match(html, /role="tablist"/, "el selector es un tablist, como el de Contenido");
  assert.match(html, /aria-label="Idioma del texto"/, "con la misma etiqueta accesible que el de Contenido");
  const { CLIENT_LANGUAGE_LABELS_ES } = (await importarModulo("src/lib/client-language.ts")) as { CLIENT_LANGUAGE_LABELS_ES: Record<string, string> };
  for (const l of IDIOMAS) assert.ok(html.includes(CLIENT_LANGUAGE_LABELS_ES[l]), `el selector ofrece ${CLIENT_LANGUAGE_LABELS_ES[l]}`);
  assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1, "marca uno solo: el idioma que se edita");

  // (7) Y lo usan Contenido y las tres casillas; las tres escriben con aplicarTextoIdioma.
  for (const f of [CONTENIDO, ...CASILLAS]) assert.match(fuente(f), /from ["']@\/components\/selector-idioma["']|from ["']\.\.?\/(?:\.\.\/)?selector-idioma["']/, `${f} usa SelectorIdioma (el mismo selector para todos)`);
  for (const f of CASILLAS) assert.ok(fuente(f).includes("aplicarTextoIdioma"), `${f} escribe el texto de cada idioma con aplicarTextoIdioma`);
});
