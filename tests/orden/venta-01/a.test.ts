// VENTA-01 · A1 (H) · el link con el nombre de la clienta: la función pura que arma las variables del deploy (D-264..D-267). Sesión A
// (2026-10-06): test rojo.
//
// Medido (D-264): el link de una web de peluquería se arma en el BUILD de T —`scripts/vite-plugin-seo.ts` reescribe <title>, og:* y
// twitter:* del index.html con VITE_BRAND_NAME, VITE_BRAND_TAGLINE, VITE_BRAND_DESCRIPTION y VITE_OG_IMAGE, y si faltan cae a
// `seo-defaults.ts` (peluqueria: «Studio Noa — תספורת, צבע ופן — ברמת גן» y una foto de Unsplash)—; H no le pasa ninguna a Vercel
// (`src/lib/deploy.ts:94-99`). Liam (2026-10-06): sólo peluquería (la flota, en FLOTA-01) y la imagen sale de la casilla «OG Image»
// (`brand.ogImage`). Lo que escribe la clienta es dato: el plugin escapa &, <, > y " pero arma el HTML con String.replace, y un `$` seguido
// de ` ' o & se interpreta como patrón de reemplazo (medido: «Salón $` …» deja 24 <head> y 12 <title>, D-266).
// Caja negra: `import()` dinámico de `src/lib/variables-deploy.ts`, y el plugin de SEO de T 3222922 copiado en `t-3222922/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, htmlDeT, importarModulo, link, type Cfg, type Variable } from "./_comun.ts";

const MODULO = "src/lib/variables-deploy.ts";
const DESTINOS = ["production", "preview"];
const OG = "https://firebasestorage.googleapis.com/v0/b/barbertemplate-madre.firebasestorage.app/o/clients%2Fdemo-x%2Fmedia%2Fimages%2Fog.jpg?alt=media&token=abc";
const hub = (niche = "peluqueria", businessName = "Salón del alta") => ({ clientId: "demo-x", niche, businessName, vercelProjectId: "prj_x" });
const config = (brand: Cfg = {}, business: Cfg = { name: "Salón del negocio" }): Cfg => ({ language: "he", business, brand });
const mapa = (vs: Variable[]) => Object.fromEntries(vs.map((v) => [v.key, v.value]));

