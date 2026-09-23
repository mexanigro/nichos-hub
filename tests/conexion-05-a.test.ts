// CONEXION-05 · A (H) · la casilla de fondo y branding en el constructor: src/components/config-editors/fondo-editor.tsx con las
// funciones puras (aplicarModo, aplicarFondo) + nombreFondo y formularioFondo, su render en servidor con niche peluqueria/barberia
// (D-34, D-67) y la prueba «lo que la casilla escribe = lo que tiene el tenant» (A4, inciso n). Sesión A (2026-09-22): tests rojos — el
// editor NO existe, así que el rojo de los cuatro cae en el `existsSync`. El editor se importa con extensión por el cargador de .tsx de
// _comun.ts (con resolución de `@/` y de imports sin extensión, § Interfaz). Ningún test sube nada ni escribe en Firestore: A3 sólo
// construye el FormData y calcula paths; A4 usa `b4-tenant.ts show`, que sólo lee. Sólo en H (A1–A4).
// D-65: el fixture A todavía no tiene `branding.mode` en disco (lo escribe B); mientras tanto el test lo añade EN MEMORIA
// (`A.branding.mode ??= "light"`), que es su modo efectivo (T getNicheDefaultMode: peluquería sin `mode` → light). B4 (en T) es la
// afirmación que exige el campo en disco.
// CONEXION-06 D2 (2026-09-23): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el
// original de la carpeta congelada no se toca).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CAMPOS_FOTO, COMPONENTE, ID_A, MODOS, RAIZ_H, ROL_FONDO, ROOT, TAB, TENANT,
  branding, clon, contiene, correrLargo, fixture, fondoEsperado, get, importarModulo, pathDeUrl, type CampoFoto,
} from "./orden/conexion-05/_comun.ts";

type Cfg = Record<string, unknown>;
type Casilla = {
  aplicarModo: (config: unknown, valor: string) => Cfg;
  aplicarFondo: (config: unknown, campo: string, url: string) => Cfg;
  nombreFondo: (campo: string, nombreArchivo: string) => string;
  formularioFondo: (archivo: File, campo: string) => FormData;
};

/** Importa el editor y afirma, una función por aserción, que exporta la interfaz que la hoja fija (el rojo de hoy cae en el existsSync). */
async function casilla(...necesarias: (keyof Casilla)[]): Promise<Casilla> {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  for (const nombre of necesarias) assert.equal(typeof m[nombre], "function", `${COMPONENTE} exporta ${nombre}`);
  return m as unknown as Casilla;
}

/** El fixture A con `branding.mode` añadido en memoria mientras D-65 no esté en disco (B4 exige el campo en disco). */
function fixtureA(): Cfg {
  const A = clon(fixture("a"));
  branding(A).mode ??= "light";
  return A;
}

/** El fixture A sin lo que la casilla escribe: `branding.{mode,texture,localPhoto,localPhotoMobile}`. */
function basePelada(): Cfg {
  const A = fixtureA();
  const b = branding(A);
  delete b.mode; delete b.texture; delete b.localPhoto; delete b.localPhotoMobile;
  return A;
}

