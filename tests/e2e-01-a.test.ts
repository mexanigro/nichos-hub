// E2E-01 · copia promovida (ARREGLOS-01, 2026-09-25, D-105). La orden quedó aprobada por Liam el 2026-09-25
// (T c4faa5d · H 0c6d3e0) y su carpeta de la orden está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: sólo la mitad de árbol de A1 — el registro declara las dos webs con sus campos —; el documento de Firestore y la API
// de Vercel salen, porque una copia promovida no sale a la red ni lee Firestore (D-89, D-95, D-105).
//
// E2E-01 · A (H) · las dos webs existen y salieron del alta del hub, no de un script.
// D-99 (inciso l): una web creada en producción NO es estado del árbol, así que la sesión B escribió el registro
// `tests/e2e-01-webs.json` en el árbol. Lo que sigue vigilando esta copia es ese registro: que las dos webs estén declaradas con
// todos sus campos, con el slug que genera el alta del hub (D-98: `demo-<slug>-<8 hex>`, no uno elegido) y con el dominio y el
// commit que la comparación de T necesita para construir la referencia. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { CAMPOS_WEB, PALETAS, PREFIJO_SLUG, RAIZ_H, ROOT, WEBS, registro, web } from "./orden/e2e-01/_comun.ts";

test("tests/e2e-01-webs.json declara las dos webs (paletas a y c) con `clientId` que empieza por `demo-`, `hubDocId`, `vercelProjectId`, `domain` = `<clientId>.arzac.studio`, `deploymentId`, `commitSha` y `paleta`", () => {
  const reg = registro();
  assert.equal(reg.webs.length, PALETAS.length, `${WEBS} declara una web por paleta (hay ${reg.webs.length})`);

  for (const p of PALETAS) {
    const w = web(reg, p);
    for (const campo of CAMPOS_WEB) {
      assert.equal(typeof (w as unknown as Record<string, unknown>)[campo], "string", `${WEBS} · ${p}: «${campo}» es un string (hay ${JSON.stringify((w as unknown as Record<string, unknown>)[campo])})`);
      assert.ok(String((w as unknown as Record<string, unknown>)[campo]).trim(), `${WEBS} · ${p}: «${campo}» no está vacío`);
    }
    assert.ok(w.clientId.startsWith(PREFIJO_SLUG), `${p}: el clientId lo genera el alta del hub y empieza por «${PREFIJO_SLUG}» (hay «${w.clientId}»)`);
    assert.equal(w.domain, `${w.clientId}.arzac.studio`, `${p}: el dominio es <clientId>.arzac.studio`);
    assert.match(w.commitSha, /^[0-9a-f]{40}$/, `${p}: commitSha es un sha completo (hay «${w.commitSha}»)`);
  }
  assert.equal(resolve(ROOT), resolve(RAIZ_H), "precondición: esta copia corre en H");
});
