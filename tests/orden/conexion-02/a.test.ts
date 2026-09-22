// CONEXION-02 · A (H) · la casilla del hero: src/components/config-editors/hero-video-editor.tsx (HeroVideoEditor + aplicarHeroVideo +
// nombreHero + formularioHero), su render en servidor con niche peluqueria/barberia (D-34, D-35), su montaje en client-config-tab.tsx y
// la subida por /api/upload/${clientId} con rol `hero` y los nombres fijos de D-36. Sesión A (2026-09-22): tests rojos (hoy el componente
// no existe: cada test cae por `existsSync` antes de importar, no por error de carga). El componente se importa con extensión a través del
// cargador de .tsx de _util.ts (node --experimental-strip-types no carga .tsx). Ningún test sube nada: A3 sólo construye el FormData y
// calcula paths. Sólo en H (A1–A3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAMPOS, COMPONENTE, ETIQUETAS, NOMBRES, POSTER, ROOT, VIDEO, clon, fixture, get, importarComponente, pathDeUrl } from "./_util.ts";

const TAB = "src/components/client-config-tab.tsx";
type Aplicar = (config: unknown, campo: string, url: string) => unknown;
type Nombre = (campo: string) => string;
type Formulario = (archivo: File, campo: string) => FormData;
const escapado = (url: string) => url.replace(/&/g, "&amp;");
const videoA = () => fixture("a").hero as Record<string, unknown>;

test("src/components/config-editors/hero-video-editor.tsx exporta `HeroVideoEditor` y dos funciones puras: `aplicarHeroVideo(config, campo, url)` escribe sólo la clave `hero.video.<campo>` (campos: `mp4`, `webm`, `poster`, `medium.mp4`, `medium.webm`, `portrait.mp4`, `portrait.webm`, `portrait.poster`; una url vacía borra la clave; ninguna otra clave de `config` cambia) y `nombreHero(campo)` devuelve el nombre fijo de D-36; aplicar las ocho urls del fixture A (T dev-fixtures/peluqueria-paleta-a.json `hero.video`) sobre un config vacío da exactamente ese `hero.video` (deepEqual)", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarComponente();
  assert.equal(typeof m.HeroVideoEditor, "function", "exporta HeroVideoEditor");
  assert.equal(typeof m.aplicarHeroVideo, "function", "exporta aplicarHeroVideo");
  assert.equal(typeof m.nombreHero, "function", "exporta nombreHero");
  const aplicar = m.aplicarHeroVideo as Aplicar, nombre = m.nombreHero as Nombre;
  for (const campo of CAMPOS) assert.equal(nombre(campo), NOMBRES[campo], `nombreHero(${campo}) = ${NOMBRES[campo]} (D-36)`);
  // Las ocho urls de A sobre {} → exactamente hero.video de A.
  const A = videoA().video as Record<string, unknown>;
  let config: unknown = {};
  for (const campo of CAMPOS) config = aplicar(config, campo, get(A, campo) as string);
  assert.deepEqual(get(config, "hero.video"), A, "aplicar las ocho urls del fixture A sobre {} da su hero.video");
  assert.deepEqual(Object.keys(config as object), ["hero"], "sobre {} sólo aparece `hero`");
  // Sólo la clave pedida: un config con otras claves (hero.eyebrow, sections.services) sale igual salvo hero.video.<campo>; no muta la entrada.
  const base = { hero: { eyebrow: "cejas", video: { mp4: "https://u/hero.mp4" } }, sections: { services: { variant: "v6" } } };
  const copia = clon(base);
  const r1 = aplicar(base, "portrait.mp4", "https://u/hero-v.mp4") as typeof base;
  assert.deepEqual(base, copia, "aplicarHeroVideo no muta el config de entrada");
  assert.deepEqual(r1, { hero: { eyebrow: "cejas", video: { mp4: "https://u/hero.mp4", portrait: { mp4: "https://u/hero-v.mp4" } } }, sections: { services: { variant: "v6" } } }, "escribe sólo hero.video.portrait.mp4; hero.eyebrow y sections.services intactos");
  // Url vacía borra la clave (y nada más).
  const r2 = aplicar(r1, "portrait.mp4", "");
  assert.equal(get(r2, "hero.video.portrait.mp4"), undefined, "url vacía borra hero.video.portrait.mp4");
  assert.ok(!Object.hasOwn((get(r2, "hero.video.portrait") as object) ?? {}, "mp4"), "la clave borrada no queda como undefined");
  assert.equal(get(r2, "hero.video.mp4"), "https://u/hero.mp4", "hero.video.mp4 sigue");
  assert.equal(get(r2, "hero.eyebrow"), "cejas");
  assert.deepEqual(get(r2, "sections"), { services: { variant: "v6" } });
  const r3 = aplicar(r2, "mp4", "");
  assert.ok(!Object.hasOwn(get(r3, "hero.video") as object, "mp4"), "url vacía borra hero.video.mp4");
  assert.equal(get(r3, "hero.eyebrow"), "cejas");
});

