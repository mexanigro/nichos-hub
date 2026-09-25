// E2E-01 · A (H) · las dos webs existen y salieron del alta del hub, no de un script (A1), y están desplegadas de verdad (A2).
// Sesión A (2026-09-24): tests rojos — no existe `tests/e2e-01-webs.json`, porque las dos webs todavía no se crearon.
// D-99 (inciso l): una web creada en producción NO es estado del árbol. Sin una condición que se lea del repo, `rojo-verde` diría
// «nunca estuvo en rojo», porque el mundo de afuera es el mismo en el clon del rojo y en HEAD. Por eso B escribe el registro
// `tests/e2e-01-webs.json` en el árbol y estos tests lo leen PRIMERO y DESPUÉS comprueban contra lo real.
// Todo lo de afuera se LEE: la API de Vercel sólo con GET (`/v13/deployments/{id}`), Firestore con el Admin SDK en lectura y el
// dominio con un GET. Ningún test escribe en Vercel, en Firestore ni en Storage. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import {
  CAMPOS_WEB, NOTAS_SCRIPT, PALETAS, PREFIJO_SLUG, RAIZ_H, ROOT, WEBS,
  envDe, leerDoc, registro, traer, vercel, web,
} from "./_comun.ts";

/** Lo que el alta del hub deja en `hub_clients` y el script no (H:src/lib/provisioning.ts:42–62). */
const ESTADOS = ["demo", "active"];
/** El repo del que Vercel despliega (H:src/lib/deploy.ts:8). */
const REPO_PLANTILLA = "Barber-shop-template";
/** Dos marcas del HTML que sirve el template construido con Vite. */
const DEL_TEMPLATE = [/<div id="root">/, /<script[^>]+type="module"/];

test("tests/e2e-01-webs.json declara las dos webs (paletas a y c) con `clientId` que empieza por `demo-`, `hubDocId`, `vercelProjectId`, `domain` = `<clientId>.arzac.studio`, `deploymentId`, `commitSha` y `paleta`; y para cada una el documento `hub_clients/{hubDocId}` existe en Firestore con esos mismos `clientId`, `domain`, `vercelProjectId` y `deployUrl`, con `status` `demo` o `active`, y con `notes` que NO nombra «tenant de recreación» ni «tenant de prueba»: salieron del alta del hub y no de `scripts/b4-tenant.ts`", async () => {
  // (1) El registro del árbol. Hoy no existe: aquí es donde esta orden está en rojo.
  const reg = registro();
  assert.equal(reg.webs.length, PALETAS.length, `${WEBS} declara una web por paleta (hay ${reg.webs.length})`);

  for (const p of PALETAS) {
    const w = web(reg, p);
    // (2) Los campos que D-99 pide, y el slug que genera el hub (D-98: `demo-<slug>-<8 hex>`, no uno elegido).
    for (const campo of CAMPOS_WEB) {
      assert.equal(typeof (w as unknown as Record<string, unknown>)[campo], "string", `${WEBS} · ${p}: «${campo}» es un string (hay ${JSON.stringify((w as unknown as Record<string, unknown>)[campo])})`);
      assert.ok(String((w as unknown as Record<string, unknown>)[campo]).trim(), `${WEBS} · ${p}: «${campo}» no está vacío`);
    }
    assert.ok(w.clientId.startsWith(PREFIJO_SLUG), `${p}: el clientId lo genera el alta del hub y empieza por «${PREFIJO_SLUG}» (hay «${w.clientId}»)`);
    assert.equal(w.domain, `${w.clientId}.arzac.studio`, `${p}: el dominio es <clientId>.arzac.studio`);
    assert.match(w.commitSha, /^[0-9a-f]{40}$/, `${p}: commitSha es un sha completo (hay «${w.commitSha}»)`);

    // (3) Y el alta del hub lo dejó escrito en hub_clients, con los campos que el script NO deja.
    const hub = await leerDoc("hub_clients", w.hubDocId);
    assert.ok(hub, `hub_clients/${w.hubDocId} existe (la web ${p} salió del alta del hub)`);
    assert.equal(hub.clientId, w.clientId, `${p}: hub_clients.clientId = ${w.clientId}`);
    assert.equal(hub.domain, w.domain, `${p}: hub_clients.domain = ${w.domain}`);
    assert.equal(hub.vercelProjectId, w.vercelProjectId, `${p}: hub_clients.vercelProjectId = el declarado`);
    assert.equal(hub.deployUrl, `https://${w.domain}`, `${p}: hub_clients.deployUrl = https://${w.domain} (lo escribe el alta, no el script)`);
    assert.ok(ESTADOS.includes(String(hub.status)), `${p}: hub_clients.status es ${ESTADOS.join(" o ")} (hay «${String(hub.status)}»)`);
    for (const nota of NOTAS_SCRIPT) {
      assert.ok(!String(hub.notes ?? "").includes(nota), `${p}: hub_clients.notes NO dice «${nota}» (lo escribiría scripts/b4-tenant.ts, que además no toca Vercel)`);
    }
  }
  assert.equal(resolve(ROOT), resolve(RAIZ_H), "precondición: este test corre en H");
});

test("para cada web, la API de Vercel en lectura (`/v13/deployments/{deploymentId}`) da `readyState` `READY`, `meta.githubRepo` `Barber-shop-template` y `meta.githubCommitSha` igual al `commitSha` declarado, que es un commit de `main` de T; y un GET a `https://{domain}/` responde 200 con el HTML del template", async () => {
  const reg = registro();
  const env = envDe(RAIZ_H);
  for (const p of PALETAS) {
    const w = web(reg, p);
    // (1) El deploy, leído de Vercel. Sólo GET.
    const r = await vercel(`/v13/deployments/${w.deploymentId}`, env);
    assert.equal(r.status, 200, `${p}: la API de Vercel da 200 para ${w.deploymentId} (dio ${r.status}: ${JSON.stringify(r.json).slice(0, 300)})`);
    assert.equal(r.json.readyState, "READY", `${p}: el deploy está READY (hay ${JSON.stringify(r.json.readyState)})`);
    const meta = (r.json.meta ?? {}) as Record<string, unknown>;
    assert.equal(meta.githubRepo, REPO_PLANTILLA, `${p}: despliega ${REPO_PLANTILLA} (hay ${JSON.stringify(meta.githubRepo)})`);
    assert.equal(meta.githubCommitSha, w.commitSha, `${p}: el commit desplegado es el que declara ${WEBS}`);
    assert.equal(meta.githubCommitRef ?? "main", "main", `${p}: la rama es main (H:src/lib/deploy-flow.ts:83)`);

    // (2) Y el dominio sirve el HTML del template.
    const html = await traer(`https://${w.domain}/`);
    assert.equal(html.status, 200, `${p}: GET https://${w.domain}/ responde 200 (respondió ${html.status})`);
    assert.match(html.tipo, /text\/html/, `${p}: …y con content-type text/html (respondió «${html.tipo}»)`);
    for (const marca of DEL_TEMPLATE) assert.match(html.cuerpo, marca, `${p}: el HTML es el del template (falta ${marca})`);
  }
});
