// ARREGLOS-03 · copia promovida (SERVICIOS-GALERIA-01, 2026-10-01, D-165). La orden quedó aprobada por Liam el 2026-10-01
// (T d27ebf3 · H 064acb5) y su carpeta está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera.
// ARREGLOS-03 · D1, D2 (H) · el texto por idioma huérfano. Sesión A (2026-09-30): tests rojos.
//
// Verificadora, hallazgo 1 (defecto de H que introdujo IDIOMAS-01). `remove()` filtra sólo la raíz en
// `src/components/config-editors/services-editor.tsx:656–658`, `staff-editor.tsx:113–115` y `testimonials-editor.tsx:67–70`, y la
// casilla de reseñas cambia el id en `testimonials-editor.tsx:142` sin mover su texto: `translations.<lang>.<sección>.<id>` queda
// huérfano, `validateTextosPorIdioma` (`config-validator.ts:657`, encadenada en `:646`) lo marca como error y `hasBlockingIssues`
// (`:958`) bloquea el guardado. Medido por A el 2026-09-30 con el validador real: `r1` borrada de la raíz con su texto en
// `translations.en.testimonials.r1` da ese error y `hasBlockingIssues` = true.
// D-154: dos funciones puras en `src/lib/textos-idioma.ts` —`quitarTextoIdioma` y `renombrarTextoIdioma`—, que aceptan la capa como
// objeto por id o como array con `id` (como `leerTextoIdioma`), no tocan los otros ids ni ninguna otra clave, no mutan lo que reciben
// y no pisan el texto de un `a` que ya lo tiene. D-34: el hub se prueba sin navegador: lógica pura, validador real y fuente de las
// casillas. Caja negra: los módulos con el cargador de `_comun.ts`. Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fuente, importarModulo } from "./orden/arreglos-03/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
type Cfg = Record<string, any>;
const TEXTOS = "src/lib/textos-idioma.ts";
const VALIDADOR = "src/lib/config-validator.ts";
const CASILLAS = { services: "src/components/config-editors/services-editor.tsx", staff: "src/components/config-editors/staff-editor.tsx", testimonials: "src/components/config-editors/testimonials-editor.tsx" };

/** Un cliente con texto por idioma en las tres secciones: `en` y `ru` como objeto por id, `ar` como array con `id`. */
const CONFIG: Cfg = {
  brand: { name: "Salón" },
  services: [{ id: "cut", name: "תספורת", price: 120, duration: 30 }, { id: "blowdry", name: "פן", price: 80, duration: 30 }],
  staff: [{ id: "noa", name: "נועה", specialty: "צבע" }, { id: "dana", name: "דנה", specialty: "תספורת" }],
  testimonials: [{ id: "r1", name: "יעל", rating: 5, text: "מעולה." }, { id: "r2", name: "מאיה", rating: 4, text: "טוב." }],
  translations: {
    en: {
      hero: { subtitle: "Client subtitle" },
      services: { cut: { name: "Haircut" }, blowdry: { name: "Blow-dry" } },
      staff: { noa: { specialty: "Colour" }, dana: { specialty: "Cuts" } },
      testimonials: { r1: { text: "Excellent." }, r2: { text: "Good." } },
    },
    ru: { services: { blowdry: { name: "Укладка" } }, staff: { dana: { specialty: "Стрижки" } }, testimonials: { r1: { text: "Отлично." } } },
    ar: { testimonials: [{ id: "r1", text: "ممتاز." }, { id: "r2", text: "جيد." }] },
  },
};
/** Copia sin los mapas vacíos que queden dentro de `translations` (quitar el último id de una capa puede dejar `{}` o quitarla). */
function podar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(podar);
  if (!v || typeof v !== "object") return v;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as Record<string, unknown>).sort()) {
    const x = podar((v as Record<string, unknown>)[k]);
    if (x && typeof x === "object" && !Array.isArray(x) && !Object.keys(x).length) continue;
    out[k] = x;
  }
  return out;
}
const igual = (a: unknown, b: unknown) => JSON.stringify(podar(a)) === JSON.stringify(podar(b));

