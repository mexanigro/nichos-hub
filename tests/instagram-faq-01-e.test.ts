// INSTAGRAM-FAQ-01 · copia promovida (CONTACTO-PIE-01, 2026-10-03, D-210). La orden quedó aprobada por Liam el 2026-10-03
// (T 392acff · H 75ede45) y su carpeta está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera.
// INSTAGRAM-FAQ-01 · E3, E4 (H) · lo que dejó la verificadora de TEAM-RESENAS-01 en el hub. Sesión A (2026-10-02): tests rojos.
//
// E3 · CT-2 en todas o en ninguna. Team v6 muestra la frase de la tarjeta móvil (la primera oración de la bio) en todas las tarjetas o
// en ninguna (TEAM-01 § 3-ter; T `team-v6.tsx`, `conFrase = primeras.every(…)`): una persona sin bio apaga la frase de todas. Medido por
// A el 2026-10-02: `validateFraseEquipo` avisa sólo por una primera oración de más de 10 palabras; con una bio que falta y las otras
// presentes devuelve [] y la casilla no dice nada. Que avise también entonces; en las dos direcciones.
// E4 · las variantes de peluquería sólo para peluquería. Medido por la verificadora en barbería (tarjetas sin fondo ni scrim, texto
// blanco sin contraste: las variables de color sólo existen en peluquería) y leído por A el 2026-10-02 en
// `layout-variants-editor.tsx`: cada sección declara sus variantes para todos los nichos y navbar v6, hero v6, services v6, galería v6 y
// v7, team v6 y reseñas v6 se le ofrecen a cualquiera. Liam (2026-10-02, D-194): las ocho variantes de peluquería —esas y las dos nuevas
// de esta orden, faq v6 e instagram v6— se ofrecen sólo con `niche === "peluqueria"`; fuera, cada sección termina en v5. Leído en
// Firestore por A (sólo get, base `default`): ningún config de otro nicho tiene hoy una v6 elegida.
// Caja negra: los módulos con el cargador de `_comun.ts` (la casilla se monta con `renderToString`, D-34: sin navegador ni Firestore).
// Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./orden/instagram-faq-01/_comun.ts";

type Issue = { path: string; message: string; severity: "error" | "warning" };
type Cfg = Record<string, any>;
const VARIANTES = "src/components/config-editors/layout-variants-editor.tsx";

test("`validateFraseEquipo(config)`, encadenada a `validateConfig`, avisa (warning) cuando `sections.team.variant` es v6 y una persona no tiene bio mientras otras sí —la frase de la tarjeta móvil va en todas o en ninguna (CT-2), así que esa bio que falta apaga la de todas—, y no avisa cuando todas la tienen, cuando ninguna la tiene ni con otra variante", async () => {
  const v = await importarModulo("src/lib/config-validator.ts");
  const validar = v.validateFraseEquipo as (c: unknown) => Issue[];
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  assert.equal(typeof validar, "function", "precondición: config-validator.ts exporta validateFraseEquipo (TEAM-RESENAS-01)");
  const base = (staff: Cfg[], variante = "v6"): Cfg => ({ business: { type: "peluqueria" }, sections: { team: { variant: variante } }, staff });
  const bio = "בעלת הסטודיו. ארבע עשרה שנים של צבע.";
  // (1) Una sin bio y dos con bio: avisa por la que falta. Hoy no avisa: aquí está el rojo.
  for (const falta of [{ id: "maya", name: "מאיה" }, { id: "maya", name: "מאיה", bio: "" }, { id: "maya", name: "מאיה", bio: "   " }]) {
    const c = base([{ id: "noa", name: "נועה", bio }, falta, { id: "dana", name: "דנה", bio }]);
    const avisos = validar(c);
    assert.deepEqual(avisos.map((i) => [i.path, i.severity]), [["staff[1].bio", "warning"]], `con team v6, la bio que falta (${JSON.stringify(falta.bio)}) mientras las otras la tienen avisa en staff[1].bio (hoy: ${JSON.stringify(avisos)})`);
    assert.ok(validateConfig(c).some((i) => i.path === "staff[1].bio" && i.severity === "warning"), "validateConfig lo encadena");
  }
  // (2) La otra dirección.
  assert.deepEqual(validar(base([{ id: "noa", name: "נועה", bio }, { id: "maya", name: "מאיה", bio }])), [], "todas con bio (de 10 palabras o menos en la primera oración): sin aviso");
  assert.deepEqual(validar(base([{ id: "noa", name: "נועה" }, { id: "maya", name: "מאיה", bio: "" }])), [], "ninguna con bio: sin aviso (no hay frase en ninguna, que es válido)");
  assert.deepEqual(validar(base([{ id: "noa", name: "נועה", bio }, { id: "maya", name: "מאיה" }], "v5")), [], "con otra variante de team, sin aviso");
});

