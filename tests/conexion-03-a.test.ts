// CONEXION-03 · A (H) · las casillas de servicios en el constructor: src/components/config-editors/services-editor.tsx gana las cuatro
// funciones puras (aplicarServicio, aplicarFotoServicio, aplicarDestacado, aplicarSurface) + nombreFotoServicio y formularioFotoServicio,
// su render en servidor con niche peluqueria/barberia (D-34, D-46) y la prueba «lo que la casilla escribe = lo que tiene el tenant»
// (A4, la deuda de CONEXION-02 C1, ahora en H · inciso n). Sesión A (2026-09-22): tests rojos — el editor EXISTE, así que el rojo cae en
// «exporta aplicarServicio», no en `existsSync` ni en un error de carga. El editor se importa con extensión por el cargador de .tsx de
// _util.ts (con resolución de `@/` y de imports sin extensión, § Interfaz). Ningún test sube nada ni escribe en Firestore: A3 sólo
// construye el FormData y calcula paths; A4 usa `b4-tenant.ts show`, que sólo lee. Sólo en H (A1–A4).
// CONEXION-04 D1 (2026-09-22): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el
// original de la carpeta congelada no se toca).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  CAMPOS_HERO, COMPONENTE, HERO, ID_A, RAIZ_H, ROOT, SURFACES, TAB, TENANT,
  clon, correrLargo, escapado, fixture, fotoEsperada, get, importarModulo, pathDeUrl, seccion, servicios,
} from "./orden/conexion-03/_util.ts";

type Cfg = Record<string, unknown>;
type Casilla = {
  aplicarServicio: (config: unknown, i: number, campo: string, valor: unknown) => Cfg;
  aplicarFotoServicio: (config: unknown, i: number, url: string) => Cfg;
  aplicarDestacado: (config: unknown, id: string, activo: boolean) => Cfg;
  aplicarSurface: (config: unknown, valor: string) => Cfg;
  nombreFotoServicio: (i: number, nombreArchivo: string) => string;
  formularioFotoServicio: (archivo: File, i: number) => FormData;
};

/** Importa el editor y afirma, una función por aserción, que exporta la interfaz de A1/A3 (el rojo de hoy cae aquí). */
async function casilla(...necesarias: (keyof Casilla)[]): Promise<Casilla> {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  for (const nombre of necesarias) assert.equal(typeof m[nombre], "function", `${COMPONENTE} exporta ${nombre}`);
  return m as unknown as Casilla;
}

/** El fixture A sin las cinco claves que la casilla escribe: el punto de partida de A1. */
function basePelada(): Cfg {
  const A = fixture("a");
  const svc = servicios(A).map((s) => { const c: Cfg = { ...s }; delete c.priceMax; delete c.mode; return c; });
  const sec: Cfg = { ...seccion(A) };
  delete sec.images; delete sec.featured; delete sec.surface;
  return { ...clon(A), services: svc, sections: { ...(clon(A).sections as Cfg), services: sec } };
}

