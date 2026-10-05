/**
 * desde-plantilla.ts — PLANTILLA-01 (D-256, inciso y). La consola de `desdePlantilla` (src/lib/desde-plantilla.ts): una web de
 * peluquería ya creada por el alta toma de la plantilla A o C el diseño y los textos, con su material copiado a su Storage, sin la
 * identidad, el equipo ni las reseñas de la plantilla. EN SECO por defecto (lee e imprime el plan: no baja, no sube, no escribe);
 * escribe sólo con --aplicar, por la lógica del PUT (guardarConfig).
 *
 *   node --experimental-strip-types scripts/desde-plantilla.ts --plantilla a --id <clientId>
 *   node --experimental-strip-types scripts/desde-plantilla.ts --plantilla a --id <clientId> --aplicar
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { desdePlantilla, type BucketCopia } from "../src/lib/desde-plantilla.ts";
import { lineasDeAvisos } from "../src/lib/avisos-preset.ts";
import type { DbMinima } from "../src/lib/guardar-config.ts";

const argv = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const plantilla = arg("plantilla"), id = arg("id"), aplicar = argv.includes("--aplicar");
if (!plantilla || !id) { console.error("uso: desde-plantilla --plantilla a|c --id <clientId> [--aplicar]"); process.exit(2); }

// Sólo las credenciales de Firebase de .env.local (nada más entra al proceso).
for (const linea of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8").split(/\r?\n/)) {
  const t = linea.trim(), i = t.indexOf("=");
  if (!t || t.startsWith("#") || i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (/^(NEXT_PUBLIC_)?FIREBASE_/.test(k)) process.env[k] ??= v;
}
const { db, getStorageBucket } = await import("../src/lib/firebase-admin.ts");

const inicio = Date.now();
try {
  const r = await desdePlantilla({ clientId: id, plantilla, aplicar }, { db: db as unknown as DbMinima, bucket: getStorageBucket() as unknown as BucketCopia });
  console.log(`desde-plantilla ${plantilla} → ${id} · ${aplicar ? "APLICADO" : "EN SECO (nada escrito; repetir con --aplicar)"}`);
  console.log(`material: ${r.material.length} archivos ${aplicar ? "copiados" : "a copiar"}`);
  for (const m of r.material) console.log(`  ${m.de} → ${m.a}`);
  console.log(`textos que nombraban a la plantilla, vacíos (los escribe la consola de textos): ${r.vaciados.length}`);
  for (const v of r.vaciados) console.log(`  ${v}`);
  for (const l of lineasDeAvisos(r.avisos)) console.log(l);
  console.log(`escrito: ${r.escrito ? "sí (config/" + id + " + material)" : "no"} · ${((Date.now() - inicio) / 1000).toFixed(1)} s`);
  process.exit(0);
} catch (err) {
  console.error(`desde-plantilla: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