/** Aplica sobre `basePelada()` los valores de A con las funciones puras (A1). */
function reconstruir(m: Casilla): Cfg {
  const A = fixtureA();
  let cfg: Cfg = m.aplicarModo(basePelada(), String(branding(A).mode));
  for (const campo of CAMPOS_FOTO) cfg = m.aplicarFondo(cfg, campo, String(branding(A)[campo]));
  return cfg;
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

test("src/components/config-editors/fondo-editor.tsx exporta funciones puras que devuelven un config nuevo sin tocar otras claves: `aplicarModo(config, valor)` sobre `branding.mode` («light» | «dark»; vacío borra la clave); `aplicarFondo(config, campo, url)` con campo `texture`, `localPhoto` o `localPhotoMobile` sobre `branding.<campo>` (url vacía borra la clave); y `nombreFondo(campo, nombreArchivo)` = `textura.<ext>` | `local.<ext>` | `local-v.<ext>` (D-66). Aplicadas sobre el fixture A sin `branding.mode`, `branding.texture`, `branding.localPhoto` ni `branding.localPhotoMobile`, con los valores de A (T dev-fixtures/peluqueria-paleta-a.json, con D-65), devuelven un `branding` igual al de A (deepEqual: `colors`, `paletteMeta` y `heroToBackdrop` intactos)", async () => {
  const m = await casilla("aplicarModo", "aplicarFondo", "nombreFondo");
  // nombreFondo: el nombre fijo de D-66 por campo, con la extensión normalizada al juego declarado (jpg, webp, avif, png).
  for (const campo of CAMPOS_FOTO) {
    for (const [entrada, ext] of [["foto.jpg", "jpg"], ["FOTO.JPG", "jpg"], ["foto.jpeg", "jpg"], ["x.webp", "webp"], ["x.avif", "avif"], ["x.PNG", "png"]]) {
      assert.equal(m.nombreFondo(campo, entrada), fondoEsperado(campo, ext), `nombreFondo(${campo}, ${entrada}) = ${fondoEsperado(campo, ext)} (D-66)`);
    }
  }
  // Las dos funciones sobre el fixture A pelado → exactamente el `branding` de A, entero.
  const A = fixtureA();
  assert.deepEqual(branding(reconstruir(m)), branding(A), "aplicar el modo y las tres fotos de A devuelve su `branding` entero (colors, paletteMeta y heroToBackdrop intactos)");
  // Puras: no mutan la entrada y no tocan otras claves.
  const base: Cfg = {
    branding: { colors: { primary: "#5d7a57" }, paletteMeta: { source: "#5d7a57" }, heroToBackdrop: { relation: "same-hue" } },
    sections: { gallery: { variant: "v6" } },
    hero: { variant: "v6" },
  };
  const copia = clon(base);
  const p1 = m.aplicarModo(base, "dark");
  assert.deepEqual(base, copia, "aplicarModo no muta el config de entrada");
  assert.equal(get(p1, "branding.mode"), "dark");
  assert.deepEqual(get(p1, "branding.colors"), get(copia, "branding.colors"), "branding.colors no cambia");
  assert.deepEqual(get(p1, "branding.paletteMeta"), get(copia, "branding.paletteMeta"), "branding.paletteMeta no cambia");
  assert.deepEqual(get(p1, "branding.heroToBackdrop"), get(copia, "branding.heroToBackdrop"), "branding.heroToBackdrop no cambia (D-64: la casilla no lo edita)");
  assert.deepEqual(p1.sections, copia.sections, "sections no cambia");
  assert.deepEqual(p1.hero, copia.hero, "hero no cambia");
  for (const modo of MODOS) assert.equal(get(m.aplicarModo(base, modo), "branding.mode"), modo, `aplicarModo escribe «${modo}»`);
  const sinModo = m.aplicarModo(p1, "");
  assert.ok(!Object.hasOwn(get(sinModo, "branding") as object, "mode"), "el valor vacío borra branding.mode");
  assert.deepEqual(get(sinModo, "branding.colors"), get(copia, "branding.colors"), "borrar el modo no toca los colores");
  // aplicarFondo: una clave por campo; la url vacía la borra.
  let cfg: Cfg = base;
  for (const campo of CAMPOS_FOTO) {
    const antes = clon(cfg);
    cfg = m.aplicarFondo(cfg, campo, `https://u/${fondoEsperado(campo)}`);
    assert.deepEqual(antes, clon(antes), "aplicarFondo no muta el config de entrada");
    assert.equal(get(cfg, `branding.${campo}`), `https://u/${fondoEsperado(campo)}`, `aplicarFondo escribe branding.${campo}`);
  }
  assert.deepEqual(base, copia, "aplicarFondo no muta el config de entrada");
  assert.deepEqual(get(cfg, "branding.heroToBackdrop"), get(copia, "branding.heroToBackdrop"), "las tres fotos no tocan heroToBackdrop");
  for (const campo of CAMPOS_FOTO) {
    const borrado = m.aplicarFondo(cfg, campo, "");
    assert.ok(!Object.hasOwn(get(borrado, "branding") as object, campo), `la url vacía borra branding.${campo}`);
    for (const otro of CAMPOS_FOTO) if (otro !== campo) assert.equal(get(borrado, `branding.${otro}`), get(cfg, `branding.${otro}`), `borrar ${campo} no toca ${otro}`);
  }
});

test("`renderToString(<FondoEditor …>)` con `niche=\"peluqueria\"` y el `branding` de A muestra el select `mode` (con `light` y `dark`, y el valor de A), los tres campos de foto con su url actual (`texture`, `localPhoto`, `localPhotoMobile`) y, sólo lectura, la relación `heroToBackdrop` actual (`relation`, `mechanism` y `foot.hex` de A) con la nota «se calcula con transicion.mjs (D-64)»; con `niche=\"barberia\"` devuelve cadena vacía (D-67); y src/components/client-config-tab.tsx monta `FondoEditor` pasando `niche` y escribe en el mismo `config` que guarda por `/api/config/${clientId}`", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  assert.equal(typeof m.FondoEditor, "function", `${COMPONENTE} exporta FondoEditor`);
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  type Props = { niche: string; config: Cfg; setConfig: (...args: unknown[]) => void; clientId: string };
  const Editor = m.FondoEditor as (props: Props) => ReturnType<typeof createElement>;
  const A = fixtureA();
  const b = branding(A);
  const render = (niche: string) => renderToString(createElement(Editor, { niche, config: clon(A), setConfig: () => {}, clientId: "x" }));

  const html = render("peluqueria");
  for (const clave of ["mode", ...CAMPOS_FOTO]) assert.ok(html.includes(clave), `el render con peluquería nombra «${clave}»`);
  for (const modo of MODOS) assert.match(html, new RegExp(`<option[^>]*value="${modo}"`), `el select de mode tiene la opción «${modo}»`);
  assert.match(html, new RegExp(`<option[^>]*value="${String(b.mode)}"[^>]*selected`), `el select de mode marca el valor de A («${String(b.mode)}»)`);
  for (const campo of CAMPOS_FOTO) assert.ok(contiene(html, String(b[campo])), `el campo ${campo} muestra su url actual`);
  // heroToBackdrop: sólo lectura (D-64), con la relación, el mecanismo y el pie medidos por transicion.mjs.
  const rel = b.heroToBackdrop as Record<string, unknown>;
  for (const valor of [String(rel.relation), String(rel.mechanism), String((rel.foot as Record<string, unknown>).hex)]) {
    assert.ok(contiene(html, valor), `el bloque de solo lectura de heroToBackdrop muestra «${valor}»`);
  }
  assert.ok(html.includes("transicion.mjs"), "el bloque de heroToBackdrop dice que se calcula con transicion.mjs (D-64)");
  // Con barbería, la casilla no se monta (D-67).
  assert.equal(render("barberia"), "", "con niche=barberia el editor devuelve cadena vacía (D-67)");
  // client-config-tab.tsx monta <FondoEditor … niche={…} /> y guarda por /api/config/${clientId}.
  const tab = readFileSync(resolve(ROOT, TAB), "utf8");
  assert.ok(tab.includes("/api/config/${clientId}"), `precondición: ${TAB} guarda por /api/config/\${clientId}`);
  const montaje = tab.match(/<FondoEditor\b[\s\S]*?\/>/);
  assert.ok(montaje, `${TAB} monta <FondoEditor … />`);
  assert.match(montaje[0], /\bniche=\{/, `el montaje pasa niche:\n${montaje[0]}`);
});

test("cada foto de fondo sube por `/api/upload/${clientId}` con `rol` = `branding` y el archivo renombrado a `nombreFondo(campo, nombre)` (`formularioFondo(archivo, campo)` devuelve el FormData; lanza si el tipo no es image/jpeg, png, webp o avif); el path que `subirMaterial` produce para cada uno de los tres campos (`clients/<id>/media/branding/<nombreFondo>`) es igual al path decodificado de la url de ese campo en el fixture A (tres de tres)", async () => {
  const m = await casilla("formularioFondo", "nombreFondo");
  const archivo = (tipo: string, nombre = "cualquiera.jpg") => new File([Buffer.from("00")], nombre, { type: tipo });
  const fd = m.formularioFondo(archivo("image/jpeg"), "localPhotoMobile");
  assert.ok(fd instanceof FormData, "devuelve un FormData");
  assert.equal(fd.get("rol"), ROL_FONDO, `campo rol = ${ROL_FONDO}`);
  const f = fd.get("file");
  assert.ok(f instanceof File, "campo file es un File");
  assert.equal(f.name, "local-v.jpg", "el archivo va renombrado a nombreFondo(localPhotoMobile, …)");
  assert.equal(f.type, "image/jpeg");
  const acepta = (tipo: string, nombre?: string) => { try { m.formularioFondo(archivo(tipo, nombre), "texture"); return true; } catch { return false; } };
  for (const [tipo, nombre] of [["image/jpeg", "x.jpg"], ["image/png", "x.png"], ["image/webp", "x.webp"], ["image/avif", "x.avif"]]) {
    assert.ok(acepta(tipo, nombre), `acepta ${tipo}`);
    assert.equal((m.formularioFondo(archivo(tipo, nombre), "texture").get("file") as File).name, m.nombreFondo("texture", nombre), `file.name = nombreFondo(texture, ${nombre})`);
  }
  for (const tipo of ["video/mp4", "video/webm", "text/plain", "application/pdf", ""]) assert.ok(!acepta(tipo), `rechaza ${tipo}`);
  // Sube por /api/upload/${clientId}.
  assert.ok(readFileSync(resolve(ROOT, COMPONENTE), "utf8").includes("/api/upload/${clientId}"), `${COMPONENTE} sube por /api/upload/\${clientId}`);
  // Path de subirMaterial (CONEXION-01 A1: clients/<id>/media/<rol>/<nombre saneado>) = el del fixture A, campo a campo.
  const b = branding(fixture("a"));
  for (const campo of CAMPOS_FOTO as readonly CampoFoto[]) {
    const nombre = m.nombreFondo(campo, "cualquiera.jpg");
    assert.equal(nombre, fondoEsperado(campo), `nombreFondo(${campo}) = ${fondoEsperado(campo)}`);
    assert.match(nombre, /^[A-Za-z0-9._-]+$/, `${nombre} ya está saneado`);
    assert.equal(`clients/${ID_A}/media/${ROL_FONDO}/${nombre}`, pathDeUrl(String(b[campo])), `path de ${campo} = el del fixture A`);
  }
});

test("`scripts/b4-tenant.ts show --id test-b4-peluqueria-a` (con Firestore, sólo lectura) devuelve un `config/{id}` cuyo `branding` es igual al que A1 construye desde el fixture A (con `mode: \"light\"`, D-65)", async () => {
  const m = await casilla("aplicarModo", "aplicarFondo");
  const esperado = branding(reconstruir(m));
  assert.equal(esperado.mode, "light", "precondición: lo que la casilla construye lleva mode = light (D-65)");
  assert.ok(existsSync(join(RAIZ_H, ".env.local")), `falta ${RAIZ_H}/.env.local: b4-tenant.ts show no puede leer Firestore (el test no se salta)`);
  const show = correrLargo(["--experimental-strip-types", TENANT, "show", "--id", ID_A], { cwd: RAIZ_H });
  assert.equal(show.status, 0, `b4-tenant.ts show --id ${ID_A} sale 0 (salió ${show.status})\n${show.out.slice(-3000)}`);
  const tenant = configDeShow(show.stdout);
  assert.deepEqual(tenant.branding, esperado, `el branding del tenant ${ID_A} = el que la casilla construye desde el fixture A`);
});
