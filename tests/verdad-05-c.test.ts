// VERDAD-05 · C (H) · scripts/b4-tenant.ts con --id/--fixture y prefijo obligatorio «test-b4-peluqueria». Sesión A (2026-09-21): test rojo
// (hoy el script ignora --id y fija CLIENT_ID). Caja negra: `node --experimental-strip-types scripts/b4-tenant.ts show …` con spawnSync y
// lectura del fuente. SÓLO `show` (lectura de Firestore) y un --id rechazado: NUNCA `create` ni `archive` (hoy operarían sobre el tenant real).
// CONEXION-01 D2 (2026-09-21): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el original
// en tests/orden/verdad-05/ queda congelado).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, correr } from "./orden/verdad-05/_util.ts";

const SCRIPT = "scripts/b4-tenant.ts";
const show = (...extra: string[]) => correr(["--experimental-strip-types", SCRIPT, "show", ...extra]);

test("scripts/b4-tenant.ts acepta create|archive|show --id <id> [--fixture <ruta>]: con --fixture, `create` escribe config/{id} desde ese JSON (más hub_clients demo y clients, sin token de cobro ni nextChargeAt); sin --id sigue siendo test-b4-peluqueria; un --id que no empieza por «test-b4-peluqueria» se rechaza con exit 2 antes de tocar Firestore; `show --id test-b4-peluqueria` imprime los tres documentos", () => {
  // El fuente: acepta --id y --fixture, y el chequeo del prefijo va ANTES de la llamada a initializeApp( (no del import).
  // Sobre el fuente entero se afirma con assert.ok(re.test(…)) para no volcarlo en el mensaje de fallo.
  const src = readFileSync(resolve(ROOT, SCRIPT), "utf8");
  assert.ok(/--fixture/.test(src), "el fuente acepta --fixture");
  assert.ok(/--id/.test(src), "el fuente acepta --id");
  const llamada = src.search(/^[ \t]*(const\s+\w+\s*=\s*)?initializeApp\(/m);
  assert.ok(llamada >= 0, "el fuente llama a initializeApp(");
  const chequeo = src.search(/startsWith\(\s*["']test-b4-peluqueria["']\s*\)|\/\^test-b4-peluqueria/);
  assert.ok(chequeo >= 0, "el fuente comprueba el prefijo «test-b4-peluqueria» del --id (startsWith o /^test-b4-peluqueria…/)");
  assert.ok(chequeo < llamada, `el chequeo del prefijo (pos ${chequeo}) va antes de initializeApp( (pos ${llamada})`);
  // show --id test-b4-peluqueria → 0 con los tres documentos (lectura).
  const conId = show("--id", "test-b4-peluqueria");
  assert.equal(conId.status, 0, `show --id test-b4-peluqueria debe salir 0 (salió ${conId.status})\n${conId.out.slice(-2000)}`);
  for (const doc of ["hub", "client", "config"]) assert.match(conId.stdout, new RegExp(`^## ${doc} \\(existe\\)$`, "m"), `show imprime «## ${doc} (existe)»\n${conId.stdout.slice(0, 600)}`);
  // sin --id sigue siendo test-b4-peluqueria: la misma salida.
  const sinId = show();
  assert.equal(sinId.status, 0, `show sin --id debe salir 0 (salió ${sinId.status})`);
  assert.equal(sinId.stdout, conId.stdout, "show sin --id imprime lo mismo que show --id test-b4-peluqueria");
  // --id fuera del prefijo: exit 2 con el mensaje de rechazo, sin imprimir documentos (no tocó Firestore).
  const no = show("--id", "no-autorizado");
  assert.equal(no.status, 2, `show --id no-autorizado debe salir 2 (salió ${no.status})\n${no.out.slice(-2000)}`);
  assert.match(no.out, /no-autorizado/, "el rechazo nombra el id rechazado");
  assert.match(no.out, /test-b4-peluqueria/, "el rechazo nombra el prefijo exigido");
  assert.doesNotMatch(no.stdout, /^## (hub|client|config)/m, `con un --id rechazado no se imprime ningún documento\n${no.stdout.slice(0, 600)}`);
  assert.doesNotMatch(no.out, /"status"/, "con un --id rechazado no sale ningún dato de Firestore");
});
