// PLANTILLA-01 · B (Liam, 2026-10-05, en W1): fuera de la hoja. En la web demo, con la sección de reseñas oculta, el hero v6 seguía
// mostrando «5.0 · 3 ביקורות»: T `hero-v6.tsx:186` cuenta `siteConfig.testimonials`, que sin la clave cae a las tres del preset.
// Una lista vacía reemplaza al preset (medido por A2, D-263), así que desde-plantilla deja `testimonials: []` cuando la clienta no tiene
// reseñas, y no toca las suyas cuando las tiene. Con el Firestore y el Storage en memoria de la orden (no sale a la red).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, dbFalsa, importarModulo, mundo, porJson, type Cfg, type Issue } from "./orden/plantilla-01/_comun.ts";

test("desde-plantilla deja testimonials: [] cuando la clienta no tiene reseñas (sin la clave, el hero cuenta las del preset) y conserva las suyas cuando las tiene", async () => {
  const { desdePlantilla } = await importarModulo("src/lib/desde-plantilla.ts");
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  for (const sinResenas of [true, false]) {
    const w = await mundo();
    const cliente = porJson(w.inicial[`config/${CLIENTE}`]) as Cfg;
    if (sinResenas) { delete cliente.testimonials; delete cliente.translations.en.testimonials; }
    const w2 = await dbFalsa({ ...w.inicial, [`config/${CLIENTE}`]: cliente });
    await desdePlantilla({ clientId: CLIENTE, plantilla: "a", aplicar: true }, { db: w2.db, bucket: w.bucket });
    const despues = w2.doc("config", CLIENTE) as Cfg;
    if (sinResenas) assert.deepEqual(despues.testimonials, [], "sin reseñas de la clienta, la lista queda vacía (no ausente)");
    else assert.deepEqual(despues.testimonials, cliente.testimonials, "con reseñas de la clienta, quedan las suyas");
    assert.deepEqual((validateConfig(despues) as Issue[]).filter((e) => e.severity === "error").map((e) => e.path), [], "y el resultado pasa validateConfig");
  }
});
