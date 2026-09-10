/**
 * Guard de los caminos que acreditan un pago Cardcom.
 *
 * Por que un guard sobre el codigo y no un test del handler: los route handlers
 * de Next no se pueden importar bajo el runner del repo (`next/server` no
 * resuelve fuera del bundler: ERR_MODULE_NOT_FOUND), y el repo no tiene mocks de
 * modulos. Lo que si se puede garantizar sin mocks es el cableado: TODO archivo
 * que consume verifyPayment() tiene que pasar por checkPaymentTerminal() antes
 * de escribir la acreditacion en Firestore. Si mañana aparece un tercer camino
 * que acredita, este test lo caza.
 *
 * El comportamiento del check (que rechaza sandbox en prod, mismatch, etc.)
 * esta testeado en cardcom.test.ts.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../", import.meta.url));

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

/** Archivos que CONSUMEN verifyPayment (cardcom.ts lo define, no cuenta). */
const creditPaths = walk(SRC)
  .map((file) => ({ file, source: readFileSync(file, "utf8") }))
  .filter(
    ({ source }) =>
      source.includes("verifyPayment(") &&
      !source.includes("export async function verifyPayment("),
  )
  .map(({ file, source }) => ({
    rel: relative(SRC, file).split(sep).join("/"),
    source,
  }))
  .sort((a, b) => a.rel.localeCompare(b.rel));

test("se detectan los caminos conocidos que acreditan un pago Cardcom", () => {
  assert.deepEqual(
    creditPaths.map((p) => p.rel),
    ["app/api/cardcom/verify-payment/route.ts", "lib/cardcom-promote.ts"],
    "cambio la lista de caminos que consumen verifyPayment — revisar el guard",
  );
});

for (const { rel: relPath, source } of creditPaths) {
  test(`${relPath}: valida el terminal antes de acreditar`, () => {
    const verifyIdx = source.indexOf("verifyPayment(");
    const checkIdx = source.indexOf("checkPaymentTerminal(");

    assert.notEqual(
      checkIdx,
      -1,
      `${relPath} consume verifyPayment() pero nunca llama a checkPaymentTerminal(): ` +
        "un cobro del terminal de prueba se acreditaria como real",
    );
    assert.ok(
      checkIdx > verifyIdx,
      `${relPath}: el check tiene que consumir el resultado del verify, no correr antes`,
    );

    // La acreditacion (marcar paid / activar cliente) vive en una transaccion
    // en los dos caminos. El check va antes: fail closed sin escritura previa.
    const writeIdx = source.indexOf("runTransaction(");
    if (writeIdx !== -1) {
      assert.ok(
        checkIdx < writeIdx,
        `${relPath}: escribe la acreditacion antes de validar el terminal`,
      );
    }
  });
}