test("`quitarTextoIdioma(config, { seccion, id })` y `renombrarTextoIdioma(config, { seccion, de, a })`, exportadas por src/lib/textos-idioma.ts, son puras: la primera borra `translations.<lang>.<sección>.<id>` en cada idioma y la segunda lo mueve a `<a>`, sin tocar el texto de los otros ids —tampoco el de un `a` que ya tiene texto— ni ninguna otra clave; y aplicadas al borrar un servicio, una persona o una reseña y al cambiarle el id a una reseña, `validateConfig` no da error y `hasBlockingIssues` no bloquea, cuando sin ellas bloquea", async () => {
  // (1) Las dos funciones. Hoy no existen: aquí está el rojo.
  const t = await importarModulo(TEXTOS);
  assert.equal(typeof t.quitarTextoIdioma, "function", `${TEXTOS} debe exportar quitarTextoIdioma (exporta: ${Object.keys(t).join(", ")})`);
  assert.equal(typeof t.renombrarTextoIdioma, "function", `${TEXTOS} debe exportar renombrarTextoIdioma (exporta: ${Object.keys(t).join(", ")})`);
  const quitar = t.quitarTextoIdioma as (c: Cfg, o: Record<string, string>) => Cfg;
  const renombrar = t.renombrarTextoIdioma as (c: Cfg, o: Record<string, string>) => Cfg;
  const leer = t.leerTextoIdioma as (c: Cfg, o: Record<string, string>) => string;
  const v = await importarModulo(VALIDADOR);
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  const hasBlockingIssues = v.hasBlockingIssues as (i: Issue[]) => boolean;
  const errores = (c: Cfg) => validateConfig(c).filter((i) => i.severity === "error").map((i) => i.path).sort();
  const texto = (c: Cfg, seccion: string, id: string, campo: string, idioma: string) => leer(c, { seccion, id, campo, idioma, base: "he" });
  const antes = structuredClone(CONFIG);
  assert.deepEqual(errores(CONFIG), [], "precondición: el cliente de prueba no da ningún error");

  /** La raíz sin el elemento `id` de `seccion` (lo que hace el `remove()` de cada casilla). */
  const sinEnRaiz = (seccion: string, id: string): Cfg => ({ ...structuredClone(CONFIG), [seccion]: CONFIG[seccion].filter((x: Cfg) => x.id !== id) });

  for (const [seccion, id, campo, otro, textoOtro] of [
    ["services", "blowdry", "name", "cut", "Haircut"],
    ["staff", "dana", "specialty", "noa", "Colour"],
    ["testimonials", "r1", "text", "r2", "Good."],
  ] as const) {
    // (2) La otra dirección: borrar sólo en la raíz deja el texto huérfano y el guardado se bloquea (lo que pasa hoy).
    const soloRaiz = sinEnRaiz(seccion, id);
    assert.ok(errores(soloRaiz).includes(`translations.en.${seccion}.${id}`), `${seccion}: sin quitar su texto, «${id}» queda huérfano y el validador lo marca (${errores(soloRaiz).join(", ")})`);
    assert.equal(hasBlockingIssues(validateConfig(soloRaiz)), true, `${seccion}: y el guardado se bloquea`);

    // (3) Con quitarTextoIdioma: ningún idioma conserva el texto de «id», el de los otros ids y todo lo demás no cambia, y guarda.
    const limpio = quitar(soloRaiz, { seccion, id });
    for (const l of ["en", "ru", "ar"]) assert.equal(texto(limpio, seccion, id, campo, l), "", `${seccion}: ${l} ya no tiene texto para «${id}»`);
    assert.equal(texto(limpio, seccion, otro, campo, "en"), textoOtro, `${seccion}: el texto de «${otro}» no cambia`);
    const esperado = structuredClone(soloRaiz);
    for (const l of ["en", "ru"]) delete esperado.translations[l][seccion]?.[id];
    const sinAr = (c: Cfg) => { const x = structuredClone(c); delete x.translations.ar.testimonials; return x; };
    assert.ok(igual(sinAr(limpio), sinAr(esperado)), `${seccion}: quitar «${id}» no toca ninguna otra clave\n${JSON.stringify(podar(limpio.translations))}`);
    if (seccion === "testimonials") assert.equal(texto(limpio, seccion, "r2", campo, "ar"), "جيد.", "ar (array con id): el texto de r2 no cambia");
    else assert.ok(igual(limpio.translations.ar, CONFIG.translations.ar), `${seccion}: la capa ar no cambia`);
    assert.deepEqual(errores(limpio), [], `${seccion}: sin huérfanos, validateConfig no da error`);
    assert.equal(hasBlockingIssues(validateConfig(limpio)), false, `${seccion}: y el guardado no se bloquea`);
  }

  // (4) Renombrar una reseña: r1 → r9 en la raíz y en cada idioma; r2 no cambia; guarda.
  const r9raiz: Cfg = { ...structuredClone(CONFIG), testimonials: CONFIG.testimonials.map((x: Cfg) => (x.id === "r1" ? { ...x, id: "r9" } : x)) };
  assert.equal(hasBlockingIssues(validateConfig(r9raiz)), true, "precondición: cambiar el id sólo en la raíz bloquea el guardado");
  const r9 = renombrar(r9raiz, { seccion: "testimonials", de: "r1", a: "r9" });
  for (const [l, esperado] of [["en", "Excellent."], ["ru", "Отлично."], ["ar", "ممتاز."]]) {
    assert.equal(texto(r9, "testimonials", "r9", "text", l), esperado, `${l}: el texto de r1 pasa a r9`);
    assert.equal(texto(r9, "testimonials", "r1", "text", l), "", `${l}: r1 ya no tiene texto`);
  }
  for (const [l, esperado] of [["en", "Good."], ["ar", "جيد."]]) assert.equal(texto(r9, "testimonials", "r2", "text", l), esperado, `${l}: r2 no cambia`);
  assert.equal(r9.translations.en.hero.subtitle, "Client subtitle", "renombrar no toca ninguna otra clave de la capa");
  assert.ok(igual(r9.translations.en.services, CONFIG.translations.en.services) && igual(r9.translations.ru.staff, CONFIG.translations.ru.staff), "renombrar una reseña no toca servicios ni equipo");
  assert.deepEqual(errores(r9), [], "con el texto movido, validateConfig no da error");
  assert.equal(hasBlockingIssues(validateConfig(r9)), false, "y el guardado no se bloquea");

  // (5) No pisa: un `a` que ya tiene texto en una capa conserva el suyo (esa capa no cambia); un `a` vacío no cambia nada.
  const choque = renombrar(structuredClone(CONFIG), { seccion: "testimonials", de: "r1", a: "r2" });
  assert.equal(texto(choque, "testimonials", "r2", "text", "en"), "Good.", "en: el texto que r2 ya tenía no se pisa");
  assert.equal(texto(choque, "testimonials", "r1", "text", "en"), "Excellent.", "en: esa capa no cambia (r1 queda; el validador lo nombrará)");
  assert.ok(igual(renombrar(structuredClone(CONFIG), { seccion: "testimonials", de: "r1", a: "" }), CONFIG), "un id nuevo vacío no cambia nada");

  // (6) Puras: no mutan lo que reciben.
  assert.deepEqual(CONFIG, antes, "quitarTextoIdioma y renombrarTextoIdioma no mutan el config que reciben");
});

test("las casillas de servicios, equipo y reseñas llaman a `quitarTextoIdioma` al borrar un elemento, y la de reseñas a `renombrarTextoIdioma` al cambiarle el id", () => {
  for (const [seccion, archivo] of Object.entries(CASILLAS)) {
    assert.match(fuente(archivo), /\bquitarTextoIdioma\(/, `${archivo}: al borrar un elemento de ${seccion} quita su texto de cada idioma con quitarTextoIdioma (hoy remove() filtra sólo la raíz)`);
  }
  assert.match(fuente(CASILLAS.testimonials), /\brenombrarTextoIdioma\(/, `${CASILLAS.testimonials}: al cambiar el id de una reseña mueve su texto con renombrarTextoIdioma`);
});
