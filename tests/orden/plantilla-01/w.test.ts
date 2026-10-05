// PLANTILLA-01 · W1 (H, webs) · la prueba de punta a punta y el cronómetro de una web nueva (D-261). Sesión A (2026-10-05): rojo.
//
// Liam (2026-10-05): en un cliente demo de peluquería NUEVO, creado por el alta (no el de ALTA-IDIOMAS-01, que es la evidencia de su W1,
// ni las webs de prueba de E2E, que son la línea base de D2), la sesión B hace el camino de una venta —alta → desde-plantilla → la ficha →
// exportar → Claude Code escribe (sin API) → aplicar → redeploy por la ficha → revisión en 4 idiomas— y cronometra cada paso: es la línea
// base de las 2 horas por web. La web viva es igual a la plantilla en lo que no es identidad ni texto nuevo: su diseño y su material
// (copiado, con los mismos bytes: el mismo token), y los textos que nombraban a la plantilla, escritos ahora para la clienta.
// Lee Firestore, Storage y la API de Vercel (en LECTURA): lleva la marca «, webs» (D-225, inciso s) y `rojo-verde --todas` no la corre en
// HEAD. A2 (D-263, inciso z): antes del redeploy, equipo y reseñas reales o la sección oculta; la web demo no sale con los del preset.
// Primera aserción barata y del árbol (inciso l): el registro `tests/plantilla-01-demo.json` no existe en el rojo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IDIOMAS, PLANTILLAS, ROOT, dbReal, deStorage, existe, hojas, importarModulo, leer, nombresDePlantilla, vaciadosDe, vercel, webs, type Cfg, type Issue, type Paleta } from "./_comun.ts";

const REGISTRO = "tests/plantilla-01-demo.json";
const PASOS = ["alta", "desdePlantilla", "ficha", "exportar", "escribir", "aplicar", "redeploy", "revision"];
/** El diseño que la web nueva tiene que tener igual que la plantilla: lo que la ficha no toca en una carga de contenido (D-261). */
const DISENO = /^(hero\.variant|hero\.video\.|navbar\.|footer\.|branding\.|palette\.|features\.|activeTheme|splash\.|gallery\.|sections\.[a-z]+\.(variant|surface)$|sections\.gallery\.items\.\d+\.src$|sections\.instagram\.images\.)/;