test("`renderToString(<HeroVideoEditor clientId=\"x\" niche=\"peluqueria\" value={hero.video de A} onChange={…} />)` contiene ocho campos, cada uno con su etiqueta (Horizontal mp4/webm, Medio 1280 mp4/webm, Retrato mp4/webm/póster, Póster) y su url actual; con `niche=\"barberia\"` devuelve cadena vacía (D-35); y src/components/client-config-tab.tsx monta `HeroVideoEditor` pasando `niche` y escribe el resultado en el mismo `config` que guarda por `/api/config/${clientId}`", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarComponente();
  const { renderToString } = await import("react-dom/server");
  const { createElement } = await import("react");
  type Props = { clientId: string; niche: string; value: unknown; onChange: (...args: unknown[]) => void };
  const Editor = m.HeroVideoEditor as (props: Props) => ReturnType<typeof createElement>;
  const A = videoA().video as Record<string, unknown>;
  const html = renderToString(createElement(Editor, { clientId: "x", niche: "peluqueria", value: A, onChange: () => {} }));
  assert.ok(html.length > 0, "con niche peluqueria renderiza algo");
  for (const campo of CAMPOS) {
    const url = get(A, campo) as string;
    assert.ok(html.includes(url) || html.includes(escapado(url)), `el render muestra la url actual de ${campo}`);
  }
  for (const etiqueta of ETIQUETAS) assert.ok(html.includes(etiqueta), `el render lleva la etiqueta «${etiqueta}»`);
  assert.ok((html.match(/<input\b/g) ?? []).length >= CAMPOS.length, `ocho campos: al menos ${CAMPOS.length} <input> (hay ${(html.match(/<input\b/g) ?? []).length})`);
  assert.equal(renderToString(createElement(Editor, { clientId: "x", niche: "barberia", value: A, onChange: () => {} })), "", "con niche barberia devuelve cadena vacía (D-35)");
  // client-config-tab.tsx: importa y monta HeroVideoEditor con niche, y su onChange escribe en el config que guarda por /api/config/${clientId}.
  const tab = readFileSync(resolve(ROOT, TAB), "utf8");
  assert.ok(tab.includes("/api/config/${clientId}"), `precondición: ${TAB} guarda por /api/config/\${clientId}`);
  assert.match(tab, /import \{[^}]*\bHeroVideoEditor\b[^}]*\} from "\.\/config-editors\/hero-video-editor"/, `${TAB} importa HeroVideoEditor de ./config-editors/hero-video-editor`);
  const montaje = tab.match(/<HeroVideoEditor\b[\s\S]*?\/>/);
  assert.ok(montaje, `${TAB} monta <HeroVideoEditor … />`);
  assert.ok(/\bniche=\{niche\}/.test(montaje[0]), `el montaje pasa niche={niche}:\n${montaje[0]}`);
  assert.ok(/\bclientId=\{clientId\}/.test(montaje[0]), `el montaje pasa clientId={clientId}:\n${montaje[0]}`);
  assert.ok(/\bonChange=\{/.test(montaje[0]) && /\b(setConfig|updateNested|aplicarHeroVideo)\b/.test(montaje[0]), `el onChange del montaje escribe en el config del tab (setConfig / updateNested / aplicarHeroVideo):\n${montaje[0]}`);
});