test("variablesDeDeploy(config, hub) da, sólo para peluquería, VITE_BRAND_NAME (brand.name, si no business.name, si no el businessName del hub), VITE_BRAND_TAGLINE (brand.tagline), VITE_BRAND_DESCRIPTION (brand.description) y VITE_OG_IMAGE (brand.ogImage, sólo https), en production y preview y de tipo plain; un campo que falta o queda vacío no manda nada; los saltos de línea y los caracteres de control quedan como un espacio; y con lo que la clienta escriba, el HTML que arma el plugin de SEO de T (copiado de T 3222922) tiene un solo head y un solo title, y su title, og:title, og:description y og:image dicen exactamente su texto", async () => {
  // (1) El módulo. Hoy no existe: aquí está el rojo.
  assert.ok(existe(MODULO), `falta ${MODULO} (D-264): hoy el deploy no le pasa a Vercel ni el nombre, ni la línea, ni la descripción, ni la imagen de la clienta, y el link dice «Studio Noa — … ברמת גן»`);
  const { variablesDeDeploy } = await importarModulo(MODULO);
  assert.equal(typeof variablesDeDeploy, "function", `${MODULO} exporta variablesDeDeploy`);
  const vars = (c: Cfg, h: Cfg) => variablesDeDeploy(c, h) as Variable[];

  // (2) Las cuatro, de su campo, en production y preview y plain.
  const completa = vars(config({ name: "Salón Noga", tagline: "Color y rizos", description: "Un salón chico en el barrio.", ogImage: OG }), hub());
  assert.deepEqual(mapa(completa), { VITE_BRAND_NAME: "Salón Noga", VITE_BRAND_TAGLINE: "Color y rizos", VITE_BRAND_DESCRIPTION: "Un salón chico en el barrio.", VITE_OG_IMAGE: OG }, "las cuatro variables, cada una de su campo");
  for (const v of completa) {
    assert.deepEqual([...v.target].sort(), [...DESTINOS].sort(), `${v.key} va a production y preview`);
    assert.equal(v.type, "plain", `${v.key} es plain (no es un secreto)`);
  }

  // (3) El nombre: brand.name, si no business.name, si no el businessName del hub.
  assert.equal(mapa(vars(config({}), hub())).VITE_BRAND_NAME, "Salón del negocio", "sin brand.name, el nombre es business.name");
  assert.equal(mapa(vars(config({}, {}), hub())).VITE_BRAND_NAME, "Salón del alta", "sin brand.name ni business.name, el businessName del hub");
  assert.equal(mapa(vars(config({ name: "   " }, { name: "" }), hub())).VITE_BRAND_NAME, "Salón del alta", "un nombre en blanco no cuenta");

  // (4) Lo que falta o queda vacío no manda nada: nunca un texto vacío que pise el default.
  const minima = vars(config({ name: "Salón Noga", tagline: "  \n ", description: "", ogImage: "" }), hub());
  assert.deepEqual(minima.map((v) => v.key), ["VITE_BRAND_NAME"], "sólo el nombre: la línea, la descripción y la imagen vacías no mandan nada");
  for (const v of vars(config({ name: "A", tagline: "B", description: "C", ogImage: OG }), hub())) assert.ok(v.value.trim(), `${v.key} nunca va vacía`);

  // (5) La imagen, sólo https (la casilla sube a Storage; una ruta relativa o http no va).
  for (const malo of ["/og.jpg", "http://example.com/og.jpg", "javascript:alert(1)", "og.jpg"]) {
    assert.ok(!("VITE_OG_IMAGE" in mapa(vars(config({ name: "A", ogImage: malo }), hub()))), `brand.ogImage «${malo}» no manda VITE_OG_IMAGE`);
  }

  // (6) Sólo peluquería (Liam, 2026-10-06): la flota no cambia en su próximo redeploy.
  for (const otro of ["barberia", "tattoo", "nails", "estetica", "cafeteria", "remodelaciones", "employment", ""]) {
    assert.deepEqual(vars(config({ name: "A", tagline: "B", description: "C", ogImage: OG }), hub(otro)), [], `nicho «${otro}»: ninguna variable`);
  }

  // (7) Saltos de línea y caracteres de control: un espacio, sin dobles.
  const sucia = mapa(vars(config({ name: "Salón\nNoga", tagline: "Color\r\n\ty\u2028rizos\u0007", description: "  Un\u0000salón  chico  " }), hub()));
  assert.equal(sucia.VITE_BRAND_NAME, "Salón Noga", "el salto de línea del nombre queda como un espacio");
  assert.equal(sucia.VITE_BRAND_TAGLINE, "Color y rizos", "CRLF, tab, U+2028 y un carácter de control: un espacio cada tramo, sin dobles ni bordes");
  assert.equal(sucia.VITE_BRAND_DESCRIPTION, "Un salón chico", "los espacios repetidos y los bordes se limpian");

  // (8) El HTML que arma T con lo que escriba la clienta: un solo head, un solo title, y su texto exacto en el link.
  const casos: Cfg[] = [
    { name: "Salón $` Noga", tagline: "Color $' y $& rizos", description: "Desde $$ y $1, con «comillas» \"dobles\" & <b>etiquetas</b>" },
    { name: "Noga <script>alert(1)</script>", tagline: "</title><meta property=\"og:title\" content=\"x\" />", description: "a\nb" },
    { name: "שיער של נוגה", tagline: "צבע ותלתלים", description: "סלון קטן לשיער." },
  ];
  for (const brand of casos) {
    const vs = mapa(vars(config({ ...brand, ogImage: OG }), hub()));
    const html = await htmlDeT({ VITE_ACTIVE_NICHE: "peluqueria", VITE_UI_LANGUAGE: "he", ...vs });
    const l = link(html);
    const limpio = (s: string) => s.replace(/\s+/g, " ").trim();
    const esperado = `${limpio(brand.name)} — ${limpio(brand.tagline)}`;
    assert.equal(l.heads, 1, `«${brand.name}»: el HTML tiene un solo <head> (tiene ${l.heads})`);
    assert.equal(l.titles, 1, `«${brand.name}»: el HTML tiene un solo <title> (tiene ${l.titles})`);
    assert.ok(!/<script>alert/i.test(html), `«${brand.name}»: ninguna etiqueta de la clienta llega al HTML sin escapar`);
    assert.equal(l.title, esperado, `«${brand.name}»: el <title> es su nombre y su línea`);
    assert.equal(l.ogTitle, esperado, `«${brand.name}»: og:title es su nombre y su línea`);
    assert.equal(l.ogDescription, limpio(brand.description), `«${brand.name}»: og:description es su descripción`);
    assert.equal(l.ogImage, OG, `«${brand.name}»: og:image es su brand.ogImage`);
  }
});
