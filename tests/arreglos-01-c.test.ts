// ARREGLOS-01 · copia promovida (ARREGLOS-02, 2026-09-25, D-113). La orden quedó aprobada por Liam el 2026-09-25
// (T d026b0f · H 951932c) y su carpeta de la orden está congelada; esto es la copia editable que corre `npm test` todos los días.
// Recorte: entera; corre la copia promovida de E2E-01, que ya va recortada sin red.
// ARREGLOS-01 · E3 (H) · la etiqueta «(LOGO-01)» sólo para una diferencia de convención. Sesión A (2026-09-25): test rojo — la
// copia promovida `tests/e2e-01-b.test.ts` todavía no existe.
//
// D-112 (medido). `tests/orden/e2e-01/b.test.ts:129` emite el diagnóstico cuando el valor no coincide «por valor» aunque coincida
// por contenido. La url de Storage lleva el `clientId` —`clients/<id>/media/<rol>/<nombre>`— y el `clientId` de una web creada
// desde la ficha NUNCA es el de la plantilla, así que el diagnóstico sale también en `hero.video` y en
// `sections.services.images`, que siguen exactamente la misma convención que el fixture. Lo que LOGO-01 nombra es otra cosa: la
// casilla de logo guarda en otra ruta (`clients/<id>/logo-light-bg.png`) y con otra clase de token (UUID contra sha256).
//
// Qué mide este test: la copia PROMOVIDA (la que corre `npm test` todos los días), no la orden congelada. La copia va recortada
// (D-105): sin Firestore y sin los GET a Storage, comparando en local el fixture contra una copia suya con el `clientId` cambiado
// y con el logo en la ruta y el token viejos. Las dos direcciones son suyas; aquí se comprueba el resultado: corre sin red, sale
// verde, y etiqueta las dos claves del logo y ninguna de las otras dos. Sólo en H (inciso n).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { COPIA_B, ETIQUETA_LOGO, ROOT, correrLargo, diagnosticosTap, fuente } from "./orden/arreglos-01/_comun.ts";

/** Las dos claves que SÍ cambian de convención (la casilla de logo, D-110) y las dos que NO (sólo cambia el clientId). */
const ETIQUETADAS = ["brand.logo", "brand.logoDark"];
const NO_ETIQUETADAS = ["hero.video", "sections.services.images"];
/** Lo que una copia recortada no puede hacer: salir a la red ni leer Firestore (D-89, D-95, D-105). */
const RED = ["leerDoc(", "fetch(", "vercel(", "traer("];

test("la copia promovida tests/e2e-01-b.test.ts corre sin salir a la red y su diagnóstico etiqueta «(LOGO-01)» `brand.logo` y `brand.logoDark`, que cambian de ruta y de clase de token, y no `hero.video` ni `sections.services.images`, donde lo único que cambia en la url es el `clientId`", () => {
  // (1) La copia existe. Hoy no: aquí es donde esta orden está en rojo.
  assert.ok(existsSync(resolve(ROOT, COPIA_B)), `no existe ${COPIA_B}: E2E-01 todavía no está promovida (D-105)`);
  const src = fuente(COPIA_B);

  // (2) Y va recortada: una copia que corre en cada `npm test` no sale a la red ni lee Firestore.
  for (const afuera of RED) assert.ok(!src.includes(afuera), `${COPIA_B} no puede usar «${afuera}»: una copia promovida no sale a la red (D-89, D-95)`);

  // (3) Corre, sale verde, y sus diagnósticos dicen exactamente lo que la convención dice.
  const r = correrLargo(["--experimental-strip-types", "--test", "--test-reporter=tap", COPIA_B], { env: { NODE_TEST_CONTEXT: undefined } });
  assert.equal(r.status, 0, `${COPIA_B} debe salir 0 (salió ${r.status})\n${r.out.slice(-3000)}`);
  const diag = diagnosticosTap(r.stdout).filter((l) => l.includes(ETIQUETA_LOGO));
  assert.ok(diag.length, `${COPIA_B} debe seguir emitiendo el diagnóstico «(${ETIQUETA_LOGO})»: la diferencia de convención queda visible, no escondida\n${r.stdout.slice(-2500)}`);
  for (const clave of ETIQUETADAS) {
    assert.ok(diag.some((l) => l.includes(clave)), `«${clave}» cambia de ruta y de clase de token: tiene que salir etiquetada (${ETIQUETA_LOGO})\n  ${diag.join("\n  ")}`);
  }
  for (const clave of NO_ETIQUETADAS) {
    assert.ok(!diag.some((l) => l.includes(clave)), `«${clave}» sigue la misma convención que el fixture y sólo cambia el clientId de la url: no puede salir etiquetada (${ETIQUETA_LOGO})\n  ${diag.join("\n  ")}`);
  }
});
