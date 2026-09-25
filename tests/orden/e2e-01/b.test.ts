// E2E-01 · B (H) · el `config/{id}` que la ficha del hub dejó dice lo mismo que el fixture de su paleta en lo que se juzga (B1), y lo
// que no puede decir está vacío o declarado (B2). Sesión A (2026-09-24): tests rojos — no existe `tests/e2e-01-webs.json`.
// D-97 fija QUÉ se juzga; aquí se compara el DATO, no los píxeles (eso es C2 en T, inciso n: la página es de T).
//
// **Corrección de A (2) (2026-09-25).** La primera versión comparaba con `JSON.stringify(porContenido(...))` y el material por
// «rol/nombre#token». Medido sobre la web A que la sesión B ya cargó (`demo-test-e2e-peluqueria-a-efd04f31`), eso daba tres falsos
// negativos que ninguna sesión B podía cerrar:
//   1. `JSON.stringify` depende del ORDEN de las claves. `branding.colors` de la web trae las MISMAS 23 claves con los MISMOS
//      valores que el fixture, en otro orden (Firestore no conserva el orden), y B1 lo daba por distinto. Afectaba a cualquier
//      objeto leído de Firestore. → se compara por VALOR, con las claves ordenadas (`canonico`).
//   2. `branding.paletteMeta` no puede coincidir nunca: `derivedAt` es el instante de la derivación (H:src/lib/palette.ts:143, :203,
//      `new Date().toISOString()`) — medido: web `2026-09-25T08:52:59.697Z` contra fixture `2026-09-19T00:44:36.800Z` — y la casilla
//      escribe `paletteMeta.mode`, que el fixture A no tiene. → se comparan `source`, `origin`, `reason` y `niche`, que son los
//      valores de DISEÑO; `derivedAt` es un timestamp y `mode` ya se compara en `branding.mode`, y los colores, completos, en
//      `branding.colors`.
//   3. La casilla de logo (`/api/upload-logo/[clientId]`, route.ts:62–68) guarda los MISMOS BYTES en otra ruta y con token UUID
//      (medido: la web pone `clients/<id>/logo-light-bg.png?…token=6fe0541c-…`, el fixture `clients/<id>/media/branding/logo.png?…
//      token=<sha256[0..32)>`), así que `brand.logo` y `brand.logoDark` nunca coincidían aunque fueran la misma imagen. Arreglar esa
//      casilla es **LOGO-01**, una orden propia (decisión de Liam). Aquí la igualdad del material se juzga por **CONTENIDO**: el
//      sha256 de los bytes que sirve cada url (GET, sólo lectura). Cuando la ruta o el token difieren con los mismos bytes, el test
//      lo imprime con `t.diagnostic` nombrando la clave, para que la diferencia de convención quede VISIBLE y no escondida.
// Y `JUZGADAS` gana las cuatro claves de zonas juzgadas que faltaban, cada una con su casilla comprobada: `sections.services.variant`
// (H:src/components/config-editors/layout-variants-editor.tsx:83), `sections.services.title` y `.subtitle`
// (H:src/components/client-content-tab.tsx:60–61) y `contact.phone` (fila `contact.phone` de verdad/contratos.json, ui
// `client-config-tab.tsx` campo `phone`), que arma el enlace de WhatsApp del hero, de la navbar y de los servicios.
//
// Todo en LECTURA: el Admin SDK de H sólo lee `config/{id}` y los GET sólo descargan. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { CONTRATOS, PALETAS, RAIZ_H, RAIZ_T, ROOT, WEBS, fixture, get, leerDoc, registro, web } from "./_comun.ts";

