// PLANTILLA-01 · copia promovida (VENTA-01, 2026-10-06, D-270) de tests/orden/plantilla-01/w.test.ts. La orden quedó aprobada por Liam
// el 2026-10-06 (T 3222922 · H 96cef4b) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte (D-270): SÓLO el registro del árbol (tests/plantilla-01-demo.json); lo guardado en Firestore, Storage y Vercel lo mira la orden
// congelada (`rojo-verde --orden plantilla-01`): una copia promovida no sale a la red.
// La contradicción de W1 (4.3.md § PLANTILLA-01 · B: exigía `features.*` igual a la plantilla y aceptaba ocultar las reseñas, que es
// `features.showTestimonials` en false) se arregla AQUÍ, no en lo congelado (Liam, 2026-10-05): la comparación de diseño deja fuera
// features.showTestimonials y features.showTeam (los que el inciso z permite cambiar). Como esta copia no lee Firestore, la comparación
// se ejerce sobre el tenant de la plantilla A armado del fixture congelado: con esos dos features cambiados no hay diferencias de diseño;
// con features.showGallery cambiado, sí.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, existe, hojas, leer, porJson, tenantDePlantilla, webs, type Cfg } from "./orden/plantilla-01/_comun.ts";

const REGISTRO = "tests/plantilla-01-demo.json";
const PASOS = ["alta", "desdePlantilla", "ficha", "exportar", "escribir", "aplicar", "redeploy", "revision"];
/** El diseño que la web nueva tiene que tener igual que la plantilla (D-261). */
const DISENO = /^(hero\.variant|hero\.video\.|navbar\.|footer\.|branding\.|palette\.|features\.|activeTheme|splash\.|gallery\.|sections\.[a-z]+\.(variant|surface)$|sections\.gallery\.items\.\d+\.src$|sections\.instagram\.images\.)/;
/** Lo que el inciso z deja cambiar a la clienta: equipo y reseñas pueden ocultarse (D-263). */
const FUERA = new Set(["features.showTestimonials", "features.showTeam"]);

/** Las rutas de diseño de la plantilla que `config` no tiene iguales, sin las dos del inciso z. */
const diferenciasDeDiseno = (tenant: Cfg, config: Cfg) =>
  hojas(tenant).filter(([k]) => DISENO.test(k) && !FUERA.has(k)).filter(([k, v]) => JSON.stringify(leer(config, k)) !== JSON.stringify(v)).map(([k]) => k);

test("el registro del árbol de W1: tests/plantilla-01-demo.json declara un cliente demo nuevo, la plantilla, el commit de T, el deployment y los minutos de cada paso con su total; y la comparación de diseño con la plantilla deja fuera features.showTestimonials y features.showTeam (inciso z) y ve cualquier otro feature", async () => {
  // (1) El registro.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO}: la prueba de punta a punta no se hizo (D-261)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as Cfg;
  const id = String(r.clientId ?? "");
  assert.ok(id && !/^test-b4-peluqueria/.test(id) && id !== "demo-demo-alta-idiomas-f2dfb64e" && !webs().some((x) => x.clientId === id), `un cliente demo nuevo (no una plantilla, ni el de ALTA-IDIOMAS-01, ni una web de E2E): «${id}»`);
  assert.ok(r.plantilla === "a" || r.plantilla === "c", `la plantilla es a o c («${r.plantilla}»)`);
  assert.match(String(r.tCommit ?? ""), /^[0-9a-f]{7,40}$/, "el commit de T desplegado");
  assert.match(String(r.deploymentId ?? ""), /^dpl_/, "el deployment del redeploy");
  const minutos = (r.cronometro ?? {}) as Record<string, number>;
  for (const paso of PASOS) assert.ok(typeof minutos[paso] === "number" && minutos[paso] > 0, `el cronómetro tiene los minutos de «${paso}»`);
  const suma = PASOS.reduce((a, k) => a + minutos[k], 0);
  assert.ok(typeof r.totalMinutos === "number" && Math.abs(r.totalMinutos - suma) <= 1, `el total (${r.totalMinutos}) es la suma de los pasos (${suma})`);

  // (2) La comparación de diseño, en las dos direcciones, sobre el tenant de la plantilla A (fixture congelado).
  const tenant = await tenantDePlantilla("a");
  assert.ok(Object.keys(tenant.features ?? {}).length > 0, "precondición: el tenant de la plantilla tiene features");
  assert.deepEqual(diferenciasDeDiseno(tenant, porJson(tenant)), [], "la plantilla contra sí misma: ninguna diferencia de diseño");
  const sinEquipoNiResenas = porJson(tenant);
  sinEquipoNiResenas.features = { ...sinEquipoNiResenas.features, showTestimonials: false, showTeam: false };
  assert.deepEqual(diferenciasDeDiseno(tenant, sinEquipoNiResenas), [], "ocultar reseñas y equipo (inciso z) no es una diferencia de diseño");
  const sinGaleria = porJson(tenant);
  sinGaleria.features = { ...sinGaleria.features, showGallery: !tenant.features?.showGallery };
  assert.deepEqual(diferenciasDeDiseno(tenant, sinGaleria), ["features.showGallery"], "cualquier otro feature cambiado sí es una diferencia de diseño");
});
