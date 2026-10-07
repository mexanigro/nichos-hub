// MARCA-01 · S1 (H) · el material sube por consola con los nombres fijos de las casillas (D-293). Sesión A (2026-10-07): test rojo —
// no existe `src/lib/material-cliente.ts`.
//
// Liam (2026-10-07): «Sí, y sube por consola». Cada nombre fijo va al hueco de su casilla (D-36 hero, D-43 servicios, D-50 galería,
// D-66 fondo; og y retrato-<n> con el rol de su casilla), por subirMaterial —mismo rol, mismo nombre, misma url— y guardarConfig.
// Los dobles de Firestore y Storage son los de PLANTILLA-01 (`mundo()`). Caja negra: `import()` dinámico. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, deStorage, importarModulo, leer, mundo, urlDe, type Cfg } from "./_comun.ts";

const MODULO = "src/lib/material-cliente.ts";
/** nombre → [ruta del hueco, rol de su casilla]. */
const MAPA: Record<string, [string, string]> = {
  "hero.mp4": ["hero.video.mp4", "hero"], "hero.webm": ["hero.video.webm", "hero"],
  "hero-1280.mp4": ["hero.video.medium.mp4", "hero"], "hero-1280.webm": ["hero.video.medium.webm", "hero"],
  "hero-v.mp4": ["hero.video.portrait.mp4", "hero"], "hero-v.webm": ["hero.video.portrait.webm", "hero"],
  "hero-poster.avif": ["hero.video.poster", "hero"], "hero-v-poster.avif": ["hero.video.portrait.poster", "hero"],
  "textura.jpg": ["branding.texture", "branding"], "local.jpg": ["branding.localPhoto", "branding"], "local-v.jpg": ["branding.localPhotoMobile", "branding"],
  "og.jpg": ["brand.ogImage", "branding"],
  "servicio-2.jpg": ["sections.services.images.1", "services"], "galeria-1.jpg": ["sections.gallery.items.0.src", "gallery"], "retrato-1.jpg": ["staff.0.photoUrl", "staff"],
};
const archivos = () => Object.keys(MAPA).map((nombre) => ({ nombre, bytes: Buffer.from(`la ${nombre} de la clienta`) }));

test("material-cliente.ts exporta subirCarpeta({ clientId, archivos, aplicar }, { db, bucket }), donde cada archivo es { nombre, bytes }: cada nombre fijo de las casillas va a su hueco —hero.mp4 y hero.webm, hero-1280, hero-v, hero-poster.avif y hero-v-poster.avif al vídeo del hero; textura, local y local-v a branding.texture, branding.localPhoto y branding.localPhotoMobile; og a brand.ogImage; servicio-<n> a sections.services.images[n−1]; galeria-<n> a sections.gallery.items[n−1].src, con gallery[n−1] y las fotos de Instagram que la seguían; retrato-<n> a staff[n−1].photoUrl—, subido por subirMaterial con el rol de su casilla y ese nombre, la misma url que daría la casilla, y guardado por guardarConfig; en seco no sube ni escribe y dice qué haría; y un nombre que no es de ninguna casilla, o un hueco que no existe —un servicio, una pieza o una persona de más—, se rechaza sin subir ni escribir nada", async () => {
  const mod = await importarModulo(MODULO).catch((e: Error) => { assert.fail(`falta ${MODULO} (D-293): hoy el material de una clienta sube archivo por archivo en la ficha (${e.message.split("\n")[0]})`); });
  const { subirCarpeta } = mod as Cfg;
  assert.equal(typeof subirCarpeta, "function", `${MODULO} exporta subirCarpeta`);
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const m = await mundo();
  await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m.db, bucket: m.bucket });
  const conteo = () => [m.subidas.length, m.escrituras.length];

  // (1) En seco: dice qué haría y no sube ni escribe.
  const antes = conteo();
  const seco = (await subirCarpeta({ clientId: CLIENTE, archivos: archivos(), aplicar: false }, { db: m.db, bucket: m.bucket })) as { huecos: { nombre: string; ruta: string }[]; escrito: boolean };
  assert.deepEqual(conteo(), antes, "en seco no sube ni escribe nada");
  assert.equal(seco.escrito, false);
  assert.deepEqual(Object.fromEntries(seco.huecos.map((h) => [h.nombre, h.ruta])), Object.fromEntries(Object.entries(MAPA).map(([n, [r]]) => [n, r])), "en seco dice el hueco de cada nombre");

  // (2) Rechazos: nada sube ni se escribe.
  for (const malo of ["foto.jpg", "servicio-99.jpg", "galeria-9.jpg", "retrato-9.jpg"]) {
    const a = conteo();
    await assert.rejects(subirCarpeta({ clientId: CLIENTE, archivos: [...archivos(), { nombre: malo, bytes: Buffer.from("x") }], aplicar: true }, { db: m.db, bucket: m.bucket }), Error, `«${malo}» se rechaza`);
    assert.deepEqual(conteo(), a, `con «${malo}» no sube ni escribe nada (ni los demás archivos)`);
  }

  // (3) Con aplicar: cada archivo a su hueco, con el rol y el nombre de su casilla, y guardado.
  const r = (await subirCarpeta({ clientId: CLIENTE, archivos: archivos(), aplicar: true }, { db: m.db, bucket: m.bucket })) as { escrito: boolean };
  assert.equal(r.escrito, true);
  const doc = m.doc("config", CLIENTE) as Cfg;
  for (const { nombre, bytes } of archivos()) {
    const [ruta, rol] = MAPA[nombre];
    const esperada = urlDe(`clients/${CLIENTE}/media/${rol}/${nombre}`, bytes);
    assert.equal(leer(doc, ruta), esperada, `${nombre} → ${ruta}, subido como clients/${CLIENTE}/media/${rol}/${nombre} (la url de la casilla)`);
    assert.equal(m.sirve(esperada).status, 200, `${nombre}: Storage lo sirve`);
  }
  assert.equal(doc.gallery?.[0], leer(doc, "sections.gallery.items.0.src"), "galeria-1 también va a gallery[0] (D-49)");
  const ig = (doc.sections?.instagram?.images ?? []) as string[];
  assert.deepEqual(ig.filter((u) => m.sirve(u).status !== 200).map((u) => deStorage(u)?.path), [], "ninguna foto de Instagram queda rota: la que seguía a galeria-1 tiene su url nueva");
});
