// PLANTILLA-01 · C1 (H) · la consola escribe por la misma lógica que PUT /api/config, no por otra (D-255). Sesión A (2026-10-05): rojo.
//
// Medido por A: la lógica del guardado vive DENTRO de `src/app/api/config/[clientId]/route.ts` —normalizeConfigShape, el nicho del
// deploy desde hub_clients, validateConfig (422 con errores), paraFirestore (null → borrado, sin mapas vacíos en translations), set con
// merge y la entrada de auditoría en config_history—, con `next/server` y el alias `@/`: un script no la puede importar, y copiarla sería
// una segunda versión. Pasa a `src/lib/guardar-config.ts` (`guardarConfig`, con el Firestore inyectado) y la llaman el PUT y las dos
// consolas.
// Caja negra: `guardarConfig` de H por `import()` dinámico con un Firestore EN MEMORIA, y lectura de las fuentes. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { CLIENTE, dbFalsa, existe, fixture, fuente, importarModulo, porJson, type Cfg } from "./_comun.ts";

const MODULO = "src/lib/guardar-config.ts";
const RUTA = "src/app/api/config/[clientId]/route.ts";

test("PUT /api/config y las consolas guardan por la misma función, guardarConfig de src/lib/guardar-config.ts: la ruta la llama y ya no escribe en Firestore por su cuenta; desde-plantilla y textos-consola la usan; y guardarConfig hace lo que hacía el PUT —un cuerpo con error de validateConfig da 422 y no escribe nada; uno válido se guarda con set y merge, null borra sólo ese campo, el nicho queda el del hub y deja su entrada en config_history—", async () => {
  assert.ok(existe(MODULO), `falta ${MODULO} (D-255): la lógica del PUT vive en ${RUTA} y una consola no la puede usar`);
  const { guardarConfig } = await importarModulo(MODULO);
  assert.equal(typeof guardarConfig, "function", `${MODULO} exporta guardarConfig`);

  // (1) Las fuentes: una sola lógica.
  const ruta = fuente(RUTA);
  assert.match(ruta, /guardarConfig\(/, `${RUTA}: el PUT llama a guardarConfig`);
  assert.ok(!/\.set\(/.test(ruta) && !/paraFirestore\(/.test(ruta), `${RUTA}: el PUT ya no escribe por su cuenta (sin .set( ni paraFirestore( propios)`);
  for (const f of ["src/lib/desde-plantilla.ts", "src/lib/textos-consola.ts"]) {
    assert.ok(existe(f), `falta ${f}`);
    assert.match(fuente(f), /from ["']\.\/guardar-config(\.ts)?["']/, `${f} guarda con guardarConfig`);
  }

  // (2) Lo que hace: el mismo contrato que el PUT.
  const { translations: _t, ...base } = fixture("a");
  const hub = { clientId: CLIENTE, niche: "peluqueria", language: "he" };
  const w = await dbFalsa({ [`config/${CLIENTE}`]: base, [`hub_clients/hubDocAzar0001`]: hub });
  const antes = porJson(w.doc("config", CLIENTE) as Cfg);

  const malo = await guardarConfig(CLIENTE, { translations: { en: { services: { "no-existe": { name: "Nothing at all" } } } } }, { db: w.db, quien: "consola" });
  assert.equal(malo?.ok, false, "un cuerpo con error de validateConfig no se guarda");
  assert.equal(malo?.status, 422, "y da 422, como el PUT");
  assert.ok(Array.isArray(malo?.issues) && malo.issues.some((e: Cfg) => e.severity === "error"), "con los errores");
  assert.equal(w.escrituras.length + w.agregados.length, 0, "y no escribe nada");

  const bueno = await guardarConfig(CLIENTE, { hero: { eyebrow: null, subtitle: "טקסט חדש" }, business: { type: "barberia" } }, { db: w.db, quien: "consola" });
  assert.equal(bueno?.ok, true, `un cuerpo válido se guarda (${JSON.stringify(bueno).slice(0, 300)})`);
  assert.deepEqual(w.escrituras.map((e) => [e.coleccion, e.id, e.opts?.merge]), [["config", CLIENTE, true]], "con un set con merge en config/{id}");
  const despues = w.doc("config", CLIENTE) as Cfg;
  assert.equal(despues.hero.subtitle, "טקסט חדש", "lo nuevo, guardado");
  assert.ok(!("eyebrow" in despues.hero), "null borra ese campo (paraFirestore)");
  assert.equal(despues.hero.titlePrefix, antes.hero.titlePrefix, "y sólo ese: lo demás del hero queda (merge)");
  assert.equal(despues.business.type, "peluqueria", "el nicho queda el del hub, como en el PUT");
  const historial = w.agregados.filter((a) => a.coleccion === `config_history/${CLIENTE}/entries`);
  assert.equal(historial.length, 1, "deja su entrada en config_history, como el PUT");
  assert.equal(historial[0].data.changedBy, "consola", "con quién guardó");
});