type Cfg = Record<string, unknown>;
/** Las claves juzgadas (D-97), por zona. `services` y `gallery` llevan el catálogo y las piezas enteras. */
const JUZGADAS = [
  "business.type",
  "navbar.variant", "brand.logo", "brand.logoDark",
  "hero.video", "hero.eyebrow", "hero.titlePrefix", "hero.titleHighlight", "hero.titleSuffix", "hero.subtitle", "hero.ctaPrimary",
  "contact.phone",
  "services", "sections.services.variant", "sections.services.title", "sections.services.subtitle",
  "sections.services.images", "sections.services.featured", "sections.services.surface",
  "gallery", "sections.gallery.items", "sections.gallery.selection", "sections.gallery.surface", "sections.gallery.variant",
  "branding.mode", "branding.colors", "branding.paletteMeta", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile",
];
/** Claves que se comparan sólo por algunas subclaves, con el motivo (corrección de A (2), punto 2). */
const SUBCLAVES: Record<string, string[]> = {
  // `derivedAt` es el instante de la derivación, no un valor de diseño; `mode` ya se compara en `branding.mode` y los colores
  // completos en `branding.colors`.
  "branding.paletteMeta": ["source", "origin", "reason", "niche"],
};
/** Cualquier archivo servido por Storage: la ruta y el token cambian según la casilla que lo subió (LOGO-01), los bytes no. */
const ES_STORAGE = (v: unknown): v is string => typeof v === "string" && v.startsWith("https://firebasestorage.googleapis.com/");
/** Las claves de material cuyo valor tiene que ser una url servida (ninguna ruta local se coló por la ficha). */
const MATERIAL = ["brand.logo", "brand.logoDark", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile"];

/** Mismo valor con las claves de cada objeto ORDENADAS: comparar por valor y no por el orden en que Firestore devuelve el documento. */
function canonico(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) o[k] = canonico((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}
/** Todas las urls de Storage que cuelgan de un valor. */
function urlsDe(v: unknown, acc: string[] = []): string[] {
  if (ES_STORAGE(v)) acc.push(v);
  else if (Array.isArray(v)) for (const x of v) urlsDe(x, acc);
  else if (v && typeof v === "object") for (const x of Object.values(v as Record<string, unknown>)) urlsDe(x, acc);
  return acc;
}
/** sha256 de los bytes que SIRVE una url (GET, sólo lectura), con caché por url: el mismo archivo no se baja dos veces. */
const cacheSha = new Map<string, string>();
async function shaDeUrl(url: string): Promise<string> {
  const guardado = cacheSha.get(url);
  if (guardado) return guardado;
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), 120000);
  try {
    const r = await fetch(url, { signal: corte.signal });
    if (!r.ok) throw new Error(`GET ${url.slice(0, 110)}… respondió ${r.status}`);
    const sha = createHash("sha256").update(Buffer.from(await r.arrayBuffer())).digest("hex");
    cacheSha.set(url, sha);
    return sha;
  } finally { clearTimeout(reloj); }
}
/** El mismo valor con cada url de Storage sustituida por `sha256:<hash>` de sus bytes: así la ruta y el token no entran en la
 *  comparación, y dos archivos iguales servidos desde rutas distintas quedan iguales (corrección de A (2), punto 3). */
async function porContenido(v: unknown, shas: Map<string, string>): Promise<unknown> {
  if (ES_STORAGE(v)) return `sha256:${shas.get(v) ?? "(sin bajar)"}`;
  if (Array.isArray(v)) return Promise.all(v.map((x) => porContenido(x, shas)));
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = await porContenido(x, shas);
    return o;
  }
  return v;
}
/** El valor que se juzga de una clave: entero, o sólo las subclaves de `SUBCLAVES` cuando las tiene. */
function valorJuzgado(fuente: unknown, clave: string): unknown {
  const v = get(fuente, clave);
  const solo = SUBCLAVES[clave];
  if (!solo || v == null || typeof v !== "object") return v;
  const o: Record<string, unknown> = {};
  for (const k of solo) o[k] = (v as Record<string, unknown>)[k];
  return o;
}

type Comparacion = { distintas: string[]; misma: { clave: string; web: string; fixture: string }[] };
/** Compara las claves juzgadas de un config contra su fixture: por VALOR (claves ordenadas) y, el material, por CONTENIDO.
 *  Devuelve las que difieren y las que son el mismo archivo servido desde otra ruta o con otro token (diagnóstico). */
async function comparar(cfg: Cfg, fx: Record<string, unknown>, claves: string[]): Promise<Comparacion> {
  const urls = new Set<string>();
  for (const clave of claves) { for (const u of urlsDe(valorJuzgado(cfg, clave))) urls.add(u); for (const u of urlsDe(valorJuzgado(fx, clave))) urls.add(u); }
  const shas = new Map<string, string>();
  for (const u of urls) shas.set(u, await shaDeUrl(u));

  const distintas: string[] = [];
  const misma: { clave: string; web: string; fixture: string }[] = [];
  for (const clave of claves) {
    const crudoWeb = valorJuzgado(cfg, clave), crudoFx = valorJuzgado(fx, clave);
    const porValor = JSON.stringify(canonico(crudoWeb)) === JSON.stringify(canonico(crudoFx));
    const web = JSON.stringify(canonico(await porContenido(crudoWeb, shas)));
    const fix = JSON.stringify(canonico(await porContenido(crudoFx, shas)));
    if (web !== fix) { distintas.push(clave); continue; }
    // Mismos bytes pero distinta url: la diferencia de convención se imprime, no se esconde (LOGO-01).
    if (!porValor && urlsDe(crudoWeb).length) misma.push({ clave, web: String(urlsDe(crudoWeb)[0]), fixture: String(urlsDe(crudoFx)[0] ?? "") });
  }
  return { distintas, misma };
}

