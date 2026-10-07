// MARCA-01 · I1 (H) · Instagram sigue a la galería (D-291). Sesión A (2026-10-07): test rojo — hoy `aplicarPieza` cambia la pieza y
// `gallery[i]`, y deja en `sections.instagram.images` la url vieja del mismo archivo, que Storage ya no sirve (403, medido en Ashkelon).
//
// La causa: desde-plantilla deja Instagram con las mismas urls que la galería (el mismo archivo de Storage) y subirMaterial, al subir
// otra foto con el nombre fijo de la pieza, reescribe ese archivo con otro token (D-22). El bucket en memoria responde como Storage:
// 403 con un token que ya no es el vigente. Caja negra: `import()` dinámico de los módulos de H. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUCKET, CLIENTE, deStorage, importarModulo, mundo, porJson, urlDe, type Cfg } from "./_comun.ts";

const CASILLA = "src/components/config-editors/gallery-editor.tsx";

test("aplicarPieza(config, i, \"src\", url) pone la url nueva en cada foto de sections.instagram.images que apuntaba al mismo archivo de Storage que la pieza —la misma ruta, con cualquier token— y no toca las demás; y con la fusión de Firestore modelada, después de desdePlantilla y de reemplazar la foto de una pieza como la casilla de galería (subirMaterial con su nombre fijo y aplicarPieza), ninguna foto de Instagram queda con un token que Storage ya no sirve", async () => {
  const { aplicarPieza } = await importarModulo(CASILLA);
  assert.equal(typeof aplicarPieza, "function", `${CASILLA} exporta aplicarPieza`);

  // (1) La función pura.
  const ruta = `clients/${CLIENTE}/media/gallery/galeria-1.jpg`, otra = `clients/${CLIENTE}/media/gallery/galeria-2.jpg`;
  const vieja = urlDe(ruta, Buffer.from("v1")), viejaOtroToken = urlDe(ruta, Buffer.from("v0")), ajena = urlDe(otra, Buffer.from("x")), nueva = urlDe(ruta, Buffer.from("v2"));
  const config: Cfg = {
    sections: { gallery: { items: [{ id: "g1", type: "color", src: vieja }, { id: "g2", type: "rizos", src: ajena }] }, instagram: { images: [vieja, ajena, viejaOtroToken], title: "IG" } },
    gallery: [vieja, ajena],
    brand: { name: "סלון" },
  };
  const antes = porJson(config);
  const out = aplicarPieza(config, 0, "src", nueva) as Cfg;
  assert.deepEqual(config, antes, "no muta la entrada");
  assert.deepEqual(out.sections.instagram.images, [nueva, ajena, nueva], "las fotos de Instagram del mismo archivo (con cualquier token) pasan a la url nueva; la de otro archivo no se toca");
  assert.equal(out.sections.instagram.title, "IG", "lo demás de Instagram no cambia");
  assert.equal(out.sections.gallery.items[0].src, nueva); assert.equal(out.gallery[0], nueva, "la pieza y su respaldo gallery[0] (D-49), como antes");
  assert.deepEqual(out.brand, antes.brand, "nada más cambia");
  const sinIg = aplicarPieza({ sections: { gallery: { items: [{ id: "g1", src: vieja }] } }, gallery: [vieja] }, 0, "src", nueva) as Cfg;
  assert.equal(sinIg.sections.instagram, undefined, "sin Instagram, no lo crea");

  // (2) De punta a punta, modelado: desde-plantilla, subir la foto de la pieza 1 como la casilla, guardar el config entero.
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const { subirMaterial } = await importarModulo("src/lib/media-upload.ts");
  const { guardarConfig } = await importarModulo("src/lib/guardar-config.ts");
  const m = await mundo();
  await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m.db, bucket: m.bucket });
  const igAntes = ((m.doc("config", CLIENTE) as Cfg).sections?.instagram?.images ?? []) as string[];
  const fotoPieza = (m.doc("config", CLIENTE) as Cfg).sections.gallery.items[0].src as string;
  assert.ok(igAntes.some((u) => deStorage(u)?.path === deStorage(fotoPieza)?.path), "precondición: después de desde-plantilla, Instagram apunta al mismo archivo que la pieza 1 de la galería");
  assert.deepEqual(igAntes.filter((u) => m.sirve(u).status !== 200), [], "precondición: antes de cambiar la galería, Storage sirve las fotos de Instagram");
  const subida = (await subirMaterial({ clientId: CLIENTE, rol: "gallery", nombre: "galeria-1.jpg", buffer: Buffer.from("la foto nueva de la clienta"), contentType: "image/jpeg" }, { bucket: m.bucket })) as { url: string };
  assert.equal(deStorage(subida.url)?.bucket, BUCKET);
  const cuerpo = aplicarPieza(m.doc("config", CLIENTE), 0, "src", subida.url) as Cfg;
  const g = (await guardarConfig(CLIENTE, cuerpo, { db: m.db, quien: "test" })) as { ok: boolean; issues?: unknown };
  assert.equal(g.ok, true, `el guardado de la casilla pasa (${JSON.stringify(g.issues)})`);
  const igDespues = ((m.doc("config", CLIENTE) as Cfg).sections?.instagram?.images ?? []) as string[];
  const rotas = igDespues.filter((u) => m.sirve(u).status !== 200).map((u) => `${deStorage(u)?.path} → ${m.sirve(u).status}`);
  assert.deepEqual(rotas, [], "después de cambiar la foto de la pieza 1, ninguna foto de Instagram queda con un token que Storage ya no sirve");
  assert.ok(igDespues.includes(subida.url), "y la que la seguía muestra la foto nueva");
});