test("la casilla sube por `/api/upload/${clientId}` con el campo `rol` = `hero` y el archivo renombrado a `nombreHero(campo)` (la función pura `formularioHero(archivo, campo)` devuelve un FormData con `rol` y `file` con ese nombre); acepta `video/mp4` y `video/webm` para los campos de vídeo e `image/avif` (y jpeg/png/webp) para los pósters; el path que `subirMaterial` produce para cada campo (`clients/<id>/media/hero/<nombreHero>`) es igual al path decodificado de la url de ese campo en el fixture A (ocho de ocho)", async () => {
  assert.ok(existsSync(resolve(ROOT, COMPONENTE)), `no existe ${COMPONENTE}`);
  const m = await importarComponente();
  assert.equal(typeof m.formularioHero, "function", "exporta formularioHero");
  const formulario = m.formularioHero as Formulario, nombre = m.nombreHero as Nombre;
  const fd = formulario(new File([Buffer.from("00")], "cualquiera.mp4", { type: "video/mp4" }), "portrait.mp4");
  assert.ok(fd instanceof FormData, "devuelve un FormData");
  assert.equal(fd.get("rol"), "hero", "campo rol = hero");
  const f = fd.get("file");
  assert.ok(f instanceof File, "campo file es un File");
  assert.equal(f.name, "hero-v.mp4", "el archivo va renombrado a nombreHero(portrait.mp4)");
  assert.equal(f.type, "video/mp4");
  for (const campo of CAMPOS) {
    const tipo = VIDEO.includes(campo) ? "video/webm" : "image/avif";
    assert.equal((formulario(new File([Buffer.from("00")], "x", { type: tipo }), campo).get("file") as File).name, nombre(campo), `file.name = nombreHero(${campo})`);
  }
  // Tipos aceptados por campo: los de vídeo admiten mp4 y webm y rechazan imágenes; los pósters admiten avif/jpeg/png/webp y rechazan vídeo.
  const acepta = (campo: string, tipo: string) => { try { formulario(new File([Buffer.from("00")], "x", { type: tipo }), campo); return true; } catch { return false; } };
  for (const campo of VIDEO) {
    for (const tipo of ["video/mp4", "video/webm"]) assert.ok(acepta(campo, tipo), `${campo} acepta ${tipo}`);
    for (const tipo of ["image/avif", "image/jpeg", "image/png", "image/webp", "text/plain"]) assert.ok(!acepta(campo, tipo), `${campo} rechaza ${tipo}`);
  }
  for (const campo of POSTER) {
    for (const tipo of ["image/avif", "image/jpeg", "image/png", "image/webp"]) assert.ok(acepta(campo, tipo), `${campo} acepta ${tipo}`);
    for (const tipo of ["video/mp4", "video/webm", "text/plain"]) assert.ok(!acepta(campo, tipo), `${campo} rechaza ${tipo}`);
  }
  // Sube por /api/upload/${clientId}.
  const src = readFileSync(resolve(ROOT, COMPONENTE), "utf8");
  assert.ok(src.includes("/api/upload/${clientId}"), `${COMPONENTE} sube por /api/upload/\${clientId}`);
  // Path de subirMaterial (CONEXION-01 A1: clients/<id>/media/<rol>/<nombre saneado>) para cada campo = path decodificado de la url de A.
  const A = videoA().video as Record<string, unknown>;
  for (const campo of CAMPOS) {
    assert.match(nombre(campo), /^[A-Za-z0-9._-]+$/, `nombreHero(${campo}) ya está saneado`);
    assert.equal(`clients/test-b4-peluqueria-a/media/hero/${nombre(campo)}`, pathDeUrl(get(A, campo) as string), `path de ${campo} = el del fixture A`);
  }
});
