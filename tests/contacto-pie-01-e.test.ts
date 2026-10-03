// CONTACTO-PIE-01 · copia promovida (CIERRE-TRAMO-01, 2026-10-03, D-221). La orden quedó aprobada por Liam el 2026-10-03
// (T bcb746a · H 52a9af4) y su carpeta está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera.
// CONTACTO-PIE-01 · C3, E2 (H) · la casilla de variantes. Sesión A (2026-10-03): tests rojos.
//
// C3 · el hub puede elegir las dos variantes nuevas. Contacto «ubicación y horarios + contacto» es `sections.contact.variant: "v6"` y el
// cierre y el pie es `footer.variant: "v6"` (D-202); la casilla las ofrece sólo con `niche === "peluqueria"`, como las otras ocho
// variantes de peluquería (D-194; la lección de E2E-01: una variante que la casilla no ofrece no se puede cargar por la ficha).
// E2 · el valor guardado. Lo dejó la verificadora de INSTAGRAM-FAQ-01: con D-194 la casilla calcula el valor actual sólo entre lo que
// ofrece, así que un config de otro nicho que ya tiene guardada una v6 se muestra como «v1» —y el nombre y la descripción de la v1—
// aunque la web siga pintando la v6. Leído por A el 2026-10-03 en `layout-variants-editor.tsx` (`current = offered.includes(raw) ? raw
// : "v1"`). Que muestre el valor guardado y diga que no está disponible para ese nicho; en las dos direcciones.
// Caja negra: el módulo con el cargador de `_comun.ts` (la casilla se monta con `renderToString`, D-34: sin navegador ni Firestore).
// Sólo en H (inciso n). No escribe nada.
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./orden/contacto-pie-01/_comun.ts";

const VARIANTES = "src/components/config-editors/layout-variants-editor.tsx";
/** El texto fijo que la casilla muestra junto al valor guardado que el nicho no tiene (HOJA, interfaz). */
const NO_DISPONIBLE = "no está disponible para este nicho";
type Spec = { path: string; label: string; variants: Record<string, { name: string; desc: string }> };

