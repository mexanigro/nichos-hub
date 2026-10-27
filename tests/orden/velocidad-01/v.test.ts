// VELOCIDAD-01 · V2 (H). Las copias del mecanismo (D-389): tests/verdad-0N-*, tests/contrato-hooks.test.ts y las que corren rojo-verde
// adentro (llaman a una función rojoVerde…( o pasan "rojo-verde.mjs" a un proceso hijo), leídas del disco y no de una lista escrita.
// npm test de H nombra globs: cada lista son los archivos que sus globs encuentran en el disco.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { globSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const LINEA_BASE = "e12c64f";
const archivosDe = (s: unknown) =>
  [...String(s ?? "").matchAll(/"([^"]+\.test\.ts)"/g)].flatMap((m) => globSync(m[1], { cwd: ROOT })).map((f) => f.replace(/\\/g, "/"));
const delMecanismo = (f: string) =>
  /^tests\/verdad-0\d-[a-z]\.test\.ts$/.test(f) || f === "tests/contrato-hooks.test.ts" ||
  (f.startsWith("tests/") && /rojoVerde[A-Za-z]*\(|rojo-verde\.mjs"/.test(readFileSync(resolve(ROOT, f), "utf8")));

test("en package.json de H, test:verdad corre las copias del mecanismo —tests/verdad-0N-*, tests/contrato-hooks.test.ts y las que corren rojo-verde adentro— y npm test ninguna; ningún archivo corre en los dos y juntos son los archivos que npm test corría en e12c64f", () => {
  const s = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")).scripts ?? {};
  assert.ok(s["test:verdad"], "package.json de H no tiene test:verdad (D-389): las copias del mecanismo corren en cada npm test");
  const producto = archivosDe(s.test), verdad = archivosDe(s["test:verdad"]);
  assert.ok(producto.length, "npm test nombra sus archivos con globs entre comillas");
  assert.deepEqual(producto.filter((f) => verdad.includes(f)), [], "ningún archivo corre en los dos");

  const mecanismo = readdirSync(resolve(ROOT, "tests")).filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`).filter(delMecanismo).sort();
  assert.ok(mecanismo.length >= 16, `copias del mecanismo leídas del disco: ${mecanismo.length}`);
  assert.deepEqual([...verdad].sort(), mecanismo, "test:verdad corre exactamente las copias del mecanismo");
  assert.deepEqual(producto.filter(delMecanismo), [], "npm test no corre ninguna copia del mecanismo");

  const antes = JSON.parse(execFileSync("git", ["show", `${LINEA_BASE}:package.json`], { cwd: ROOT, encoding: "utf8", windowsHide: true })).scripts;
  assert.deepEqual([...producto, ...verdad].sort(), [...new Set(archivosDe(antes.test))].sort(), `juntos son los archivos de npm test en ${LINEA_BASE}`);
});
