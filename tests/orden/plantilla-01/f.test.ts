// PLANTILLA-01 · F1 (H) · `next dev` y `next build` ya no reescriben tsconfig.json (D-259). Sesión A (2026-10-05): test rojo.
//
// Medido por A con la función de Next que lo hace (`writeConfigurationDefaults` de next 16.2.9, la que llama `verifyTypeScriptSetup` en dev
// y en build) sobre una copia de tsconfig.json: en los dos modos agrega «.next/dev/types/**/*.ts» al `include` (Next incluye a la vez
// `.next/types` y `.next/dev/types` «para no ensuciar tsconfig al pasar de dev a build»), y el repo queda sucio cada vez (ALTA-IDIOMAS-01-B
// lo devolvió con `git checkout` dos veces). Con esa línea commiteada Next no vuelve a escribir en ninguno de los dos modos (medido).
// Caja negra: la misma función de Next, sobre una COPIA en el directorio temporal (nunca sobre el tsconfig del repo). Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ROOT } from "./_comun.ts";

test("next dev y next build no reescriben tsconfig.json: writeConfigurationDefaults de Next, corrida sobre una copia en modo build (.next) y en modo dev (.next/dev), la deja byte a byte igual", async () => {
  const requerir = createRequire(resolve(ROOT, "package.json"));
  const { writeConfigurationDefaults } = requerir("next/dist/lib/typescript/writeConfigurationDefaults.js") as { writeConfigurationDefaults: (...a: unknown[]) => Promise<void> };
  const ts = requerir("typescript") as { version: string };
  const original = readFileSync(resolve(ROOT, "tsconfig.json"));
  const dir = mkdtempSync(join(tmpdir(), "plantilla-01-tsconfig-"));
  const previo = process.env.NODE_ENV;
  const log = console.log;
  try {
    for (const [modo, distDir] of [["production", ".next"], ["development", ".next/dev"]] as const) {
      const copia = join(dir, `tsconfig-${modo}.json`);
      writeFileSync(copia, original);
      (process.env as Record<string, string | undefined>).NODE_ENV = modo;
      console.log = () => {};
      try { await writeConfigurationDefaults(ts.version, copia, false, true, distDir, false, false); } finally { console.log = log; }
      const despues = readFileSync(copia);
      assert.ok(despues.equals(original), `next (${modo === "production" ? "build" : "dev"}) reescribe tsconfig.json:\n--- antes\n${original.toString("utf8").split(/\r?\n/).slice(-10).join("\n")}\n--- después\n${despues.toString("utf8").split(/\r?\n/).slice(-10).join("\n")}`);
    }
  } finally {
    if (previo === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV; else (process.env as Record<string, string | undefined>).NODE_ENV = previo;
    rmSync(dir, { recursive: true, force: true });
  }
});
