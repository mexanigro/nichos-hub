/**
 * textos.ts — PLANTILLA-01 (D-257, inciso y). Los textos de una web por consola, sin API: los escribe Claude Code.
 *
 *   exportar: lo que hace falta para escribir (por idioma, cada campo vacío con sus límites, el system y los datos de la clienta).
 *     node --experimental-strip-types scripts/textos.ts exportar --id <clientId> [--notas <notas.txt>] [--salida <export.json>]
 *   aplicar: la propuesta `{ <idioma>: { <ruta>: texto } }` por los validadores de la ficha. EN SECO por defecto (dice qué entra y qué
 *   sale como error, y por qué); escribe sólo con --aplicar, por la lógica del PUT (guardarConfig).
 *     node --experimental-strip-types scripts/textos.ts aplicar --id <clientId> --archivo <propuesta.json> [--notas <notas.txt>] [--aplicar]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { aplicarTextos, exportarTextos } from "../src/lib/textos-consola.ts";
import { lineasDeAvisos } from "../src/lib/avisos-preset.ts";
import type { DbMinima } from "../src/lib/guardar-config.ts";

const [modo, ...argv] = process.argv.slice(2);
const arg = (n: string) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
const id = arg("id");
if ((modo !== "exportar" && modo !== "aplicar") || !id || (modo === "aplicar" && !arg("archivo"))) {
  console.error("uso: textos exportar --id <clientId> [--notas <archivo>] [--salida <archivo>]\n     textos aplicar --id <clientId> --archivo <propuesta.json> [--notas <archivo>] [--aplicar]");
  process.exit(2);
}
const notas = arg("notas") ? readFileSync(arg("notas")!, "utf8") : undefined;

// Sólo las credenciales de Firebase de .env.local (nada más entra al proceso).
for (const linea of readFileSync(resolve(import.meta.dirname, "../.env.local"), "utf8").split(/\r?\n/)) {
  const t = linea.trim(), i = t.indexOf("=");
  if (!t || t.startsWith("#") || i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (/^(NEXT_PUBLIC_)?FIREBASE_/.test(k)) process.env[k] ??= v;
}
const db = (await import("../src/lib/firebase-admin.ts")).db as unknown as DbMinima;

try {
  if (modo === "exportar") {
    const exp = await exportarTextos({ clientId: id, notas }, { db });
    const json = JSON.stringify(exp, null, 2);
    if (arg("salida")) writeFileSync(arg("salida")!, json + "\n");
    else console.log(json);
    console.error(`exportar ${id} · ${exp.niche} · base ${exp.base} · ${Object.entries(exp.idiomas).map(([l, x]) => `${l} ${x.campos.length}`).join(" · ") || "nada vacío"}${arg("salida") ? ` → ${arg("salida")}` : ""}`);
    for (const l of lineasDeAvisos(exp.avisos)) console.error(l);
  } else {
    const propuesta = JSON.parse(readFileSync(arg("archivo")!, "utf8"));
    const aplicar = argv.includes("--aplicar");
    const r = await aplicarTextos({ clientId: id, propuesta, notas, aplicar }, { db });
    console.log(`aplicar ${id} · ${aplicar ? "APLICADO" : "EN SECO (nada escrito; repetir con --aplicar)"}`);
    console.log(`entran: ${r.entran.length}`);
    for (const e of r.entran) console.log(`  ✓ ${e}`);
    console.log(`salen: ${r.errores.length}`);
    for (const e of r.errores) console.log(`  ✗ ${e.path} — ${e.message}`);
    for (const l of lineasDeAvisos(r.avisos)) console.log(l);
    console.log(`escrito: ${r.escrito ? "sí" : "no"}`);
  }
  process.exit(0);
} catch (err) {
  console.error(`textos ${modo}: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
