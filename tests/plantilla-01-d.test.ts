// PLANTILLA-01 · copia promovida (VENTA-01, 2026-10-06, D-270) de tests/orden/plantilla-01/d.test.ts. La orden quedó aprobada por
// Liam el 2026-10-06 (T 3222922 · H 96cef4b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte: entera (ninguna de sus afirmaciones sale a la red: Firestore y Storage en memoria, el cliente de Anthropic falso).
// PLANTILLA-01 · D1 (H) · el defecto que encontró la verificadora de ALTA-IDIOMAS-01 (D-258). Sesión A (2026-10-05): test rojo.
//
// Medido por A en `src/lib/textos-claude.ts` (H 5502f02): `validarPropuesta` recibe las notas de la clienta, pero `cuerpoDePropuesta` vuelve
// a validar SIN ellas (`validarPropuesta(c, niche, base, propuesta)`, línea 174): un texto aceptado con un número que sólo está en las
// notas (p. ej. «desde 2011») pasa la propuesta, el dueño lo acepta y al guardar se pierde en silencio. Se arregla en la función —
// `cuerpoDePropuesta` recibe las notas— y nada que el dueño aceptó se descarta sin decirlo: `descartadosDePropuesta` dice cada aceptado
// que no va en el cuerpo y por qué; la pestaña Contenido lo muestra (`PropuestaDeTextos` con `descartados`) y la consola lo imprime
// (`aplicarTextos`, B2).
// Caja negra: las funciones de H por `import()` dinámico, el componente sin estado llamado como función y la fuente de la pestaña.
// Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, fuente, importarModulo, porJson, type Cfg, type Issue } from "./orden/plantilla-01/_comun.ts";

const NOTAS = "פתוחות מאז 2011.";
const TEXTO = "Open since 2011, colour and cuts";

/** Recorre el árbol de elementos de React de un componente sin hooks (copiado de ../alta-idiomas-01/_comun.ts). */
function recorrer(nodo: unknown, out: { elementos: Cfg[]; textos: string[] } = { elementos: [], textos: [] }) {
  if (nodo == null || typeof nodo === "boolean") return out;
  if (typeof nodo === "string" || typeof nodo === "number") { out.textos.push(String(nodo)); return out; }
  if (Array.isArray(nodo)) { for (const n of nodo) recorrer(n, out); return out; }
  const el = nodo as Cfg;
  if (typeof el.type === "function") return recorrer(el.type(el.props ?? {}), out);
  if (typeof el.type === "string") out.elementos.push(el);
  recorrer(el.props?.children, out);
  return out;
}

test("un texto aceptado con un número que sólo está en las notas de la clienta llega al cuerpo cuando cuerpoDePropuesta recibe las notas, y sin las notas no llega; descartadosDePropuesta dice cada aceptado que no va en el cuerpo y por qué (y nada cuando todo entra); PropuestaDeTextos muestra los descartados; y la pestaña Contenido le pasa las notas a cuerpoDePropuesta y a descartadosDePropuesta y le pasa los descartados a PropuestaDeTextos", async () => {
  const m = await importarModulo("src/lib/textos-claude.ts");
  const { translations: _t, ...config } = porJson(fixture("a"));
  const propuesta = { en: { "hero.subtitle": TEXTO } };
  const aceptados = ["en:hero.subtitle"];
  assert.ok(!JSON.stringify(config).includes("2011"), "precondición (ARNÉS): la clienta no dio «2011» en su web, sólo en las notas");
  const errores = (m.validarPropuesta(config, "peluqueria", "he", propuesta, NOTAS) as Issue[]).filter((e) => e.severity === "error");
  assert.deepEqual(errores, [], "precondición: con las notas, la propuesta no tiene error (se puede aceptar)");

  // (1) La función: con las notas entra; sin ellas, no.
  const con = m.cuerpoDePropuesta(config, "peluqueria", "he", propuesta, aceptados, NOTAS) as Cfg;
  assert.equal(con?.translations?.en?.hero?.subtitle, TEXTO, "cuerpoDePropuesta con las notas manda el texto aceptado (hoy lo pierde en silencio)");
  const sin = m.cuerpoDePropuesta(config, "peluqueria", "he", propuesta, aceptados) as Cfg;
  assert.equal(sin?.translations?.en?.hero?.subtitle, undefined, "sin las notas, un número que la clienta no dio no entra");

  // (2) Lo que no entra se dice.
  assert.equal(typeof m.descartadosDePropuesta, "function", "textos-claude.ts exporta descartadosDePropuesta");
  const d = m.descartadosDePropuesta(config, "peluqueria", "he", propuesta, aceptados) as Issue[];
  assert.deepEqual(d.map((x) => x.path), ["en:hero.subtitle"], "sin las notas, el aceptado que no entra se dice");
  assert.ok(d[0]?.message?.includes("2011"), `con su motivo (${d[0]?.message})`);
  assert.deepEqual(m.descartadosDePropuesta(config, "peluqueria", "he", propuesta, aceptados, NOTAS), [], "con las notas, nada se descarta");
  const igual = m.descartadosDePropuesta(config, "peluqueria", "he", { he: { "hero.subtitle": config.hero.subtitle } }, ["he:hero.subtitle"]) as Issue[];
  assert.deepEqual(igual.map((x) => x.path), ["he:hero.subtitle"], "un aceptado que no va en el cuerpo por otra razón (ya tiene texto) también se dice");

  // (3) La pestaña lo muestra.
  const { PropuestaDeTextos } = await importarModulo("src/components/propuesta-textos.tsx");
  const arbol = recorrer(PropuestaDeTextos({ propuesta, errores: [], aceptados, onCambio: () => {}, descartados: d }));
  const avisos = arbol.elementos.filter((e) => e.props?.role === "alert" || e.props?.role === "status").map((e) => recorrer(e.props?.children).textos.join(""));
  assert.ok(avisos.some((t) => t.includes(d[0].message) && t.includes("hero.subtitle")), `PropuestaDeTextos muestra, en un aviso (role alert o status), qué campo no se guardó y por qué (avisos: ${JSON.stringify(avisos).slice(0, 300)})`);
  const sinDescartados = recorrer(PropuestaDeTextos({ propuesta, errores: [], aceptados, onCambio: () => {} }));
  assert.ok(!sinDescartados.textos.join(" ").includes(d[0].message), "y sin descartados no muestra ninguno");
  const tab = fuente("src/components/client-content-tab.tsx");
  assert.match(tab, /cuerpoDePropuesta\([^)]*\bnotas\b[^)]*\)/, "la pestaña le pasa las notas a cuerpoDePropuesta");
  assert.match(tab, /descartadosDePropuesta\([^)]*\bnotas\b[^)]*\)/, "la pestaña calcula los descartados con las notas");
  assert.match(tab, /<PropuestaDeTextos[^>]*\bdescartados=/, "la pestaña le pasa los descartados a PropuestaDeTextos");
});
