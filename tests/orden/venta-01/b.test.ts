// VENTA-01 · B1 (H) · el alta y el Redeploy de la ficha mandan las variables del link a Vercel (D-265). Sesión A (2026-10-06): test rojo.
//
// Medido (D-265): el alta (`/api/clients/provision` → `deployToVercel`, `src/lib/deploy.ts:94-120`) sube las variables del proyecto y
// pide el deployment; el botón «Redeploy» de la ficha (`/api/clients/redeploy`) sólo pide un deployment nuevo de main (`route.ts:28-41`)
// y NO toca ninguna variable, así que el nombre que la clienta tiene hoy nunca llegaría al link de una web ya creada. Lo arregla una
// función con el fetch de Vercel inyectado, `redesplegar`, que la ruta llama: sube con upsert lo que da `variablesDeDeploy` y recién
// después pide el deployment; si Vercel rechaza una variable, no hay deployment (falla cerrado, como el alta: `deploy-flow.ts:61-67`).
// Caja negra: `import()` dinámico de `src/lib/variables-deploy.ts` con un fetch falso (npm test no sale a la red) y lectura de la ruta
// y de `deploy.ts` (que importan firebase-admin y no se pueden cargar sin credenciales).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fuente, importarModulo, type Cfg } from "./_comun.ts";

const MODULO = "src/lib/variables-deploy.ts";
const RUTA = "src/app/api/clients/redeploy/route.ts";
const DEPLOY = "src/lib/deploy.ts";
const HUB = { clientId: "demo-x", niche: "peluqueria", businessName: "Salón del alta", vercelProjectId: "prj_x", vercelProjectName: "demo-x" };
const CONFIG: Cfg = { language: "he", brand: { name: "Salón Noga", tagline: "Color y rizos", description: "Un salón chico." } };
type Llamada = { ruta: string; metodo: string; cuerpo: any };

function vercelFalso(respuestas: { env?: { status: number; body: Cfg }; deploy?: { status: number; body: Cfg } } = {}) {
  const llamadas: Llamada[] = [];
  const fetchVercel = async (ruta: string, init: RequestInit = {}) => {
    llamadas.push({ ruta, metodo: String(init.method ?? "GET"), cuerpo: init.body ? JSON.parse(String(init.body)) : undefined });
    const r = ruta.includes("/env") ? respuestas.env ?? { status: 201, body: { created: [], failed: [] } } : respuestas.deploy ?? { status: 200, body: { id: "dpl_nuevo" } };
    return new Response(JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json" } });
  };
  return { llamadas, fetchVercel };
}

test("el alta y el Redeploy de la ficha mandan esas variables a Vercel: deploy.ts las suma a las del alta con variablesDeDeploy; redesplegar las sube a /v10/projects/<id>/env con upsert y recién después pide el deployment, sin deployment si Vercel rechaza una variable y sin subir nada cuando no hay ninguna; y la ruta /api/clients/redeploy lee config/{id} y redespliega por redesplegar, sin pedir el deployment por su cuenta", async () => {
  // (1) El módulo. Hoy no existe: aquí está el rojo.
  assert.ok(existe(MODULO), `falta ${MODULO} (D-265): hoy el Redeploy de la ficha no toca ninguna variable y el alta no manda las del link`);
  const { variablesDeDeploy, redesplegar } = await importarModulo(MODULO);
  assert.equal(typeof redesplegar, "function", `${MODULO} exporta redesplegar`);

  // (2) Con variables: primero el upsert con exactamente lo que da variablesDeDeploy, después el deployment de main en producción.
  const ok = vercelFalso();
  const r = await redesplegar({ hub: HUB, config: CONFIG, templateRepo: "mexanigro/Barber-shop-template", fetchVercel: ok.fetchVercel });
  assert.deepEqual(ok.llamadas.map((l) => `${l.metodo} ${l.ruta}`), ["POST /v10/projects/prj_x/env?upsert=true", "POST /v13/deployments"], "upsert de las variables y después el deployment, en ese orden");
  assert.deepEqual(ok.llamadas[0].cuerpo, variablesDeDeploy(CONFIG, HUB), "el upsert lleva exactamente lo que da variablesDeDeploy");
  const d = ok.llamadas[1].cuerpo;
  assert.equal(d.project, "prj_x", "el deployment es del proyecto del cliente");
  assert.equal(d.target, "production", "en producción");
  assert.deepEqual(d.gitSource, { type: "github", org: "mexanigro", repo: "Barber-shop-template", ref: "main" }, "de main del template");
  assert.equal(r.ok, true, "sale bien");
  assert.equal(r.deploymentId, "dpl_nuevo", "devuelve el id del deployment");

  // (3) Vercel rechaza una variable (HTTP no 2xx o `failed`): no hay deployment.
  for (const env of [{ status: 400, body: { error: { code: "bad" } } }, { status: 201, body: { failed: [{ error: { key: "VITE_BRAND_NAME" } }] } }]) {
    const mal = vercelFalso({ env });
    const rm = await redesplegar({ hub: HUB, config: CONFIG, templateRepo: "mexanigro/Barber-shop-template", fetchVercel: mal.fetchVercel });
    assert.equal(rm.ok, false, `Vercel responde ${env.status} ${JSON.stringify(env.body)}: no sale bien`);
    assert.equal(rm.stage, "env", "falla en las variables");
    assert.ok(!mal.llamadas.some((l) => l.ruta.startsWith("/v13/deployments")), "y no pide ningún deployment (falla cerrado)");
  }

  // (4) Sin variables (otro nicho): no sube nada y redespliega como hoy.
  const flota = vercelFalso();
  const rf = await redesplegar({ hub: { ...HUB, niche: "barberia" }, config: CONFIG, templateRepo: "mexanigro/Barber-shop-template", fetchVercel: flota.fetchVercel });
  assert.deepEqual(flota.llamadas.map((l) => `${l.metodo} ${l.ruta}`), ["POST /v13/deployments"], "un nicho de la flota: sólo el deployment, ninguna variable");
  assert.equal(rf.ok, true, "y sale bien");

  // (5) Un deployment que Vercel rechaza: no sale bien.
  const caido = vercelFalso({ deploy: { status: 500, body: {} } });
  const rc = await redesplegar({ hub: HUB, config: CONFIG, templateRepo: "mexanigro/Barber-shop-template", fetchVercel: caido.fetchVercel });
  assert.equal(rc.ok, false, "Vercel rechaza el deployment: no sale bien");
  assert.equal(rc.stage, "deployment", "falla en el deployment");

  // (6) La ruta del Redeploy: lee config/{id} y redespliega por redesplegar, sin pedir el deployment por su cuenta.
  const ruta = fuente(RUTA);
  assert.match(ruta, /\bredesplegar\(/, `${RUTA} llama a redesplegar`);
  assert.match(ruta, /collection\(\s*["']config["']\s*\)/, `${RUTA} lee config/{id} (de ahí salen el nombre, la línea, la descripción y la imagen)`);
  assert.ok(!ruta.includes("/v13/deployments"), `${RUTA} ya no pide el deployment por su cuenta`);

  // (7) El alta: deploy.ts suma variablesDeDeploy a las variables del proyecto.
  const deploy = fuente(DEPLOY);
  assert.match(deploy, /from\s+["'](@\/lib|\.)\/variables-deploy(\.ts)?["']/, `${DEPLOY} importa variables-deploy`);
  assert.match(deploy, /envVars\.push\(\s*\.\.\.variablesDeDeploy\(/, `${DEPLOY} suma variablesDeDeploy(…) a envVars, que el alta sube antes del deployment`);
});