/** Aplica sobre `basePelada()` los valores de A con las cuatro funciones puras (A1). */
function reconstruir(m: Casilla): Cfg {
  const A = fixture("a");
  let cfg: Cfg = basePelada();
  servicios(A).forEach((s, i) => {
    if (s.priceMax !== undefined) cfg = m.aplicarServicio(cfg, i, "priceMax", s.priceMax);
    if (s.mode !== undefined) cfg = m.aplicarServicio(cfg, i, "mode", s.mode);
  });
  const sec = seccion(A);
  ((sec.images as string[] | undefined) ?? []).forEach((url, i) => { cfg = m.aplicarFotoServicio(cfg, i, url); });
  for (const id of (sec.featured as string[] | undefined) ?? []) cfg = m.aplicarDestacado(cfg, id, true);
  if (sec.surface !== undefined) cfg = m.aplicarSurface(cfg, String(sec.surface));
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

test("src/components/config-editors/services-editor.tsx exporta cuatro funciones puras que devuelven un config nuevo sin tocar otras claves: `aplicarServicio(config, i, campo, valor)` con campo `priceMax` (número o undefined, que borra) o `mode` («reserva» | «consulta») sobre `services[i]`; `aplicarFotoServicio(config, i, url)` sobre `sections.services.images[i]` (la lista se rellena con \"\" hasta i; url vacía deja \"\"); `aplicarDestacado(config, id, activo)` sobre `sections.services.featured` (ids en el orden del catálogo; lista vacía borra la clave); `aplicarSurface(config, valor)` sobre `sections.services.surface`; y `nombreFotoServicio(i, nombreArchivo)` = `servicio-<i+1>.<ext>` (D-43). Aplicadas sobre el fixture A sin `priceMax`, `mode`, `images`, `featured` ni `surface`, con los valores de A (T dev-fixtures/peluqueria-paleta-a.json), devuelven `services` y `sections.services` iguales a los de A (deepEqual)", async () => {
  const m = await casilla("aplicarServicio", "aplicarFotoServicio", "aplicarDestacado", "aplicarSurface", "nombreFotoServicio");
  // nombreFotoServicio: el nombre fijo de D-43, con la extensión normalizada al juego declarado (jpg, webp, avif, png).
  for (const [entrada, salida] of [["foto.jpg", "jpg"], ["FOTO.JPG", "jpg"], ["foto.jpeg", "jpg"], ["x.webp", "webp"], ["x.avif", "avif"], ["x.PNG", "png"]]) {
    assert.equal(m.nombreFotoServicio(0, entrada), `servicio-1.${salida}`, `nombreFotoServicio(0, ${entrada}) = servicio-1.${salida} (D-43)`);
  }
  assert.equal(m.nombreFotoServicio(11, "cualquiera.jpg"), "servicio-12.jpg", "el índice es 0-based y el nombre 1-based");
  // Las cuatro funciones sobre el fixture A pelado → exactamente `services` y `sections.services` de A.
  const A = fixture("a");
  const hecho = reconstruir(m);
  assert.deepEqual(hecho.services, servicios(A), "aplicar los priceMax y modes de A devuelve su `services`");
  assert.deepEqual(get(hecho, "sections.services"), seccion(A), "aplicar fotos, destacados y surface de A devuelve su `sections.services`");
  // Puras: no mutan la entrada y no tocan otras claves.
  const base: Cfg = { services: [{ id: "a", name: "A", price: 10 }, { id: "b", name: "B", price: 20 }], sections: { services: { variant: "v6", title: "t" }, gallery: { variant: "v3" } }, hero: { variant: "v6" } };
  const copia = clon(base);
  const r1 = m.aplicarServicio(base, 0, "priceMax", 99);
  assert.deepEqual(base, copia, "aplicarServicio no muta el config de entrada");
  assert.deepEqual(r1.services, [{ id: "a", name: "A", price: 10, priceMax: 99 }, { id: "b", name: "B", price: 20 }], "escribe sólo services[0].priceMax");
  assert.deepEqual(r1.sections, copia.sections, "sections no cambia");
  assert.deepEqual(r1.hero, copia.hero, "hero no cambia");
  // priceMax = undefined borra la clave (no la deja como undefined).
  const r2 = m.aplicarServicio(r1, 0, "priceMax", undefined);
  assert.ok(!Object.hasOwn((r2.services as Cfg[])[0], "priceMax"), "valor undefined borra services[0].priceMax");
  assert.equal(((r2.services as Cfg[])[0]).price, 10, "services[0].price sigue");
  // mode: reserva | consulta.
  const r3 = m.aplicarServicio(r2, 1, "mode", "consulta");
  assert.equal(((r3.services as Cfg[])[1]).mode, "consulta", "escribe services[1].mode");
  assert.equal(((r3.services as Cfg[])[0]).mode, undefined, "services[0].mode no aparece");
  // aplicarFotoServicio: rellena con "" hasta i y la url vacía deja "".
  const f1 = m.aplicarFotoServicio(base, 2, "https://u/servicio-3.jpg");
  assert.deepEqual(base, copia, "aplicarFotoServicio no muta el config de entrada");
  assert.deepEqual(get(f1, "sections.services.images"), ["", "", "https://u/servicio-3.jpg"], "la lista se rellena con \"\" hasta i");
  assert.equal(get(f1, "sections.services.title"), "t", "sections.services.title sigue");
  assert.deepEqual(get(f1, "sections.gallery"), { variant: "v3" }, "sections.gallery no cambia");
  const f2 = m.aplicarFotoServicio(f1, 2, "");
  assert.deepEqual(get(f2, "sections.services.images"), ["", "", ""], "url vacía deja \"\" (no borra el hueco)");
  // aplicarDestacado: ids en el orden del catálogo; la lista vacía borra la clave.
  const d1 = m.aplicarDestacado(base, "b", true);
  assert.deepEqual(base, copia, "aplicarDestacado no muta el config de entrada");
  const d2 = m.aplicarDestacado(d1, "a", true);
  assert.deepEqual(get(d2, "sections.services.featured"), ["a", "b"], "featured queda en el orden del catálogo, no en el de marcado");
  const d3 = m.aplicarDestacado(m.aplicarDestacado(d2, "a", false), "b", false);
  assert.ok(!Object.hasOwn(get(d3, "sections.services") as object, "featured"), "sin destacados, la clave featured se borra");
  // aplicarSurface: escribe sólo sections.services.surface.
  const s1 = m.aplicarSurface(base, "velo");
  assert.deepEqual(base, copia, "aplicarSurface no muta el config de entrada");
  assert.equal(get(s1, "sections.services.surface"), "velo");
  assert.deepEqual(get(s1, "sections.gallery"), { variant: "v3" }, "sections.gallery no cambia");
});

test("`renderToString` del editor de servicios en modo custom con `niche=\"peluqueria\"` muestra los campos `priceMax`, `mode` (select con `reserva` y `consulta`), foto y destacado del servicio abierto —con un solo servicio, el primero de A: su `priceMax`, su `mode` y la url de `sections.services.images[0]`— y, a nivel de sección, el select `surface` con las cinco opciones de D-42; con `niche=\"barberia\"` ninguno de esos cinco campos aparece (D-46) y los campos de hoy (name, price, duration, description) siguen; src/components/client-config-tab.tsx pasa `niche` al editor", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarModulo(COMPONENTE);
  assert.equal(typeof m.ServicesEditor, "function", `${COMPONENTE} exporta ServicesEditor`);
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  type Props = { niche: string; config: Cfg; setConfig: (...args: unknown[]) => void; clientId: string };
  const Editor = m.ServicesEditor as (props: Props) => ReturnType<typeof createElement>;
  const A = fixture("a");
  const sec = seccion(A);
  const render = (niche: string, lista: Cfg[]) => renderToString(createElement(Editor, { niche, config: { services: lista, sections: { services: sec } }, setConfig: () => {}, clientId: "x" }));

  const html = render("peluqueria", servicios(A));
  for (const clave of ["priceMax", "mode", "surface"]) assert.ok(html.includes(clave), `el render con peluquería nombra «${clave}»`);
  assert.match(html.toLowerCase(), /destacad/, "el render con peluquería nombra el destacado");
  for (const valor of ["reserva", "consulta"]) assert.match(html, new RegExp(`<option[^>]*value="${valor}"`), `el select de mode tiene la opción «${valor}»`);
  for (const valor of SURFACES) assert.match(html, new RegExp(`<option[^>]*value="${valor}"`), `el select de surface tiene la opción «${valor}» (D-42)`);

  // Con un solo servicio (el primero de A, que el acordeón abre): su priceMax, su mode y la url de images[0].
  const primero = servicios(A)[0];
  const uno = render("peluqueria", [primero]);
  assert.match(uno, new RegExp(`value="${String(primero.priceMax)}"`), `el campo priceMax muestra el valor de A (${String(primero.priceMax)})`);
  assert.match(uno, new RegExp(`<option[^>]*value="${String(primero.mode)}"[^>]*selected`), `el select de mode marca el valor de A («${String(primero.mode)}»)`);
  const url0 = (sec.images as string[])[0];
  assert.ok(uno.includes(url0) || uno.includes(escapado(url0)), "el campo de la foto muestra la url de sections.services.images[0]");

  // Con barbería, ninguno de los cinco; los campos de hoy siguen (D-46).
  const flota = render("barberia", servicios(A));
  for (const clave of ["priceMax", "surface"]) assert.ok(!flota.includes(clave), `el render con barbería no nombra «${clave}» (D-46)`);
  assert.doesNotMatch(flota.toLowerCase(), /destacad/, "el render con barbería no nombra el destacado (D-46)");
  assert.ok(!flota.includes(url0) && !flota.includes(escapado(url0)), "el render con barbería no muestra la foto por servicio (D-46)");
  for (const etiqueta of ["Nombre", "Precio", "Duracion", "Descripcion"]) assert.ok(flota.includes(etiqueta), `el render con barbería conserva «${etiqueta}»`);

  // client-config-tab.tsx monta <ServicesEditor … niche={…} /> y guarda por /api/config/${clientId}.
  const tab = readFileSync(resolve(ROOT, TAB), "utf8");
  assert.ok(tab.includes("/api/config/${clientId}"), `precondición: ${TAB} guarda por /api/config/\${clientId}`);
  const montaje = tab.match(/<ServicesEditor\b[\s\S]*?\/>/);
  assert.ok(montaje, `${TAB} monta <ServicesEditor … />`);
  assert.match(montaje[0], /\bniche=\{/, `el montaje pasa niche:\n${montaje[0]}`);
});

test("la foto de un servicio sube por `/api/upload/${clientId}` con `rol` = `services` y el archivo renombrado a `nombreFotoServicio(i, nombre)` (`formularioFotoServicio(archivo, i)` devuelve el FormData; lanza si el tipo no es image/jpeg, png, webp o avif); el path que `subirMaterial` produce para cada una de las once fotos de A (`clients/<id>/media/services/servicio-<n>.jpg`) es igual al path decodificado de `sections.services.images[i]` en el fixture A (once de once: `images[10]` está vacía)", async () => {
  const m = await casilla("formularioFotoServicio", "nombreFotoServicio");
  const archivo = (tipo: string, nombre = "cualquiera.jpg") => new File([Buffer.from("00")], nombre, { type: tipo });
  const fd = m.formularioFotoServicio(archivo("image/jpeg"), 0);
  assert.ok(fd instanceof FormData, "devuelve un FormData");
  assert.equal(fd.get("rol"), "services", "campo rol = services");
  const f = fd.get("file");
  assert.ok(f instanceof File, "campo file es un File");
  assert.equal(f.name, "servicio-1.jpg", "el archivo va renombrado a nombreFotoServicio(0, …)");
  assert.equal(f.type, "image/jpeg");
  const acepta = (tipo: string, nombre?: string) => { try { m.formularioFotoServicio(archivo(tipo, nombre), 3); return true; } catch { return false; } };
  for (const [tipo, nombre] of [["image/jpeg", "x.jpg"], ["image/png", "x.png"], ["image/webp", "x.webp"], ["image/avif", "x.avif"]]) {
    assert.ok(acepta(tipo, nombre), `acepta ${tipo}`);
    assert.equal((m.formularioFotoServicio(archivo(tipo, nombre), 3).get("file") as File).name, m.nombreFotoServicio(3, nombre), `file.name = nombreFotoServicio(3, ${nombre})`);
  }
  for (const tipo of ["video/mp4", "video/webm", "text/plain", "application/pdf", ""]) assert.ok(!acepta(tipo), `rechaza ${tipo}`);
  // Sube por /api/upload/${clientId}.
  assert.ok(readFileSync(resolve(ROOT, COMPONENTE), "utf8").includes("/api/upload/${clientId}"), `${COMPONENTE} sube por /api/upload/\${clientId}`);
  // Path de subirMaterial (CONEXION-01 A1: clients/<id>/media/<rol>/<nombre saneado>) = el del fixture A, foto a foto.
  const imagenes = seccion(fixture("a")).images as string[];
  assert.equal(imagenes.length, 12, "precondición: el fixture A declara doce huecos de foto");
  let comparadas = 0;
  imagenes.forEach((url, i) => {
    if (!url) return;
    const nombre = m.nombreFotoServicio(i, "cualquiera.jpg");
    assert.equal(nombre, fotoEsperada(i), `nombreFotoServicio(${i}) = ${fotoEsperada(i)}`);
    assert.match(nombre, /^[A-Za-z0-9._-]+$/, `${nombre} ya está saneado`);
    assert.equal(`clients/${ID_A}/media/services/${nombre}`, pathDeUrl(url), `path de la foto ${i} = el del fixture A`);
    comparadas++;
  });
  assert.equal(comparadas, 11, `once fotos comparadas (images[10] está vacía); hubo ${comparadas}`);
});

test("`scripts/b4-tenant.ts show --id test-b4-peluqueria-a` (con Firestore, sólo lectura) devuelve un `config/{id}` cuyo `hero.video` es igual al que `aplicarHeroVideo` construye desde el fixture A (deuda de CONEXION-02 C1, ahora en H), y cuyos `services` y `sections.services.{surface,images,featured}` son iguales a los que A1 construye desde el fixture A", async () => {
  const m = await casilla("aplicarServicio", "aplicarFotoServicio", "aplicarDestacado", "aplicarSurface");
  const esperado = reconstruir(m);
  // hero.video, reconstruido con la casilla de CONEXION-02 (misma raíz, mismo proceso).
  assert.ok(existsSync(resolve(ROOT, HERO)), `no existe ${HERO}`);
  const h = await importarModulo(HERO);
  assert.equal(typeof h.aplicarHeroVideo, "function", `${HERO} exporta aplicarHeroVideo`);
  const aplicarHeroVideo = h.aplicarHeroVideo as (config: unknown, campo: string, url: string) => Cfg;
  const video = get(fixture("a"), "hero.video") as Cfg;
  let heroCfg: Cfg = {};
  for (const campo of CAMPOS_HERO) heroCfg = aplicarHeroVideo(heroCfg, campo, get(video, campo) as string);
  assert.deepEqual(get(heroCfg, "hero.video"), video, "precondición (CONEXION-02 A1): lo construido es hero.video del fixture A");
  // show (sólo lectura; con Firestore).
  assert.ok(existsSync(join(RAIZ_H, ".env.local")), `falta ${RAIZ_H}/.env.local: b4-tenant.ts show no puede leer Firestore (el test no se salta)`);
  const show = correrLargo(["--experimental-strip-types", TENANT, "show", "--id", ID_A], { cwd: RAIZ_H });
  assert.equal(show.status, 0, `b4-tenant.ts show --id ${ID_A} sale 0 (salió ${show.status})\n${show.out.slice(-3000)}`);
  const tenant = configDeShow(show.stdout);
  assert.deepEqual(get(tenant, "hero.video"), get(heroCfg, "hero.video"), `hero.video del tenant ${ID_A} = lo que la casilla del hero construye desde el fixture`);
  assert.deepEqual(tenant.services, esperado.services, `services del tenant ${ID_A} = lo que la casilla de servicios construye desde el fixture`);
  for (const clave of ["surface", "images", "featured"]) {
    assert.deepEqual(get(tenant, `sections.services.${clave}`), get(esperado, `sections.services.${clave}`), `sections.services.${clave} del tenant ${ID_A} = lo que la casilla construye`);
  }
});
