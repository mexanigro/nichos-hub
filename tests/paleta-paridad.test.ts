// CONEXION-06 (A3, D-69): `src/lib/palette.ts` y `src/lib/oklab.ts` viven en los dos repos. T es el original (la web que se
// despliega sola) y H la copia byte a byte que usan la casilla de paleta y `validatePalette` (H se despliega solo y no puede importar
// de T). Este guard es el que impide que las dos se separen en silencio.
//
// Paridad EN REPOSO (patrón D-61 de `tests/verdad-02-c.test.ts`): mientras hay una orden viva en cualquiera de los dos repos el
// circuito avanza repo por repo (el verde de B en uno antes que el rojo de A en el otro) y las copias difieren a propósito: se difiere
// la exigencia con un diagnóstico y se pasa. Con todo retirado vuelve a exigir bytes iguales nombrando el archivo que difiere.
// Las dos raíces salen de `tools/_git.mjs` (`HIGIENE_ROOTS=<T>;<H>` las sustituye sólo para probar contra repos temporales).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

/** Las dos copias que tienen que ser idénticas (rutas relativas a la raíz de cada repo). */
const COPIAS = ["src/lib/palette.ts", "src/lib/oklab.ts"];

/** Órdenes vivas de una raíz: carpetas `tests/orden/<id>/` con HOJA.md y sin línea «- <id> · aprobada» en su APROBADAS.md. */
function ordenesVivas(raiz: string): string[] {
  const dir = resolve(raiz, "tests", "orden");
  let aprobadas = "";
  try { aprobadas = readFileSync(join(dir, "APROBADAS.md"), "utf8"); } catch { /* sin APROBADAS.md: ninguna retirada */ }
  let entradas: string[] = [];
  try { entradas = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name); } catch { return []; }
  return entradas
    .filter((id) => existsSync(join(dir, id, "HOJA.md")))
    .filter((id) => !new RegExp(`^- ${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} · aprobada`, "m").test(aprobadas));
}

test("src/lib/palette.ts y src/lib/oklab.ts son idénticos byte a byte en T y en H (paridad en reposo: con una orden viva en cualquiera de los dos se difiere y se avisa)", async (t) => {
  const { ROOTS } = (await import("../tools/_git.mjs")) as { ROOTS: string[] };
  const [propio, hermano] = ROOTS;
  assert.ok(hermano && hermano.replace(/\\/g, "/").toLowerCase() !== propio.replace(/\\/g, "/").toLowerCase(), `las dos raíces deben ser repos distintos (${propio} / ${hermano})`);
  const vivas = [...new Set([...ordenesVivas(propio), ...ordenesVivas(hermano)])].sort();
  if (vivas.length) { t.diagnostic(`paridad de palette/ diferida: orden viva ${vivas.join(", ")}`); return; }
  for (const f of COPIAS) {
    const a = readFileSync(resolve(propio, f));
    const b = readFileSync(resolve(hermano, f));
    assert.ok(a.length > 0, `${f} no puede estar vacío`);
    assert.ok(a.equals(b), `${f} difiere byte a byte entre ${propio} y ${hermano} (${a.length} vs ${b.length} bytes)`);
  }
});
