// CONEXION-04 · A (H) · la casilla de galería en el constructor: src/components/config-editors/gallery-editor.tsx con las cuatro
// funciones puras (aplicarPieza, aplicarAltIdioma, aplicarSeleccion, aplicarSurfaceGaleria) + nombreFotoGaleria y formularioFotoGaleria,
// su render en servidor con niche peluqueria/barberia (D-34, D-47) y la prueba «lo que la casilla escribe = lo que tiene el tenant»
// (A4, como en CONEXION-03 · inciso n). Sesión A (2026-09-22): tests rojos — el editor NO existe, así que el rojo cae en el `existsSync`
// de cada test. El editor se importa con extensión por el cargador de .tsx de _util.ts (con resolución de `@/` y de imports sin
// extensión, § Interfaz). Ningún test sube nada ni escribe en Firestore: A3 sólo construye el FormData y calcula paths; A4 usa
// `b4-tenant.ts show`, que sólo lee. Sólo en H (A1–A4).
// VERDAD-08 E2 (2026-09-22): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el
// original de la carpeta congelada no se toca).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  COMPONENTE, ID_A, LANGS, RAIZ_H, ROOT, TAB, TENANT, TIPOS,
  altsDe, clon, contiene, correrLargo, fixture, fotoEsperada, galeria, get, importarModulo, pathDeUrl, piezas,
} from "./orden/conexion-04/_util.ts";

type Cfg = Record<string, unknown>;
type Casilla = {
  aplicarPieza: (config: unknown, i: number, campo: string, valor: unknown) => Cfg;
  aplicarAltIdioma: (config: unknown, id: string, lang: string, texto: string) => Cfg;
  aplicarSeleccion: (config: unknown, id: string, activo: boolean) => Cfg;
  aplicarSurfaceGaleria: (config: unknown, valor: string) => Cfg;
  nombreFotoGaleria: (i: number, nombreArchivo: string) => string;
  formularioFotoGaleria: (archivo: File, i: number) => FormData;
};
const CAMPOS = ["id", "src", "type", "alt", "serviceId"] as const;

/** Importa el editor y afirma, una función por aserción, que exporta la interfaz de A1/A3 (el rojo de hoy cae en el existsSync). */
async function casilla(...necesarias: (keyof Casilla)[]): Promise<Casilla> {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  for (const nombre of necesarias) assert.equal(typeof m[nombre], "function", `${COMPONENTE} exporta ${nombre}`);
  return m as unknown as Casilla;
}

/** El fixture A sin lo que la casilla escribe: `sections.gallery.{items,selection,surface}`, `gallery[]` y las tres `alts`. */
function basePelada(): Cfg {
  const A = clon(fixture("a"));
  const sec = galeria(A);
  delete sec.items; delete sec.selection; delete sec.surface;
  delete A.gallery;
  for (const lang of LANGS) delete (get(A, `translations.${lang}.sections.gallery`) as Cfg).alts;
  return A;
}

/** Aplica sobre `basePelada()` los valores de A con las cuatro funciones puras (A1). */
function reconstruir(m: Casilla): Cfg {
  const A = fixture("a");
  let cfg: Cfg = basePelada();
  piezas(A).forEach((p, i) => {
    for (const campo of CAMPOS) if (p[campo] !== undefined) cfg = m.aplicarPieza(cfg, i, campo, p[campo]);
  });
  for (const lang of LANGS) for (const [id, texto] of Object.entries(altsDe(A, lang))) cfg = m.aplicarAltIdioma(cfg, id, lang, texto);
  for (const id of galeria(A).selection as string[]) cfg = m.aplicarSeleccion(cfg, id, true);
  return m.aplicarSurfaceGaleria(cfg, String(galeria(A).surface));
}

