// VENTA-01 · W1 (H, webs) · la prueba: el Redeploy de la demo de PLANTILLA-01 sirve el link con su nombre (D-268). Sesión A
// (2026-10-06): test rojo.
//
// Medido (D-264, 2026-10-06): https://demo-demo-plantilla-a-f87b89e8.arzac.studio/ sirve «Studio Noa — תספורת, צבע ופן — ברמת גן» en
// <title> y og:title y una foto de Unsplash en og:image, y su proyecto de Vercel no tiene ninguna VITE_BRAND_* ni VITE_OG_IMAGE. La
// sesión B le carga a la demo una «OG Image» por la casilla (en su Storage) y la redespliega con el código nuevo: la ficha de producción
// usa el deploy que esté desplegado en Railway (hoy H 4b0bc93, que no manda estas variables), así que el Redeploy de esta prueba lo hace
// B desde el hub local con su login, o Liam despliega H antes; B lo pregunta (inciso w). El registro `tests/venta-01-demo.json` lo
// escribe B.
// Lee Firestore, la API de Vercel y la web (en LECTURA): lleva la marca «, webs» (D-151, inciso s); `rojo-verde --todas` no la corre en
// HEAD. Primera aserción barata y del árbol (inciso l): el registro no existe en el rojo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AJENO, DEMO, ROOT, dbReal, existe, importarModulo, link, vercel, type Cfg, type Variable } from "./_comun.ts";

const REGISTRO = "tests/venta-01-demo.json";

test("el Redeploy de la demo de PLANTILLA-01 (demo-demo-plantilla-a-f87b89e8): tests/venta-01-demo.json declara el deployment; está READY en producción y es del proyecto de la demo; el proyecto tiene en Vercel las variables que da variablesDeDeploy para su config, con brand.ogImage cargada por la casilla en el Storage de la demo; y la web sirve un HTML cuyo title y og:title son su nombre y su línea, cuyo og:description es su descripción y cuyo og:image es su brand.ogImage, sin «Studio Noa» ni Ramat Gan en ningún idioma", async () => {
  // (1) El registro. Hoy no existe: aquí está el rojo.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO}: la demo no se redesplegó con su nombre (D-268)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as Cfg;
  assert.equal(r.clientId, DEMO, `el registro es de la demo de PLANTILLA-01 (${DEMO})`);
  assert.match(String(r.deploymentId ?? ""), /^dpl_/, "el registro declara el deployment del Redeploy");

  // (2) Firestore: la demo, su nombre, su línea, su descripción y su OG Image en su Storage.
  const db = await dbReal();
  const hubs = await db.collection("hub_clients").where("clientId", "==", DEMO).limit(2).get();
  assert.equal(hubs.size, 1, `hub_clients tiene un documento con clientId ${DEMO}`);
  const hub = hubs.docs[0].data() as Cfg;
  const config = (await db.collection("config").doc(DEMO).get()).data() as Cfg;
  const b = config.brand ?? {};
  for (const k of ["name", "tagline", "description"]) assert.ok(String(b[k] ?? "").trim(), `config/${DEMO} tiene brand.${k}`);
  assert.match(String(b.ogImage ?? ""), new RegExp(`^https://firebasestorage\\.googleapis\\.com/v0/b/[^/]+/o/clients%2F${DEMO}%2F`), "brand.ogImage está cargada por la casilla, en el Storage de la demo");

  // (3) Vercel, por ESTADO: el deployment READY en producción, del proyecto de la demo, y sus variables las de variablesDeDeploy.
  const d = await vercel(`/v13/deployments/${encodeURIComponent(r.deploymentId)}`);
  assert.equal(d.status, 200, `la API de Vercel encuentra el deployment ${r.deploymentId}`);
  assert.equal(d.json.readyState, "READY", "el deployment está READY");
  assert.equal(d.json.target, "production", "en producción");
  assert.equal(d.json.projectId, hub.vercelProjectId, "del proyecto de Vercel de la demo");
  const { variablesDeDeploy } = await importarModulo("src/lib/variables-deploy.ts");
  const esperadas = variablesDeDeploy(config, hub) as Variable[];
  assert.deepEqual(esperadas.map((v) => v.key).sort(), ["VITE_BRAND_DESCRIPTION", "VITE_BRAND_NAME", "VITE_BRAND_TAGLINE", "VITE_OG_IMAGE"], "la demo da las cuatro variables del link");
  const envs = ((await vercel(`/v9/projects/${hub.vercelProjectId}/env`)).json.envs ?? []) as Cfg[];
  for (const v of esperadas) {
    const e = envs.find((x) => x.key === v.key && (x.target ?? []).includes("production"));
    assert.ok(e, `el proyecto tiene ${v.key} en production`);
    assert.equal(e!.value, v.value, `${v.key} en Vercel es lo que da variablesDeDeploy`);
  }
  assert.ok(new Date(d.json.createdAt).getTime() >= Math.max(...envs.filter((x) => esperadas.some((v) => v.key === x.key)).map((x) => Number(x.updatedAt ?? x.createdAt ?? 0))), "el deployment se pidió después de subir las variables (si no, el build no las tiene)");

  // (4) La web: el link con su nombre, su línea, su descripción y su imagen; nada de «Studio Noa» ni de Ramat Gan.
  const res = await fetch(`https://${DEMO}.arzac.studio/`, { signal: AbortSignal.timeout(20000), headers: { "Cache-Control": "no-cache" } });
  assert.equal(res.status, 200, "la web responde 200");
  const html = await res.text();
  const l = link(html);
  const esperado = `${String(b.name).replace(/\s+/g, " ").trim()} — ${String(b.tagline).replace(/\s+/g, " ").trim()}`;
  assert.equal(l.heads, 1, "un solo <head>");
  assert.equal(l.title, esperado, "el <title> es su nombre y su línea");
  assert.equal(l.ogTitle, esperado, "og:title es su nombre y su línea");
  assert.equal(l.ogDescription, String(b.description).replace(/\s+/g, " ").trim(), "og:description es su descripción");
  assert.equal(l.ogImage, b.ogImage, "og:image es su brand.ogImage");
  for (const ajeno of AJENO) assert.ok(!html.includes(ajeno), `el HTML de la demo no dice «${ajeno}»`);
});
