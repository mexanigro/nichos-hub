// ALTA-IDIOMAS-01 · W1 (H, webs) · la prueba de punta a punta con la API real (D-240). Sesión A (2026-10-05): rojo.
//
// Liam (2026-10-05): B la hace en un cliente demo NUEVO de peluquería —no en las dos webs de prueba de E2E, cuya config es la línea
// base de D2—: lo crea por el alta, escribe lo que daría una clienta en hebreo (incompleto), pulsa el botón de la ficha, revisa la
// propuesta, confirma y guarda; mide los tokens y el costo reales de la primera web (D-239: hasta hoy sólo estimados por A, porque la
// clave de `.env.local` la rechazaba la API) y Liam juzga una muestra en los cuatro idiomas. La clave válida en `.env.local` la pone
// Liam (D-240). Lee Firestore: lleva la marca «, webs» (D-225, inciso s) y `rojo-verde --todas` no la corre en HEAD.
// Primera aserción barata y del árbol (inciso l): el registro `tests/alta-idiomas-01-demo.json` no existe en el rojo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IDIOMAS, MODELO, ROOT, existe, importarModulo, leerDoc, type Cfg, type Issue } from "./_comun.ts";

const REGISTRO = "tests/alta-idiomas-01-demo.json";

test("en un cliente demo nuevo de peluquería, con la API real: tests/alta-idiomas-01-demo.json declara el cliente, el modelo claude-opus-5-5, cada llamada con sus tokens y el costo medidos y el juicio de Liam sobre la muestra en los cuatro idiomas; y config/{id} de ese cliente tiene, guardado por la ficha, el hero y el nombre de cada servicio en en, ru y ar y pasa validateConfig sin errores", async () => {
  // (1) El registro. Hoy no existe: aquí está el rojo.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO}: la prueba con la API real no se hizo (D-240)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as Cfg;
  assert.ok(typeof r.clientId === "string" && r.clientId && !/^test-b4-peluqueria/.test(r.clientId), "un cliente demo nuevo, no una de las webs de prueba de E2E (D-240)");
  assert.equal(r.modelo, MODELO, `el modelo de la prueba es ${MODELO} (D-239)`);
  const llamadas = Array.isArray(r.llamadas) ? (r.llamadas as Cfg[]) : [];
  for (const l of ["en", "ru", "ar"]) assert.ok(llamadas.some((x) => x.idioma === l && x.input_tokens > 0 && x.output_tokens > 0), `una llamada medida para ${l}, con sus tokens`);
  assert.ok(typeof r.costoUsd === "number" && r.costoUsd > 0, "el costo medido de la web, en dólares");
  assert.ok(r.juicioLiam?.veredicto === "aprobada" && /^\d{4}-\d{2}-\d{2}$/.test(r.juicioLiam?.fecha ?? ""), "Liam juzgó la muestra en los cuatro idiomas (veredicto «aprobada», con fecha)");
  // (2) Lo guardado por la ficha.
  const config = await leerDoc("config", r.clientId);
  assert.ok(config, `config/${r.clientId} existe`);
  assert.equal(config!.business?.type, "peluqueria", "es un cliente de peluquería");
  const ids = (Array.isArray(config!.services) ? config!.services : []).map((s: Cfg) => s?.id).filter(Boolean);
  assert.ok(ids.length > 0, "el cliente tiene servicios propios");
  for (const l of IDIOMAS.filter((x) => x !== (config!.language ?? "he"))) {
    const capa = config!.translations?.[l] ?? {};
    assert.ok(typeof capa.hero?.subtitle === "string" && capa.hero.subtitle.trim(), `translations.${l}.hero.subtitle escrito`);
    for (const id of ids) assert.ok(typeof capa.services?.[id]?.name === "string" && capa.services[id].name.trim(), `translations.${l}.services.${id}.name escrito`);
  }
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  assert.deepEqual((validateConfig(config) as Issue[]).filter((e) => e.severity === "error"), [], "config/{id} pasa validateConfig sin errores");
});