/** Bloque «## config (existe)» de la salida de `show`, como JSON (CONEXION-02 lo dejó sin recorte). */
function configDeShow(stdout: string): Cfg {
  const marca = "## config (existe)";
  const i = stdout.indexOf(marca);
  assert.ok(i >= 0, `show imprime «${marca}» para ${ID_A}:\n${stdout.slice(-1500)}`);
  const resto = stdout.slice(i + marca.length);
  const j = resto.search(/^## /m);
  const texto = (j < 0 ? resto : resto.slice(0, j)).trim();
  try { return JSON.parse(texto) as Cfg; } catch (e) { throw new Error(`show imprime el documento config entero como JSON: ${(e as Error).message}\n…${texto.slice(-300)}`); }
}

test("src/components/config-editors/gallery-editor.tsx exporta funciones puras que devuelven un config nuevo sin tocar otras claves: `aplicarPieza(config, i, campo, valor)` con campo `id`, `src`, `type`, `alt` (hebreo) o `serviceId` sobre `sections.gallery.items[i]` (crea la pieza si no existe; `src` también reescribe `gallery[i]` de la raíz, D-49; `serviceId` vacío borra la clave); `aplicarAltIdioma(config, id, lang, texto)` con lang `en` | `ru` | `ar` sobre `translations.<lang>.sections.gallery.alts[id]` (texto vacío borra la clave); `aplicarSeleccion(config, id, activo)` sobre `sections.gallery.selection` (ids en el orden de `items`; lista vacía borra la clave); `aplicarSurfaceGaleria(config, valor)` sobre `sections.gallery.surface`; y `nombreFotoGaleria(i, nombreArchivo)` = `galeria-<i+1>.<ext>` (D-50). Aplicadas sobre el fixture A sin `sections.gallery.{items,selection,surface}`, sin `gallery[]` y sin `translations.*.sections.gallery.alts`, con los valores de A, devuelven `sections.gallery`, `gallery` y `translations.{en,ru,ar}.sections.gallery.alts` iguales a los de A (deepEqual)", async () => {
  const m = await casilla("aplicarPieza", "aplicarAltIdioma", "aplicarSeleccion", "aplicarSurfaceGaleria", "nombreFotoGaleria");
  // nombreFotoGaleria: el nombre fijo de D-50, con la extensión normalizada al juego declarado (jpg, webp, avif, png).
  for (const [entrada, salida] of [["foto.jpg", "jpg"], ["FOTO.JPG", "jpg"], ["foto.jpeg", "jpg"], ["x.webp", "webp"], ["x.avif", "avif"], ["x.PNG", "png"]]) {
    assert.equal(m.nombreFotoGaleria(0, entrada), `galeria-1.${salida}`, `nombreFotoGaleria(0, ${entrada}) = galeria-1.${salida} (D-50)`);
  }
  assert.equal(m.nombreFotoGaleria(5, "cualquiera.jpg"), "galeria-6.jpg", "el índice es 0-based y el nombre 1-based");
  // Las cuatro funciones sobre el fixture A pelado → exactamente sections.gallery, gallery y las tres alts de A.
  const A = fixture("a");
  const hecho = reconstruir(m);
  assert.deepEqual(get(hecho, "sections.gallery"), galeria(A), "aplicar las piezas, la selección y la superficie de A devuelve su `sections.gallery`");
  assert.deepEqual(hecho.gallery, A.gallery, "las `src` de las piezas reescriben `gallery[]` de la raíz (D-49)");
  for (const lang of LANGS) assert.deepEqual(get(hecho, `translations.${lang}.sections.gallery.alts`), altsDe(A, lang), `aplicar los alt de ${lang} devuelve sus alts`);
  // Puras: no mutan la entrada y no tocan otras claves.
  const base: Cfg = {
    services: [{ id: "cut", name: "Cut", price: 10 }, { id: "color", name: "Color", price: 20 }],
    sections: { gallery: { variant: "v6" }, services: { variant: "v6" } },
    hero: { variant: "v6" },
    translations: { en: { sections: { gallery: { alts: { vieja: "old" } } } } },
  };
  const copia = clon(base);
  const p1 = m.aplicarPieza(base, 0, "id", "g-color");
  assert.deepEqual(base, copia, "aplicarPieza no muta el config de entrada");
  assert.deepEqual(get(p1, "sections.gallery.items"), [{ id: "g-color" }], "crea la pieza 0 con sólo el campo escrito");
  assert.equal(get(p1, "sections.gallery.variant"), "v6", "sections.gallery.variant sigue");
  assert.deepEqual(get(p1, "sections.services"), get(copia, "sections.services"), "sections.services no cambia");
  assert.deepEqual(p1.hero, copia.hero, "hero no cambia");
  // `src` escribe la pieza y el respaldo `gallery[i]` de la raíz, en la misma posición (D-49).
  const p2 = m.aplicarPieza(p1, 0, "src", "https://u/galeria-1.jpg");
  assert.equal(get(p2, "sections.gallery.items.0.src"), "https://u/galeria-1.jpg");
  assert.deepEqual(p2.gallery, ["https://u/galeria-1.jpg"], "gallery[0] = la src de la pieza 0 (D-49)");
  const p3 = m.aplicarPieza(m.aplicarPieza(p2, 1, "id", "g-cortes"), 1, "src", "https://u/galeria-2.jpg");
  assert.deepEqual(p3.gallery, ["https://u/galeria-1.jpg", "https://u/galeria-2.jpg"], "gallery[] sigue el orden de items[]");
  // `serviceId` vacío borra la clave; los demás campos siguen.
  const p4 = m.aplicarPieza(p3, 0, "serviceId", "cut");
  assert.equal(get(p4, "sections.gallery.items.0.serviceId"), "cut");
  const p5 = m.aplicarPieza(p4, 0, "serviceId", "");
  assert.ok(!Object.hasOwn(get(p5, "sections.gallery.items.0") as object, "serviceId"), "serviceId vacío borra la clave");
  assert.equal(get(p5, "sections.gallery.items.0.id"), "g-color", "el resto de la pieza sigue");
  // aplicarAltIdioma: escribe por id y lang; el texto vacío borra la clave.
  const a1 = m.aplicarAltIdioma(base, "g-color", "ru", "Окрашивание");
  assert.deepEqual(base, copia, "aplicarAltIdioma no muta el config de entrada");
  assert.equal(get(a1, "translations.ru.sections.gallery.alts.g-color"), "Окрашивание");
  assert.deepEqual(get(a1, "translations.en.sections.gallery.alts"), { vieja: "old" }, "los alt de otro idioma no cambian");
  const a2 = m.aplicarAltIdioma(a1, "g-color", "ru", "");
  assert.ok(!Object.hasOwn(get(a2, "translations.ru.sections.gallery.alts") as object, "g-color"), "el texto vacío borra el alt de esa pieza");
  // aplicarSeleccion: ids en el orden de items; la lista vacía borra la clave.
  const s1 = m.aplicarSeleccion(p3, "g-cortes", true);
  assert.deepEqual(p3.gallery, ["https://u/galeria-1.jpg", "https://u/galeria-2.jpg"], "aplicarSeleccion no muta el config de entrada");
  const s2 = m.aplicarSeleccion(s1, "g-color", true);
  assert.deepEqual(get(s2, "sections.gallery.selection"), ["g-color", "g-cortes"], "selection queda en el orden de items, no en el de marcado");
  const s3 = m.aplicarSeleccion(m.aplicarSeleccion(s2, "g-color", false), "g-cortes", false);
  assert.ok(!Object.hasOwn(get(s3, "sections.gallery") as object, "selection"), "sin piezas marcadas, la clave selection se borra");
  // aplicarSurfaceGaleria: escribe sólo sections.gallery.surface.
  const u1 = m.aplicarSurfaceGaleria(base, "textura");
  assert.deepEqual(base, copia, "aplicarSurfaceGaleria no muta el config de entrada");
  assert.equal(get(u1, "sections.gallery.surface"), "textura");
  assert.deepEqual(get(u1, "sections.services"), get(copia, "sections.services"), "sections.services no cambia");
});

test("`renderToString(<GalleryEditor …>)` con `niche=\"peluqueria\"` y la galería de A muestra, para la pieza abierta (la primera), los campos `id`, `type` (select con los seis tipos de GALLERY_TYPES), foto (url actual de `items[0].src`), `alt` en cuatro idiomas (etiquetas he, en, ru, ar con los cuatro textos de A) y `serviceId` (select con los ids del catálogo de A); por pieza, la marca de `selection`; y a nivel de sección el campo `surface` con valor `textura`; con `niche=\"barberia\"` devuelve cadena vacía (D-47); y src/components/client-config-tab.tsx monta `GalleryEditor` pasando `niche` y escribe en el mismo `config` que guarda por `/api/config/${clientId}`", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  assert.equal(typeof m.GalleryEditor, "function", `${COMPONENTE} exporta GalleryEditor`);
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  type Props = { niche: string; config: Cfg; setConfig: (...args: unknown[]) => void; clientId: string };
  const Editor = m.GalleryEditor as (props: Props) => ReturnType<typeof createElement>;
  const A = fixture("a");
  const render = (niche: string) => renderToString(createElement(Editor, { niche, config: clon(A), setConfig: () => {}, clientId: "x" }));

  const html = render("peluqueria");
  for (const clave of ["id", "type", "alt", "serviceId", "selection", "surface"]) assert.ok(html.includes(clave), `el render con peluquería nombra «${clave}»`);
  for (const tipo of TIPOS) assert.match(html, new RegExp(`<option[^>]*value="${tipo}"`), `el select de type tiene la opción «${tipo}» (GALLERY_TYPES)`);
  const primera = piezas(A)[0];
  assert.match(html, new RegExp(`<option[^>]*value="${String(primera.type)}"[^>]*selected`), `el select de type marca el tipo de la pieza abierta («${String(primera.type)}»)`);
  assert.ok(contiene(html, String(primera.src)), "el campo de la foto muestra la url de sections.gallery.items[0].src");
  assert.ok(contiene(html, String(primera.alt)), "el campo alt (he) muestra el alt de la pieza abierta");
  for (const lang of LANGS) assert.ok(contiene(html, altsDe(A, lang)[String(primera.id)]), `el campo alt (${lang}) muestra translations.${lang}.sections.gallery.alts["${String(primera.id)}"]`);
  for (const s of A.services as { id: string }[]) assert.match(html, new RegExp(`<option[^>]*value="${s.id}"`), `el select de serviceId tiene el servicio «${s.id}» del catálogo de A`);
  assert.match(html, /value="textura"/, "el campo surface de la sección lleva el valor «textura» de A");
  // Con barbería, la casilla no se monta (D-47).
  assert.equal(render("barberia"), "", "con niche=barberia el editor devuelve cadena vacía (D-47)");
  // client-config-tab.tsx monta <GalleryEditor … niche={…} /> y guarda por /api/config/${clientId}.
  const tab = readFileSync(resolve(ROOT, TAB), "utf8");
  assert.ok(tab.includes("/api/config/${clientId}"), `precondición: ${TAB} guarda por /api/config/\${clientId}`);
  const montaje = tab.match(/<GalleryEditor\b[\s\S]*?\/>/);
  assert.ok(montaje, `${TAB} monta <GalleryEditor … />`);
  assert.match(montaje[0], /\bniche=\{/, `el montaje pasa niche:\n${montaje[0]}`);
});

test("la foto de una pieza sube por `/api/upload/${clientId}` con `rol` = `gallery` y el archivo renombrado a `nombreFotoGaleria(i, nombre)` (`formularioFotoGaleria(archivo, i)` devuelve el FormData; lanza si el tipo no es image/jpeg, png, webp o avif); el path que `subirMaterial` produce para cada una de las seis fotos de A (`clients/<id>/media/gallery/galeria-<n>.jpg`) es igual al path decodificado de `items[i].src` en el fixture A (seis de seis)", async () => {
  const m = await casilla("formularioFotoGaleria", "nombreFotoGaleria");
  const archivo = (tipo: string, nombre = "cualquiera.jpg") => new File([Buffer.from("00")], nombre, { type: tipo });
  const fd = m.formularioFotoGaleria(archivo("image/jpeg"), 0);
  assert.ok(fd instanceof FormData, "devuelve un FormData");
  assert.equal(fd.get("rol"), "gallery", "campo rol = gallery");
  const f = fd.get("file");
  assert.ok(f instanceof File, "campo file es un File");
  assert.equal(f.name, "galeria-1.jpg", "el archivo va renombrado a nombreFotoGaleria(0, …)");
  assert.equal(f.type, "image/jpeg");
  const acepta = (tipo: string, nombre?: string) => { try { m.formularioFotoGaleria(archivo(tipo, nombre), 3); return true; } catch { return false; } };
  for (const [tipo, nombre] of [["image/jpeg", "x.jpg"], ["image/png", "x.png"], ["image/webp", "x.webp"], ["image/avif", "x.avif"]]) {
    assert.ok(acepta(tipo, nombre), `acepta ${tipo}`);
    assert.equal((m.formularioFotoGaleria(archivo(tipo, nombre), 3).get("file") as File).name, m.nombreFotoGaleria(3, nombre), `file.name = nombreFotoGaleria(3, ${nombre})`);
  }
  for (const tipo of ["video/mp4", "video/webm", "text/plain", "application/pdf", ""]) assert.ok(!acepta(tipo), `rechaza ${tipo}`);
  // Sube por /api/upload/${clientId}.
  assert.ok(readFileSync(resolve(ROOT, COMPONENTE), "utf8").includes("/api/upload/${clientId}"), `${COMPONENTE} sube por /api/upload/\${clientId}`);
  // Path de subirMaterial (CONEXION-01 A1: clients/<id>/media/<rol>/<nombre saneado>) = el del fixture A, foto a foto.
  const items = piezas(fixture("a"));
  assert.equal(items.length, 6, "precondición: el fixture A declara seis piezas");
  items.forEach((p, i) => {
    const nombre = m.nombreFotoGaleria(i, "cualquiera.jpg");
    assert.equal(nombre, fotoEsperada(i), `nombreFotoGaleria(${i}) = ${fotoEsperada(i)}`);
    assert.match(nombre, /^[A-Za-z0-9._-]+$/, `${nombre} ya está saneado`);
    assert.equal(`clients/${ID_A}/media/gallery/${nombre}`, pathDeUrl(String(p.src)), `path de la foto ${i} = el del fixture A`);
  });
});

test("`scripts/b4-tenant.ts show --id test-b4-peluqueria-a` (con Firestore, sólo lectura) devuelve un `config/{id}` cuyos `sections.gallery`, `gallery` y `translations.{en,ru,ar}.sections.gallery.alts` son iguales a los que A1 construye desde el fixture A", async () => {
  const m = await casilla("aplicarPieza", "aplicarAltIdioma", "aplicarSeleccion", "aplicarSurfaceGaleria");
  const esperado = reconstruir(m);
  assert.ok(existsSync(join(RAIZ_H, ".env.local")), `falta ${RAIZ_H}/.env.local: b4-tenant.ts show no puede leer Firestore (el test no se salta)`);
  const show = correrLargo(["--experimental-strip-types", TENANT, "show", "--id", ID_A], { cwd: RAIZ_H });
  assert.equal(show.status, 0, `b4-tenant.ts show --id ${ID_A} sale 0 (salió ${show.status})\n${show.out.slice(-3000)}`);
  const tenant = configDeShow(show.stdout);
  assert.deepEqual(get(tenant, "sections.gallery"), get(esperado, "sections.gallery"), `sections.gallery del tenant ${ID_A} = lo que la casilla construye desde el fixture`);
  assert.deepEqual(tenant.gallery, esperado.gallery, `gallery[] del tenant ${ID_A} = lo que la casilla construye (D-49)`);
  for (const lang of LANGS) {
    assert.deepEqual(get(tenant, `translations.${lang}.sections.gallery.alts`), get(esperado, `translations.${lang}.sections.gallery.alts`), `los alt de ${lang} del tenant ${ID_A} = los que la casilla construye`);
  }
});