/** La casilla de variantes montada para un nicho: por cada sección que muestra, las variantes que ofrece (los botones «v1»…). */
async function ofrece(niche: string): Promise<Record<string, string[]>> {
  const SERVIDOR = "react-dom/server";
  const { renderToString } = (await import(SERVIDOR)) as { renderToString: (n: unknown) => string };
  const { createElement } = await import("react");
  const mod = await importarModulo(VARIANTES);
  const secciones = mod.LAYOUT_VARIANT_SECTIONS as { path: string; label: string }[];
  const html = renderToString(createElement(mod.LayoutVariantsEditor as never, { getNested: () => undefined, updateNested: () => {}, niche } as never));
  // cada sección es un bloque que empieza con su rótulo; sus botones son los que siguen hasta el rótulo siguiente
  const marcas = secciones.map((s) => ({ path: s.path, i: html.indexOf(`>${s.label}<`) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
  const out: Record<string, string[]> = {};
  for (const [k, x] of marcas.entries()) out[x.path] = [...html.slice(x.i, marcas[k + 1]?.i ?? html.length).matchAll(/<button\b[^>]*>(v\d)<\/button>/g)].map((m) => m[1]);
  return out;
}

test("la casilla de variantes ofrece las variantes de peluquería —navbar v6, hero v6, services v6, galería v6 y v7, team v6, reseñas v6, faq v6 e instagram v6— sólo con `niche === \"peluqueria\"`: en peluquería las ocho están, y en barbería y en los otros nichos de la flota cada una de esas secciones ofrece sólo de v1 a v5", async () => {
  const PELU: Record<string, string[]> = {
    "navbar.variant": ["v6"], "hero.variant": ["v6"], "sections.services.variant": ["v6"], "sections.gallery.variant": ["v6", "v7"],
    "sections.team.variant": ["v6"], "sections.testimonials.variant": ["v6"], "sections.faq.variant": ["v6"], "sections.instagram.variant": ["v6"],
  };
  const V1_5 = ["v1", "v2", "v3", "v4", "v5"];
  // (1) Barbería: hoy le ofrece navbar, hero, services, galería, team y reseñas en v6/v7. Aquí está el rojo.
  for (const niche of ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"]) {
    const o = await ofrece(niche);
    for (const path of Object.keys(PELU)) {
      assert.ok(o[path], `${niche}: la casilla muestra ${path}`);
      assert.deepEqual(o[path], V1_5, `${niche}: ${path} ofrece sólo v1–v5 (hoy: ${o[path]?.join(", ")})`);
    }
  }
  // (2) Peluquería: las ocho.
  const o = await ofrece("peluqueria");
  for (const [path, vs] of Object.entries(PELU)) {
    assert.ok(o[path], `peluqueria: la casilla muestra ${path}`);
    for (const v of vs) assert.ok(o[path].includes(v), `peluqueria: ${path} ofrece ${v} (hoy: ${o[path].join(", ")})`);
  }
});