test("en un cliente demo nuevo de peluquería creado por el alta: tests/plantilla-01-demo.json declara el cliente, la plantilla, el commit de T desplegado, el deployment y los minutos de cada paso (alta, desde-plantilla, ficha, exportar, escribir, aplicar, redeploy, revisión) y su total; el deployment está READY sobre ese commit y es del proyecto del cliente; y config/{id} tiene la identidad del alta, el diseño de la plantilla con su material copiado al Storage del cliente con los mismos bytes, ninguna url de la plantilla, los textos que la nombraban escritos para la clienta en los cuatro idiomas y pasa validateConfig sin errores; y avisosDePreset no da ningún aviso (equipo propio, y reseñas propias o la sección oculta: inciso z)", async () => {
  // (1) El registro. Hoy no existe: aquí está el rojo.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO}: la prueba de punta a punta no se hizo (D-261)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as Cfg;
  const id = String(r.clientId ?? "");
  assert.ok(id && !/^test-b4-peluqueria/.test(id) && id !== "demo-demo-alta-idiomas-f2dfb64e" && !webs().some((x) => x.clientId === id), `un cliente demo nuevo (no una plantilla, ni el de ALTA-IDIOMAS-01, ni una web de E2E): «${id}»`);
  const p = r.plantilla as Paleta;
  assert.ok(p === "a" || p === "c", `la plantilla es a o c («${r.plantilla}»)`);
  assert.match(String(r.tCommit ?? ""), /^[0-9a-f]{7,40}$/, "el commit de T desplegado");
  const minutos = (r.cronometro ?? {}) as Record<string, number>;
  for (const paso of PASOS) assert.ok(typeof minutos[paso] === "number" && minutos[paso] > 0, `el cronómetro tiene los minutos de «${paso}»`);
  const suma = PASOS.reduce((a, k) => a + minutos[k], 0);
  assert.ok(typeof r.totalMinutos === "number" && Math.abs(r.totalMinutos - suma) <= 1, `el total (${r.totalMinutos}) es la suma de los pasos (${suma})`);

  // (2) Firestore: el cliente del alta.
  const db = await dbReal();
  const hubs = await db.collection("hub_clients").where("clientId", "==", id).limit(2).get();
  assert.equal(hubs.size, 1, `hub_clients tiene un documento con clientId ${id}`);
  const hub = hubs.docs[0].data() as Cfg;
  assert.equal(hub.niche, "peluqueria", "de peluquería");
  assert.ok(typeof hub.vercelProjectId === "string" && hub.vercelProjectId, "creado por el alta (con su proyecto de Vercel)");
  const config = (await db.collection("config").doc(id).get()).data() as Cfg | undefined;
  assert.ok(config, `config/${id} existe`);
  const tenant = (await db.collection("config").doc(PLANTILLAS[p]).get()).data() as Cfg;
  assert.equal(config!.brand?.name, hub.businessName, "la marca es la del alta, no la de la plantilla");
  assert.equal(config!.language ?? "he", hub.language ?? "he", "el idioma es el del alta");

  // (3) El diseño de la plantilla, con su material copiado al Storage del cliente (mismos bytes = mismo token).
  for (const [ruta, v] of hojas(tenant).filter(([k]) => DISENO.test(k))) {
    const got = leer(config, ruta), s = deStorage(v);
    if (!s) { assert.deepEqual(got, v, `${ruta} es el de la plantilla`); continue; }
    const u = deStorage(got);
    assert.ok(u && u.path === s.path.replace(`clients/${PLANTILLAS[p]}/`, `clients/${id}/`), `${ruta} apunta a la copia en clients/${id}/media/ (hay ${String(got).slice(0, 140)})`);
    assert.equal(u!.token, s.token, `${ruta}: los mismos bytes que la plantilla (el mismo token)`);
  }
  const textos = hojas(config).filter(([, v]) => typeof v === "string") as [string, string][];
  assert.deepEqual(textos.filter(([, v]) => v.includes(PLANTILLAS.a) || v.includes(PLANTILLAS.c)).map(([k]) => k), [], "ninguna url apunta a la plantilla");
  for (const [ruta, v] of textos) {
    const s = deStorage(v);
    if (!s) continue;
    const bytes = Buffer.from(await (await fetch(v, { signal: AbortSignal.timeout(30000) })).arrayBuffer());
    assert.equal(createHash("sha256").update(bytes).digest("hex").slice(0, 32), s.token, `${ruta}: Storage sirve los bytes de su token`);
  }

  // (4) Los textos que nombraban a la plantilla, escritos para la clienta (salvo las respuestas del FAQ: un hecho que se escribe en la
  // ficha, D-238/D-253), y ninguno nombra a la plantilla.
  const nombres = nombresDePlantilla(p);
  for (const ruta of vaciadosDe(p, tenant).filter((k) => !/\.faq\.items\.\d+\.answer$/.test(k))) {
    const v = leer(config, ruta);
    assert.ok(typeof v === "string" && v.trim(), `${ruta} quedó escrito para la clienta`);
    assert.ok(!nombres.some((n) => v.includes(n)), `${ruta} no nombra a la plantilla («${v}»)`);
  }
  for (const l of IDIOMAS.filter((x) => x !== (config!.language ?? "he"))) assert.ok(String(leer(config, `translations.${l}.hero.subtitle`) ?? "").trim(), `${l}: el hero tiene su frase en ese idioma`);
  const { validateConfig } = await importarModulo("src/lib/config-validator.ts");
  assert.deepEqual((validateConfig(config) as Issue[]).filter((e) => e.severity === "error").map((e) => `${e.path}: ${e.message}`), [], `config/${id} pasa validateConfig sin errores`);

  // Inciso z (D-263): la web sale con equipo propio, y reseñas propias o la sección oculta (el paso obligatorio de la guía antes del redeploy).
  const { avisosDePreset } = await importarModulo("src/lib/avisos-preset.ts");
  assert.deepEqual(avisosDePreset(config, "peluqueria"), [], `config/${id} sale sin equipo ni reseñas del preset (inciso z)`);

  // (5) El deploy, por ESTADO (nunca por hash): READY, sobre el commit de T declarado, del proyecto del cliente.
  const d = await vercel(`/v13/deployments/${encodeURIComponent(String(r.deploymentId ?? ""))}`);
  assert.equal(d.status, 200, `la API de Vercel encuentra el deployment ${r.deploymentId}`);
  assert.equal(d.json.readyState, "READY", "el deployment está READY");
  assert.ok(String((d.json.meta as Cfg)?.githubCommitSha ?? "").startsWith(String(r.tCommit)), `sobre el commit de T declarado (${r.tCommit})`);
  assert.equal(d.json.projectId, hub.vercelProjectId, "del proyecto de Vercel del cliente");
});