test("el documento `config/{clientId}` de cada web tiene, en las claves juzgadas (D-97), el mismo valor efectivo que el fixture de su paleta; el material se compara por **nombre de archivo y token** (el token de la url de Storage es el sha256 del contenido, D-20), nunca por url, porque el `clientId` cambia", async (t) => {
  // (1) El registro del árbol. Hoy no existe: aquí es donde esta orden está en rojo.
  const reg = registro();
  for (const p of PALETAS) {
    const w = web(reg, p);
    const cfg = await leerDoc("config", w.clientId);
    assert.ok(cfg, `config/${w.clientId} existe (la ficha del hub lo escribió)`);
    const fx = fixture(p);

    // (2) Clave por clave, el valor efectivo: por VALOR con las claves ordenadas, y el material por el sha256 de sus bytes.
    const { distintas, misma } = await comparar(cfg as Cfg, fx, JUZGADAS);
    for (const m of misma) t.diagnostic(`${p} · ${m.clave}: mismos bytes, otra url (LOGO-01)\n    web:     ${m.web}\n    fixture: ${m.fixture}`);
    assert.deepEqual(distintas, [], `${p} · config/${w.clientId}: las claves juzgadas dicen lo mismo que el fixture (difieren: ${distintas.join(", ")})`);

    // (3) Y el material que sí está es material servido: ninguna ruta local se coló por la ficha.
    for (const clave of MATERIAL) {
      const v = get(cfg as Cfg, clave);
      if (v === undefined || v === null || v === "") continue;
      assert.match(String(v), /^https:\/\//, `${p} · ${clave}: url https de Storage (hay «${String(v).slice(0, 80)}»)`);
    }
  }
  assert.equal(resolve(ROOT), resolve(RAIZ_H), "precondición: este test corre en H");
});

test("el conjunto de claves juzgadas cuyo valor efectivo NO coincide y que ninguna casilla de la ficha puede poner está **vacío**, o cada una está declarada en `tests/e2e-01-webs.json` bajo `huecosDeFicha` con su clave y su motivo; y ninguna de las declaradas tiene `ui` distinto de `null` en `verdad/contratos.json` (si la tiene, la casilla existe y el hueco no es de la ficha)", async () => {
  // (1) El registro del árbol. Hoy no existe: aquí es donde esta orden está en rojo.
  const reg = registro();
  const huecos = reg.huecosDeFicha ?? [];
  for (const h of huecos) {
    assert.equal(typeof h.clave, "string", `${WEBS} · huecosDeFicha: cada entrada declara «clave» (hay ${JSON.stringify(h)})`);
    assert.ok(String(h.motivo ?? "").trim().split(/\s+/).length >= 3, `${WEBS} · ${h.clave}: el motivo es una frase, no una palabra (hay «${String(h.motivo)}»)`);
  }

  // (2) Un hueco declarado no puede tener casilla: si `contratos.json` le da `ui`, la ficha SÍ puede ponerlo y el hueco es falso.
  const contratos = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(join(RAIZ_T, CONTRATOS), "utf8"))) as { huecos: { id: string; ruta: string; ui: unknown }[] };
  for (const h of huecos) {
    const fila = contratos.huecos.find((x) => x.id === h.clave || x.ruta === h.clave);
    if (!fila) continue;
    assert.equal(fila.ui, null, `${WEBS} · «${h.clave}» se declara hueco de ficha, pero ${CONTRATOS} le da ui = ${JSON.stringify(fila.ui)}: la casilla existe`);
  }

  // (3) Y lo declarado tiene que cubrir lo que de verdad no coincide: si B1 encuentra una clave distinta, o está aquí o no hay hueco.
  //     Las mismas claves y el mismo criterio que B1 (corrección de A (2)): antes eran cinco escritas a mano y comparadas por
  //     `JSON.stringify` crudo, que daba por distinto lo que sólo tenía las claves en otro orden.
  const declaradas = new Set(huecos.map((h) => h.clave));
  for (const p of PALETAS) {
    const w = web(reg, p);
    const cfg = await leerDoc("config", w.clientId);
    assert.ok(cfg, `config/${w.clientId} existe`);
    const fx = fixture(p);
    const { distintas } = await comparar(cfg as Cfg, fx, JUZGADAS.filter((clave) => !declaradas.has(clave)));
    assert.deepEqual(distintas, [], `${p}: estas claves juzgadas difieren y no están en huecosDeFicha: ${distintas.join(", ")}`);
  }
});
