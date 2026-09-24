// E2E-01 · B (H) · el `config/{id}` que la ficha del hub dejó dice lo mismo que el fixture de su paleta en lo que se juzga (B1), y lo
// que no puede decir está vacío o declarado (B2). Sesión A (2026-09-24): tests rojos — no existe `tests/e2e-01-webs.json`.
// D-97 fija QUÉ se juzga; aquí se compara el DATO, no los píxeles (eso es C2 en T, inciso n: la página es de T).
// El material no se compara por url: el `clientId` cambia, así que la url cambia siempre. Se compara por el NOMBRE del archivo y por
// el TOKEN, que es el sha256 del contenido (D-20, H:src/lib/media-upload.ts): mismo nombre y mismo token = mismo archivo servido.
// Todo en LECTURA: el Admin SDK de H sólo lee `config/{id}`. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { CONTRATOS, PALETAS, RAIZ_H, RAIZ_T, ROOT, WEBS, fixture, get, leerDoc, registro, web } from "./_comun.ts";

type Cfg = Record<string, unknown>;
/** Las claves juzgadas (D-97), por zona. `services` y `gallery` llevan el catálogo y las piezas enteras. */
const JUZGADAS = [
  "business.type",
  "navbar.variant", "brand.logo", "brand.logoDark",
  "hero.video", "hero.eyebrow", "hero.titlePrefix", "hero.titleHighlight", "hero.titleSuffix", "hero.subtitle", "hero.ctaPrimary",
  "services", "sections.services.images", "sections.services.featured", "sections.services.surface",
  "gallery", "sections.gallery.items", "sections.gallery.selection", "sections.gallery.surface", "sections.gallery.variant",
  "branding.mode", "branding.colors", "branding.paletteMeta", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile",
];
/** Una url de Storage: `clients/<id>/media/<rol>/<nombre>?alt=media&token=<sha256[0..32)>` (D-20). */
const STORAGE = /\/o\/clients%2F[^%]+%2Fmedia%2F([^%?]+)%2F([^%?]+)\?alt=media&token=([0-9a-f]{32})/;
/** Un valor «por contenido»: la url de Storage se reduce a `<rol>/<nombre>#<token>`, que no lleva el clientId. */
function porContenido(v: unknown): unknown {
  if (typeof v === "string") {
    const m = STORAGE.exec(v);
    return m ? `${decodeURIComponent(m[1])}/${decodeURIComponent(m[2])}#${m[3]}` : v;
  }
  if (Array.isArray(v)) return v.map(porContenido);
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = porContenido(x);
    return o;
  }
  return v;
}

test("el documento `config/{clientId}` de cada web tiene, en las claves juzgadas (D-97), el mismo valor efectivo que el fixture de su paleta; el material se compara por **nombre de archivo y token** (el token de la url de Storage es el sha256 del contenido, D-20), nunca por url, porque el `clientId` cambia", async () => {
  // (1) El registro del árbol. Hoy no existe: aquí es donde esta orden está en rojo.
  const reg = registro();
  for (const p of PALETAS) {
    const w = web(reg, p);
    const cfg = await leerDoc("config", w.clientId);
    assert.ok(cfg, `config/${w.clientId} existe (la ficha del hub lo escribió)`);
    const fx = fixture(p);

    // (2) Clave por clave, el valor efectivo. El material, por contenido: la url lleva el clientId y siempre sería distinta.
    const distintas: string[] = [];
    for (const clave of JUZGADAS) {
      const enWeb = porContenido(get(cfg as Cfg, clave));
      const enFixture = porContenido(get(fx, clave));
      if (JSON.stringify(enWeb) !== JSON.stringify(enFixture)) distintas.push(clave);
    }
    assert.deepEqual(distintas, [], `${p} · config/${w.clientId}: las claves juzgadas dicen lo mismo que el fixture (difieren: ${distintas.join(", ")})`);

    // (3) Y el material que sí está es material servido: ninguna ruta local se coló por la ficha.
    for (const clave of ["brand.logo", "brand.logoDark", "branding.texture", "branding.localPhoto", "branding.localPhotoMobile"]) {
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
  const declaradas = new Set(huecos.map((h) => h.clave));
  for (const p of PALETAS) {
    const w = web(reg, p);
    const cfg = await leerDoc("config", w.clientId);
    assert.ok(cfg, `config/${w.clientId} existe`);
    const fx = fixture(p);
    const sinDeclarar = ["branding.colors", "branding.paletteMeta", "navbar.variant", "sections.services.surface", "sections.gallery.surface"]
      .filter((clave) => !declaradas.has(clave))
      .filter((clave) => JSON.stringify(get(cfg as Cfg, clave)) !== JSON.stringify(get(fx, clave)));
    assert.deepEqual(sinDeclarar, [], `${p}: estas claves juzgadas difieren y no están en huecosDeFicha: ${sinDeclarar.join(", ")}`);
  }
});
