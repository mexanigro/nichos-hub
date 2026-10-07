// MARCA-01 · F1 (H) · desde-plantilla sin datos falsos y los alt de la plantilla marcados para reescribir (M1-7, D-290, D-298).
// Sesión A (2026-10-07): test rojo — hoy copia `branding.heroToBackdrop` de la plantilla, no dice qué material quedó de la plantilla,
// y la consola de textos no lista los alt de la galería, que llegan llenos con la descripción de las fotos de la plantilla.
//
// Medido (D-298): vaciar los alt hace que el guardado dé 422 (`config-validator.ts:854`, «alt obligatorio»); Liam: «Marcar, no
// vaciar». `camposDeTexto` (`textos-claude.ts:101`) nunca lista el alt en el idioma base y en los otros sólo si está vacío. Los
// dobles de Firestore y Storage son los de PLANTILLA-01 (`mundo()`). Caja negra: `import()` dinámico. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, deStorage, hojas, importarModulo, leer, mundo, type Cfg } from "./_comun.ts";

const IDS = ["g-color", "g-rizos", "g-liso", "g-recogidos", "g-novia", "g-cortes"];
const VIEJO = { relation: "same-hue", mechanism: "veil-from-first-pixel", dH: 0, dL: 0.079, foot: { hex: "#827f82", L: 0.601, C: 0.005, H: 323 } };
type Campo = Cfg & { ruta: string; descripcion: string };
type Exportado = { base: string; idiomas: Record<string, { campos: Campo[] }> };

