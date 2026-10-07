// MARCA-01 · P1 (H) · la ficha abierta por el slug pasa al id del documento, y sin window.alert (D-292). Sesión A (2026-10-07): test
// rojo — no existe `rutaDeFicha` y la página usa el id de la url para el Redeploy (`page.tsx:274`) y avisa con `window.alert` (`:284`).
//
// Medido en Ashkelon (`DEMOS-ASHKELON.md` § 1, «Lo que no se pudo», 1): abierta por el slug, la ficha manda el slug como `hubDocId`,
// la API falla y el `alert` congela la pestaña. ARREGLOS-01 (D-111) dejó sólo el GET resolviendo por slug. Liam (2026-10-07): «La
// ficha pasa al id». La página no se puede montar sin el login de owner (D-34): se corre la función pura y se lee el fuente.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fuente, importarModulo, YULIA } from "./_comun.ts";

const PAGINA = "src/app/clients/[clientId]/page.tsx";

test("la ficha abierta por el slug pasa al id del documento: src/lib/hub-clients.ts exporta rutaDeFicha(idDeLaUrl, cliente), que da /clients/<id del documento> cuando la url trae otro id y null cuando ya trae el del documento; la página de la ficha la llama con el cliente que devuelve el GET y hace router.replace a esa ruta; y la ficha no llama a alert: el error del Redeploy y del Reprovision se muestra en un aviso de la página con role=\"alert\"", async () => {
  const { rutaDeFicha } = await importarModulo("src/lib/hub-clients.ts");
  assert.equal(typeof rutaDeFicha, "function", "src/lib/hub-clients.ts exporta rutaDeFicha (D-292)");
  assert.equal(rutaDeFicha(YULIA.clientId, { id: YULIA.hubDoc }), `/clients/${YULIA.hubDoc}`, "abierta por el slug, la ficha pasa al id del documento");
  assert.equal(rutaDeFicha(YULIA.hubDoc, { id: YULIA.hubDoc }), null, "abierta por el id del documento, se queda");
  assert.equal(rutaDeFicha("", { id: YULIA.hubDoc }), `/clients/${YULIA.hubDoc}`, "sin id en la url, también al del documento");

  const src = fuente(PAGINA);
  assert.match(src, /import\s*\{[^}]*\brutaDeFicha\b[^}]*\}\s*from\s*["']@\/lib\/hub-clients["']/, `${PAGINA} importa rutaDeFicha de @/lib/hub-clients`);
  assert.match(src, /rutaDeFicha\(\s*clientId\s*,\s*data[?!]?\.client\b/, `${PAGINA} llama rutaDeFicha(clientId, data.client) con el cliente que devuelve el GET`);
  assert.match(src, /router\.replace\(/, `${PAGINA} hace router.replace a la ruta del documento`);
  const alerts = src.split(/\r?\n/).map((l, i) => [i + 1, l] as const).filter(([, l]) => /\balert\s*\(/.test(l));
  assert.deepEqual(alerts.map(([n, l]) => `${n}: ${l.trim()}`), [], `${PAGINA} no llama a alert (congela la pestaña): el error va a un aviso de la página`);
  assert.match(src, /role=["']alert["']/, `${PAGINA} muestra el error del Redeploy y del Reprovision en un aviso con role="alert"`);
});
