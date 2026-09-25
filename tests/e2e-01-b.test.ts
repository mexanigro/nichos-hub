// E2E-01 · copia promovida (ARREGLOS-01, 2026-09-25, D-105). La orden quedó aprobada por Liam el 2026-09-25
// (T c4faa5d · H 0c6d3e0) y su carpeta de la orden está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte (D-89, D-95, D-105): **sin Firestore y sin los GET a Storage**. La orden comparaba el `config/{id}` real de cada web
// contra su fixture y bajaba cada archivo para compararlo por sha256; una copia que corre en cada `npm test` no sale a la red. Lo
// que se conserva —y es lo único que hacía falta conservar— es el COMPARADOR: se ejercita en local, con el fixture contra una copia
// suya con el `clientId` cambiado en cada url y con el logo en la ruta y el token viejos.
//
// D-112 (ARREGLOS-01). La orden emitía el diagnóstico «(LOGO-01)» cuando el valor no coincidía «por valor» aunque coincidiera por
// contenido. Pero la url de Storage lleva el `clientId`, y el `clientId` de una web creada desde la ficha NUNCA es el de la
// plantilla: por eso el diagnóstico salía también en `hero.video` y en `sections.services.images`, que siguen exactamente la misma
// convención que el fixture. Lo que LOGO-01 nombra es otra cosa: la casilla de logo guardaba en otra RUTA
// (`clients/<id>/logo-light-bg.png` en vez de `clients/<id>/media/branding/logo.png`) y con otra CLASE DE TOKEN (UUID en vez del
// sha256 del contenido). Esta copia compara **normalizando el `clientId`** en la url: sólo etiqueta cuando cambia la forma de la
// ruta o la clase de token. (ARREGLOS-01 arregla esa casilla; el diagnóstico queda para que la convención se siga vigilando.)
//
// Las dos direcciones: `brand.logo` y `brand.logoDark` —que cambian de ruta y de token— SALEN etiquetadas; `hero.video` y
// `sections.services.images` —donde lo único que cambia es el `clientId`— NO. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTRATOS, PALETAS, RAIZ_T, WEBS, fixture, get, registro, web } from "./orden/e2e-01/_comun.ts";

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
/** Claves que se comparan sólo por algunas subclaves: `derivedAt` es el instante de la derivación, no un valor de diseño. */
const SUBCLAVES: Record<string, string[]> = { "branding.paletteMeta": ["source", "origin", "reason", "niche"] };
/** Las claves de material cuyo valor tiene que ser una url servida (ninguna ruta local se coló por la ficha). */
const MATERIAL = ["brand.logo", "brand.logoDark", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile"];
/** Las dos claves que la casilla de logo guardaba fuera de la convención del resto del material. */
const LOGOS: Record<string, string> = { "brand.logo": "logo-light-bg.png", "brand.logoDark": "logo-dark-bg.png" };

const RE_URL = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)\?alt=media&token=(.+)$/;
const ES_STORAGE = (v: unknown): v is string => typeof v === "string" && RE_URL.test(v);
const partes = (url: string) => { const m = RE_URL.exec(url)!; return { bucket: m[1], ruta: decodeURIComponent(m[2]), token: m[3] }; };
const arma = (p: { bucket: string; ruta: string; token: string }) => `https://firebasestorage.googleapis.com/v0/b/${p.bucket}/o/${encodeURIComponent(p.ruta)}?alt=media&token=${p.token}`;
/** La misma url con el `clientId` sustituido por un marcador: lo único que cambia entre una web y su plantilla NO cuenta (D-112). */
const sinClientId = (url: string) => { const p = partes(url); return arma({ ...p, ruta: p.ruta.replace(/^clients\/[^/]+\//, "clients/<id>/") }); };

/** Mismo valor con las claves de cada objeto ORDENADAS: comparar por valor y no por el orden en que vino. */
function canonico(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) o[k] = canonico((v as Record<string, unknown>)[k]);
    return o;
  }
  return v;
}
/** El mismo valor con cada url de Storage sustituida por `fn(url)`. */
function mapearUrls(v: unknown, fn: (u: string) => string): unknown {
  if (ES_STORAGE(v)) return fn(v);
  if (Array.isArray(v)) return v.map((x) => mapearUrls(x, fn));
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = mapearUrls(x, fn);
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
/** El valor que se juzga de una clave: entero, o sólo las subclaves de `SUBCLAVES` cuando las tiene. */
function valorJuzgado(fuente: unknown, clave: string): unknown {
  const v = get(fuente, clave);
  const solo = SUBCLAVES[clave];
  if (!solo || v == null || typeof v !== "object") return v;
  const o: Record<string, unknown> = {};
  for (const k of solo) o[k] = (v as Record<string, unknown>)[k];
  return o;
}

/**
 * La copia del fixture que representa lo que la ficha del hub deja en `config/{clientId}`: **los mismos bytes** en cada url, con
 * el `clientId` de la web, y las dos claves del logo además en la ruta y con el token que usaba la casilla vieja. Devuelve también
 * el mapa url-de-la-web → url-del-fixture, que es la identidad de contenido que la orden obtenía bajando cada archivo.
 */
function comoLaFicha(fx: Record<string, unknown>, clientId: string): { cfg: Cfg; contenido: Map<string, string> } {
  const contenido = new Map<string, string>();
  const conElClientIdDeLaWeb = (u: string) => {
    const p = partes(u);
    const nueva = arma({ ...p, ruta: p.ruta.replace(/^clients\/[^/]+\//, `clients/${clientId}/`) });
    contenido.set(nueva, u);
    return nueva;
  };
  const cfg = mapearUrls(JSON.parse(JSON.stringify(fx)), conElClientIdDeLaWeb) as Cfg;
  // Y el logo, por la puerta vieja: otra ruta (fuera de `media/<rol>/`) y un token que no es el sha256 del contenido.
  for (const [clave, nombreViejo] of Object.entries(LOGOS)) {
    const actual = get(cfg, clave);
    if (!ES_STORAGE(actual)) continue;
    const p = partes(actual);
    const vieja = arma({ bucket: p.bucket, ruta: `clients/${clientId}/${nombreViejo}`, token: randomUUID() });
    contenido.set(vieja, contenido.get(actual)!);
    const [raiz, hoja] = clave.split(".");
    (cfg[raiz] as Record<string, unknown>)[hoja] = vieja;
  }
  return { cfg, contenido };
}

type Comparacion = { distintas: string[]; misma: { clave: string; web: string; fixture: string }[] };
/**
 * Compara las claves juzgadas de un config contra su fixture. El material, por CONTENIDO (dos urls son el mismo archivo cuando
 * sirven los mismos bytes); el resto, por VALOR con las claves ordenadas. Y devuelve aparte las claves que son el mismo archivo
 * servido con OTRA FORMA de url —otra ruta u otra clase de token—, que es lo que el diagnóstico «(LOGO-01)» nombra: una url que
 * sólo cambia en el `clientId` no entra (D-112).
 */
function comparar(cfg: Cfg, fx: Record<string, unknown>, claves: string[], contenido: Map<string, string>): Comparacion {
  const porContenido = (v: unknown) => canonico(mapearUrls(v, (u) => `bytes:${contenido.get(u) ?? u}`));
  const porForma = (v: unknown) => canonico(mapearUrls(v, sinClientId));

  const distintas: string[] = [];
  const misma: { clave: string; web: string; fixture: string }[] = [];
  for (const clave of claves) {
    const crudoWeb = valorJuzgado(cfg, clave), crudoFx = valorJuzgado(fx, clave);
    if (JSON.stringify(porContenido(crudoWeb)) !== JSON.stringify(porContenido(crudoFx))) { distintas.push(clave); continue; }
    // Mismos bytes: ¿cambia algo más que el `clientId`? Sólo entonces es una diferencia de convención.
    if (JSON.stringify(porForma(crudoWeb)) !== JSON.stringify(porForma(crudoFx)) && urlsDe(crudoWeb).length) {
      misma.push({ clave, web: String(urlsDe(crudoWeb)[0]), fixture: String(urlsDe(crudoFx)[0] ?? "") });
    }
  }
  return { distintas, misma };
}

test("el comparador de claves juzgadas (D-97) da lo mismo para el fixture y para el `config/{clientId}` que la ficha deja —mismos bytes con otro `clientId` en cada url— y etiqueta «(LOGO-01)» sólo lo que cambia de ruta o de clase de token", (t) => {
  const reg = registro();
  for (const p of PALETAS) {
    const w = web(reg, p);
    const fx = fixture(p);
    const { cfg, contenido } = comoLaFicha(fx, w.clientId);

    // (1) Clave por clave: nada difiere por contenido — el `clientId` de la url no es una diferencia.
    const { distintas, misma } = comparar(cfg, fx, JUZGADAS, contenido);
    for (const m of misma) t.diagnostic(`${p} · ${m.clave}: mismos bytes, otra forma de url (LOGO-01) · web: ${m.web} · fixture: ${m.fixture}`);
    assert.deepEqual(distintas, [], `${p}: las claves juzgadas dicen lo mismo que el fixture (difieren: ${distintas.join(", ")})`);

    // (2) Y lo etiquetado es exactamente lo que cambia de convención: las dos claves del logo, ninguna más.
    assert.deepEqual([...misma.map((m) => m.clave)].sort(), Object.keys(LOGOS).sort(), `${p}: sólo las claves del logo cambian de ruta y de clase de token; una url que sólo cambia el clientId (hero.video, sections.services.images) no se etiqueta`);

    // (3) Y el material que sí está es material servido: ninguna ruta local se coló.
    for (const clave of MATERIAL) {
      const v = get(cfg, clave);
      if (v === undefined || v === null || v === "") continue;
      assert.match(String(v), /^https:\/\//, `${p} · ${clave}: url https de Storage (hay «${String(v).slice(0, 80)}»)`);
    }
  }
});

test("los huecos de ficha declarados en `tests/e2e-01-webs.json` llevan clave y motivo, y ninguno tiene `ui` distinto de `null` en `verdad/contratos.json` (si la tiene, la casilla existe y el hueco no es de la ficha)", () => {
  const reg = registro();
  const huecos = reg.huecosDeFicha ?? [];
  for (const h of huecos) {
    assert.equal(typeof h.clave, "string", `${WEBS} · huecosDeFicha: cada entrada declara «clave» (hay ${JSON.stringify(h)})`);
    assert.ok(String(h.motivo ?? "").trim().split(/\s+/).length >= 3, `${WEBS} · ${h.clave}: el motivo es una frase, no una palabra (hay «${String(h.motivo)}»)`);
  }
  const contratos = JSON.parse(readFileSync(join(RAIZ_T, CONTRATOS), "utf8")) as { huecos: { id: string; ruta: string; ui: unknown }[] };
  for (const h of huecos) {
    const fila = contratos.huecos.find((x) => x.id === h.clave || x.ruta === h.clave);
    if (!fila) continue;
    assert.equal(fila.ui, null, `${WEBS} · «${h.clave}» se declara hueco de ficha, pero ${CONTRATOS} le da ui = ${JSON.stringify(fila.ui)}: la casilla existe`);
  }
});