/** La casilla de variantes montada para un nicho con lo guardado en `guardado`: por cada sección, su bloque de HTML y los botones que ofrece. */
async function casilla(niche: string, guardado: Record<string, string> = {}): Promise<{ specs: Spec[]; bloques: Record<string, { html: string; ofrece: string[] }> }> {
  const SERVIDOR = "react-dom/server";
  const { renderToString } = (await import(SERVIDOR)) as { renderToString: (n: unknown) => string };
  const { createElement } = await import("react");
  const mod = await importarModulo(VARIANTES);
  const specs = mod.LAYOUT_VARIANT_SECTIONS as Spec[];
  const html = renderToString(createElement(mod.LayoutVariantsEditor as never, { getNested: (p: string) => guardado[p], updateNested: () => {}, niche } as never));
  // cada sección es un bloque que empieza con su rótulo; lo que sigue, hasta el rótulo siguiente, es suyo
  const marcas = specs.map((s) => ({ path: s.path, i: html.indexOf(`>${s.label}<`) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
  const bloques: Record<string, { html: string; ofrece: string[] }> = {};
  for (const [k, x] of marcas.entries()) {
    const trozo = html.slice(x.i, marcas[k + 1]?.i ?? html.length);
    bloques[x.path] = { html: trozo, ofrece: [...trozo.matchAll(/<button\b[^>]*>(v\d)<\/button>/g)].map((m) => m[1]) };
  }
  return { specs, bloques };
}
const decodificar = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

test("la casilla de variantes ofrece contacto v6 (`sections.contact.variant`) y el cierre y el pie v6 (`footer.variant`) sólo con `niche === \"peluqueria\"`: en peluquería están, y en barbería y en los otros nichos de la flota esas dos secciones ofrecen sólo de v1 a v5", async () => {
  const NUEVAS = ["sections.contact.variant", "footer.variant"];
  // (1) Peluquería: hoy contacto y pie terminan en v5. Aquí está el rojo.
  const pelu = (await casilla("peluqueria")).bloques;
  for (const path of NUEVAS) {
    assert.ok(pelu[path], `peluqueria: la casilla muestra ${path}`);
    assert.ok(pelu[path].ofrece.includes("v6"), `peluqueria: ${path} ofrece v6 (hoy: ${pelu[path].ofrece.join(", ")})`);
  }
  // (2) La otra dirección: los seis nichos de la flota, sólo v1–v5.
  for (const niche of ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"]) {
    const o = (await casilla(niche)).bloques;
    for (const path of NUEVAS) assert.deepEqual(o[path]?.ofrece, ["v1", "v2", "v3", "v4", "v5"], `${niche}: ${path} ofrece sólo v1–v5 (hoy: ${o[path]?.ofrece?.join(", ")})`);
  }
});

test("la casilla de variantes muestra el valor guardado aunque el nicho no lo tenga: con una v6 guardada en un config de otro nicho, el bloque de esa sección muestra el nombre de esa variante y la frase «no está disponible para este nicho», sin ofrecerla ni marcar v1; y con un valor que el nicho sí tiene, o en peluquería con su v6, muestra ese nombre sin la frase", async () => {
  const PELU = ["navbar.variant", "hero.variant", "sections.services.variant", "sections.gallery.variant", "sections.team.variant", "sections.testimonials.variant", "sections.faq.variant", "sections.instagram.variant"];
  // (1) Barbería con una v6 guardada en cada sección de peluquería: hoy el bloque muestra «Original» (la v1). Aquí está el rojo.
  const guardado = Object.fromEntries(PELU.map((p) => [p, "v6"]));
  const { specs, bloques } = await casilla("barberia", guardado);
  const nombre = (path: string, v: string) => specs.find((s) => s.path === path)!.variants[v]!.name;
  for (const path of PELU) {
    const b = bloques[path], texto = decodificar(b?.html ?? "");
    assert.ok(texto.includes(nombre(path, "v6")), `barberia con ${path} = v6 guardado: el bloque muestra «${nombre(path, "v6")}» (hoy: «${texto.match(/<p class="text-xs[^"]*">([^<]*)</)?.[1] ?? "—"}»)`);
    assert.ok(texto.includes(NO_DISPONIBLE), `barberia con ${path} = v6 guardado: el bloque dice «${NO_DISPONIBLE}»`);
    assert.deepEqual(b.ofrece, ["v1", "v2", "v3", "v4", "v5"], `barberia: ${path} sigue ofreciendo sólo v1–v5 (${b.ofrece.join(", ")})`);
    assert.ok(!/<button\b[^>]*bg-accent[^>]*>v1<\/button>/.test(b.html), `barberia con ${path} = v6 guardado: v1 no aparece marcado`);
  }
  // (2) La otra dirección: barbería con un valor que tiene (v3), y peluquería con su v6.
  const b3 = await casilla("barberia", { "sections.team.variant": "v3" });
  const t3 = decodificar(b3.bloques["sections.team.variant"].html);
  assert.ok(t3.includes(nombre("sections.team.variant", "v3")) && !t3.includes(NO_DISPONIBLE), "barberia con team v3: el nombre de la v3, sin la frase");
  const p6 = await casilla("peluqueria", guardado);
  for (const path of PELU) {
    const t = decodificar(p6.bloques[path].html);
    assert.ok(t.includes(nombre(path, "v6")) && !t.includes(NO_DISPONIBLE), `peluqueria con ${path} = v6: el nombre de la v6, sin la frase`);
  }
});

type Issue = { path: string; message: string; severity: "error" | "warning" };
const CONTENIDO = "src/components/client-content-tab.tsx";

test("la dirección y la línea de la marca se escriben en cada idioma desde el hub (inciso v): la pestaña Contenido, con su selector de idioma, tiene los campos `contact.address.street`, `.district`, `.cityStateZip` y `brand.tagline` para todos los nichos —`seccionesDeContenido(niche)`— y su guardado en otro idioma los escribe en `translations.<lang>` —`parcheDeContenido`; vaciar uno ya traducido lo borra (null)—; y `validateTextosPorIdioma`, encadenada a `validateConfig`, da error por un campo de `translations.<lang>.contact.address` que no es calle, barrio ni ciudad o que no es texto y por una `translations.<lang>.brand.tagline` que no es texto, y avisa cuando la raíz tiene el dato y la capa de ese idioma existe sin él; sin nada de eso, nada", async () => {
  const CAMPOS = ["contact.address.street", "contact.address.district", "contact.address.cityStateZip", "brand.tagline"];
  // (1) La casilla. Hoy la pestaña Contenido no exporta sus campos ni su guardado, y no tiene estos cuatro: aquí está el rojo.
  const tab = await importarModulo(CONTENIDO);
  const secciones = tab.seccionesDeContenido as ((niche: string) => { fields: { path: string }[] }[]) | undefined;
  const parche = tab.parcheDeContenido as ((content: Record<string, string>, previa: Record<string, string>, esBase: boolean, idioma: string) => Record<string, unknown>) | undefined;
  assert.equal(typeof secciones, "function", "client-content-tab.tsx exporta seccionesDeContenido(niche)");
  assert.equal(typeof parche, "function", "client-content-tab.tsx exporta parcheDeContenido(content, previa, esBase, idioma)");
  for (const niche of ["peluqueria", "barberia", "cafeteria", "remodelaciones"]) {
    const paths = secciones!(niche).flatMap((s) => s.fields.map((f) => f.path));
    for (const c of CAMPOS) assert.ok(paths.includes(c), `${niche}: la pestaña Contenido tiene el campo ${c}`);
  }
  const contenido = { "contact.address.street": "Florentin St", "contact.address.district": "Florentin", "contact.address.cityStateZip": "Tel Aviv-Yafo", "brand.tagline": "Colour & hair" };
  assert.deepEqual(parche!(contenido, {}, false, "en"), { translations: { en: { contact: { address: { street: "Florentin St", district: "Florentin", cityStateZip: "Tel Aviv-Yafo" } }, brand: { tagline: "Colour & hair" } } } }, "en otro idioma, el guardado escribe translations.en");
  assert.deepEqual(parche!({ ...contenido, "brand.tagline": "" }, { "brand.tagline": "Colour & hair" }, false, "en"), { translations: { en: { contact: { address: { street: "Florentin St", district: "Florentin", cityStateZip: "Tel Aviv-Yafo" } }, brand: { tagline: null } } } }, "vaciar una línea ya traducida la borra (null)");
  assert.deepEqual(parche!({ "contact.address.street": "רחוב פלורנטין" }, {}, true, "he"), { contact: { address: { street: "רחוב פלורנטין" } } }, "en el idioma base, la raíz");
  // (2) El validador, en las dos direcciones.
  const v = await importarModulo("src/lib/config-validator.ts");
  const validar = v.validateTextosPorIdioma as (c: unknown) => Issue[];
  const validateConfig = v.validateConfig as (c: unknown) => Issue[];
  const raiz = { business: { type: "peluqueria" }, brand: { name: "נועה", tagline: "צבע ושיער" }, contact: { phone: "+972 3-000-0000", address: { street: "רחוב פלורנטין", district: "פלורנטין", cityStateZip: "תל אביב–יפו" } } };
  const de = (issues: Issue[]) => issues.filter((i) => /\.(contact\.address|brand\.tagline)/.test(i.path)).map((i) => [i.path, i.severity]).sort();
  const mal = { ...raiz, translations: { en: { contact: { address: { street: 7, numero: "12" } }, brand: { tagline: ["x"] } } } };
  assert.deepEqual(de(validar(mal)), [["translations.en.brand.tagline", "error"], ["translations.en.contact.address.cityStateZip", "warning"], ["translations.en.contact.address.district", "warning"], ["translations.en.contact.address.numero", "error"], ["translations.en.contact.address.street", "error"]], `errores y avisos de la dirección y la línea en en (hoy: ${JSON.stringify(de(validar(mal)))})`);
  assert.ok(validateConfig(mal).some((i) => i.path === "translations.en.contact.address.street" && i.severity === "error"), "validateConfig lo encadena");
  const sinLinea = { ...raiz, translations: { ru: { sections: { faq: { title: "Вопросы" } } } } };
  assert.deepEqual(de(validar(sinLinea)), [["translations.ru.brand.tagline", "warning"], ["translations.ru.contact.address.cityStateZip", "warning"], ["translations.ru.contact.address.district", "warning"], ["translations.ru.contact.address.street", "warning"]], "la capa ru existe sin la dirección ni la línea: avisa por cada una");
  const completa = { ...raiz, translations: { en: { contact: { address: { street: "Florentin St", district: "Florentin", cityStateZip: "Tel Aviv-Yafo" } }, brand: { tagline: "Colour & hair" } } } };
  assert.deepEqual(de(validar(completa)), [], "la capa completa: nada");
  assert.deepEqual(de(validar({ ...raiz, translations: { en: { brand: { tagline: null }, contact: { address: { street: null, district: "Florentin", cityStateZip: "Tel Aviv-Yafo" } } } } })).filter(([, s]) => s === "error"), [], "null es un borrado (lo manda el guardado), no un error");
  assert.deepEqual(de(validar({ business: { type: "peluqueria" }, translations: { en: { sections: { faq: { title: "FAQ" } } } } })), [], "sin dirección ni línea en la raíz: nada que avisar");
});
