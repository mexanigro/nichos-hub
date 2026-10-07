// MARCA-01 · los dos guardados que salían 422 (los midió la sesión A con su prototipo, `4.3.md` § MARCA-01 · A (g)), con su guard en
// las dos direcciones:
//  (1) `validateConfig` toma `branding.heroToBackdrop: null` como un BORRADO (desde-plantilla ya no copia el de la plantilla y borra
//      el que el cliente tenía); un objeto sin relation ni mechanism sigue siendo error.
//  (2) `cuerpoDePropuesta`, al reescribir un alt del idioma base, manda la galería entera y con ella `services`: el `serviceId` de cada
//      pieza se busca en el catálogo del mismo cuerpo (`guardarConfig` valida el cuerpo solo). Sin `services`, 422.
// Con los dobles de Firestore y Storage de la orden (`mundo()`), sin red. Sesión B de MARCA-01 (2026-10-07).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, importarModulo, mundo, type Cfg } from "./orden/marca-01/_comun.ts";

test("validateConfig toma branding.heroToBackdrop: null como un borrado (sin error) y un heroToBackdrop sin relation ni mechanism sigue siendo error; y guardarConfig con null lo borra del config", async () => {
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  const errores = (c: Cfg) => (validateConfig(c) as { path: string; severity: string }[]).filter((i) => i.severity === "error" && i.path.startsWith("branding.heroToBackdrop"));
  assert.deepEqual(errores({ branding: { heroToBackdrop: null } }), [], "null es un borrado: ningún error");
  assert.ok(errores({ branding: { heroToBackdrop: {} } }).length >= 2, "un objeto vacío sigue dando error por relation y mechanism");
  const { guardarConfig } = await importarModulo("src/lib/guardar-config.ts");
  const m = await mundo({ branding: { heroToBackdrop: { relation: "same-hue", mechanism: "veil-from-first-pixel" } } });
  const r = (await guardarConfig(CLIENTE, { branding: { heroToBackdrop: null } }, { db: m.db, quien: "test" })) as { ok: boolean; issues?: unknown };
  assert.equal(r.ok, true, `el guardado con heroToBackdrop: null pasa (${JSON.stringify(r.issues)})`);
  assert.equal((m.doc("config", CLIENTE) as Cfg).branding?.heroToBackdrop, undefined, "y la clave queda borrada");
});

test("cuerpoDePropuesta, al reescribir un alt del idioma base (sections.gallery.items), manda también services, y guardarConfig acepta ese cuerpo; sin services el mismo cuerpo sale 422 por el serviceId de las piezas", async () => {
  const { cuerpoDePropuesta } = await importarModulo("src/lib/textos-claude.ts");
  const { guardarConfig } = await importarModulo("src/lib/guardar-config.ts");
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const m = await mundo();
  await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: m.db, bucket: m.bucket });
  const config = m.doc("config", CLIENTE) as Cfg;
  const pieza = (config.sections.gallery.items as Cfg[]).find((x) => x.serviceId);
  assert.ok(pieza, "precondición: una pieza de la galería lleva serviceId");
  const ruta = `sections.gallery.alts.${pieza.id}`;
  const propuesta = { he: { [ruta]: "תלתלים רכים בגוון ערמוני חם" } };
  const cuerpo = cuerpoDePropuesta(config, "peluqueria", "he", propuesta, [`he:${ruta}`], undefined, { he: [{ ruta }] }) as Cfg;
  assert.ok(Array.isArray(cuerpo.sections?.gallery?.items), "el cuerpo lleva la galería entera");
  assert.deepEqual(cuerpo.services, config.services, "y el catálogo de servicios, sin cambios");
  const bien = (await guardarConfig(CLIENTE, cuerpo, { db: m.db, quien: "test" })) as { ok: boolean; status?: number; issues?: unknown };
  assert.equal(bien.ok, true, `guardarConfig acepta el cuerpo (${JSON.stringify(bien.issues)})`);
  const { services: _s, ...sinServicios } = cuerpo;
  const mal = (await guardarConfig(CLIENTE, sinServicios, { db: m.db, quien: "test" })) as { ok: boolean; status?: number };
  assert.equal(mal.status, 422, "sin services, el mismo cuerpo sale 422 (el defecto que se arregla)");
});