test("desdePlantilla no copia branding.heroToBackdrop de la plantilla, y si el cliente tenía uno el cuerpo lo borra; devuelve deLaPlantilla con la ruta de cada hueco cuyo material copió; y la consola de textos marca los alt de la galería que siguen siendo los de la plantilla: exportarTextos lista, en el idioma base y en cada capa, cada alt igual al de esa pieza en la plantilla, con la url de su foto en su descripción, y aplicarTextos acepta reescribirlo —el del idioma base en sections.gallery.items[i].alt y los otros en translations.<l>.sections.gallery.alts.<id>—, mientras que un alt que ya no es el de la plantilla no se reescribe y camposDeTexto, el camino de la API, no lista ninguno", async () => {
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const { exportarTextos, aplicarTextos } = await importarModulo("src/lib/textos-consola.ts");
  const { camposDeTexto } = await importarModulo("src/lib/textos-claude.ts");
  type Res = { cuerpo: Cfg; vaciados: string[]; deLaPlantilla?: string[]; material: { de: string; a: string }[] };

  // (1) heroToBackdrop: ni el de la plantilla (A lo tiene) ni el viejo del cliente.
  const m = await mundo({ branding: { heroToBackdrop: VIEJO } });
  assert.ok(m.tenants.a.branding?.heroToBackdrop, "precondición: la plantilla A tiene branding.heroToBackdrop");
  const seco = (await desdePlantilla({ clientId: CLIENTE, plantilla: "a" }, { db: m.db, bucket: m.bucket })) as Res;
  assert.equal(seco.cuerpo.branding?.heroToBackdrop, null, `el cuerpo borra el heroToBackdrop que el cliente tenía (null), y no copia el de la plantilla (es: ${JSON.stringify(seco.cuerpo.branding?.heroToBackdrop)})`);
  const r = (await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m.db, bucket: m.bucket })) as Res;
  const doc = m.doc("config", CLIENTE) as Cfg;
  assert.equal(doc.branding?.heroToBackdrop, undefined, "después de aplicar, el config del cliente no tiene branding.heroToBackdrop");
  const m2 = await mundo();
  await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m2.db, bucket: m2.bucket });
  assert.equal((m2.doc("config", CLIENTE) as Cfg).branding?.heroToBackdrop, undefined, "un cliente sin heroToBackdrop tampoco recibe el de la plantilla");

  // (2) deLaPlantilla: la ruta de cada hueco cuyo material copió.
  assert.ok(Array.isArray(r.deLaPlantilla), "desdePlantilla devuelve deLaPlantilla");
  const copiados = new Set(r.material.map((x) => x.a));
  const conCopia = hojas(doc).filter(([k, v]) => !k.startsWith("gallery.") && copiados.has(deStorage(v)?.path ?? "")).map(([k]) => k).sort();
  assert.deepEqual([...(r.deLaPlantilla ?? [])].filter((k) => !k.startsWith("gallery.")).sort(), conCopia, "deLaPlantilla nombra cada hueco (fuera del respaldo gallery[]) cuya url es un archivo que copió");

  // (3) Los alt llegan como en la plantilla (la web nunca queda sin alt) y exportar los marca, en cada idioma, con la url de su foto.
  const items = (doc.sections?.gallery?.items ?? []) as Cfg[];
  assert.deepEqual(items.map((x) => x.id), IDS, "precondición: la galería de A llega con sus seis piezas");
  assert.deepEqual(items.map((x) => x.alt), (m.tenants.a.sections.gallery.items as Cfg[]).map((x) => x.alt), "los alt se copian como en la plantilla (D-298: marcar, no vaciar)");
  const ex = (await exportarTextos({ clientId: CLIENTE }, { db: m.db })) as Exportado;
  assert.equal(ex.base, "he");
  for (const l of ["he", "en", "ru", "ar"]) for (const [i, id] of IDS.entries()) {
    const c = (ex.idiomas[l]?.campos ?? []).find((x) => x.ruta === `sections.gallery.alts.${id}`);
    assert.ok(c, `exportar lista sections.gallery.alts.${id} en «${l}»: su alt es todavía el de la plantilla (D-298)`);
    assert.ok(c.descripcion.includes(items[i].src), `y su descripción trae la url de su foto (${c.descripcion})`);
  }

  // (4) aplicar reescribe un alt de la plantilla en el idioma base y otro en una capa.
  const he = "תלתלים רכים ומלאים בגוון ערמוני", en = "Soft full curls in a warm chestnut shade";
  const ap = (await aplicarTextos({ clientId: CLIENTE, propuesta: { he: { "sections.gallery.alts.g-rizos": he }, en: { "sections.gallery.alts.g-color": en } }, aplicar: true }, { db: m.db })) as { entran: string[]; escrito: boolean };
  assert.deepEqual([...ap.entran].sort(), ["en:sections.gallery.alts.g-color", "he:sections.gallery.alts.g-rizos"], `aplicar acepta reescribir los dos alt de la plantilla (entran: ${ap.entran.join(", ")})`);
  assert.equal(ap.escrito, true);
  const despues = m.doc("config", CLIENTE) as Cfg;
  assert.equal((despues.sections.gallery.items as Cfg[])[1].alt, he, "el del idioma base va en sections.gallery.items[1].alt");
  assert.equal(leer(despues, "translations.en.sections.gallery.alts.g-color"), en, "el de en va en translations.en.sections.gallery.alts.g-color");

  // (5) Un alt que ya no es el de la plantilla no se vuelve a listar ni se reescribe.
  const ex2 = (await exportarTextos({ clientId: CLIENTE }, { db: m.db })) as Exportado;
  assert.ok(!(ex2.idiomas.he?.campos ?? []).some((x) => x.ruta === "sections.gallery.alts.g-rizos"), "el alt hebreo ya reescrito no se lista otra vez");
  assert.ok(!(ex2.idiomas.en?.campos ?? []).some((x) => x.ruta === "sections.gallery.alts.g-color"), "el de en ya reescrito tampoco");
  const ap2 = (await aplicarTextos({ clientId: CLIENTE, propuesta: { he: { "sections.gallery.alts.g-rizos": "תלתלים אחרים לגמרי" } } }, { db: m.db })) as { entran: string[] };
  assert.deepEqual(ap2.entran, [], "y aplicar no lo reescribe: ya no es el de la plantilla");

  // (6) El camino de la API no cambia: Claude no ve la foto.
  for (const l of ["he", "en"]) {
    const api = (camposDeTexto(m.doc("config", CLIENTE), "peluqueria", l, "he") as { ruta: string }[]).map((x) => x.ruta);
    assert.deepEqual(api.filter((x) => x.startsWith("sections.gallery.alts.")), [], `camposDeTexto (escribirTextos) no lista ningún alt de la galería en «${l}»`);
  }
});
