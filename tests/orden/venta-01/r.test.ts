// VENTA-01 · R1 (H) · retiro de PLANTILLA-01 (D-270): promovida a npm test como copias editables, con su carpeta congelada desde el
// último rojo. Sesión A (2026-10-06): test rojo. La línea «- plantilla-01 · aprobada 2026-10-06 · T 3222922 · H 96cef4b» de
// tests/orden/APROBADAS.md de H la escribe A en este mismo commit rojo (precedente D-38/…/D-248): por eso no es una afirmación.
// D-270: se promueven las letras que afirman producto —`a` (A1, A2), `b` (B1, B2), `c` (C1), `d` (D1), `f` (F1), `h` (H1)— enteras
// (ninguna sale a la red: Firestore y Storage en memoria; medido, las seis en 1,5 s), y `w` (W1) SÓLO con lo que se lee del árbol: el
// registro `tests/plantilla-01-demo.json`, sin Firestore ni Vercel. La contradicción de W1 anotada en 4.3.md (exigía `features.*` igual a
// la plantilla y aceptaba ocultar las reseñas, que es `features.showTestimonials` en false) se arregla EN LA COPIA, no en lo congelado:
// su comparación de diseño deja fuera `features.showTestimonials` y `features.showTeam`, los que el inciso z permite cambiar. No `e`
// (E1, registro) ni `g` (G1, retiro de otra orden).
// Caja negra: git del repo real y lectura de las copias. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { matchesGlob, resolve } from "node:path";
import { PLANTILLA_01, ROOT, git } from "./_comun.ts";

const ORDEN = "plantilla-01";
const LETRAS = ["a", "b", "c", "d", "f", "h", "w"];
const CARPETA = `tests/orden/${ORDEN}`;

test("npm test corre las copias de plantilla-01 que esta hoja promueve —a, b, c, d, f, h enteras y w sólo con el registro del árbol, sin leer Firestore ni Vercel y con features.showTestimonials y features.showTeam fuera de su comparación de diseño—, que importan ./orden/plantilla-01/_comun.ts; y tests/orden/plantilla-01/ no cambia desde su último rojo (f6ed7fc)", () => {
  const leer = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
  const copias = LETRAS.map((s) => `tests/${ORDEN}-${s}.test.ts`);
  // (1) Las copias. Hoy no existen: aquí está el rojo.
  for (const c of copias) assert.ok(existsSync(resolve(ROOT, c)), `falta ${c} en H`);
  for (const c of copias) assert.match(leer(c), new RegExp(`from "\\./orden/${ORDEN}/_comun\\.ts"`), `${c} debe importar ./orden/${ORDEN}/_comun.ts`);
  // (2) La `w`, sólo con lo del árbol: el registro, sin Firestore ni Vercel, y sin los dos features del inciso z en el diseño.
  const wc = leer(`tests/${ORDEN}-w.test.ts`);
  assert.ok(wc.includes("tests/plantilla-01-demo.json"), "la copia w lee el registro tests/plantilla-01-demo.json");
  assert.ok(!/\bdbReal\(|\bvercel\(|\bfetch\(|firebase-admin/.test(wc), "la copia w no lee Firestore, ni la API de Vercel, ni la web (una copia promovida no sale a la red)");
  for (const k of ["features.showTestimonials", "features.showTeam"]) assert.ok(wc.includes(k), `la copia w nombra ${k}: lo deja fuera de su comparación de diseño (la contradicción de W1, 4.3.md)`);
  // (3) npm test las corre.
  const scripts = JSON.parse(leer("package.json")).scripts ?? {};
  const nombra = (script: string, archivo: string) => String(script ?? "").split(/\s+/).map((t) => t.replace(/^["']|["']$/g, "")).some((t) => t === archivo || (t.includes("*") && matchesGlob(archivo, t)));
  for (const c of copias) assert.ok(nombra(scripts.test, c), `npm test no corre ${c}`);
  // (4) La carpeta de la orden, congelada desde su último rojo.
  const rojo = git(ROOT, "log", "-1", "--format=%H", "--diff-filter=A", "main", "--", `${CARPETA}/HOJA.md`);
  assert.ok(rojo.startsWith(PLANTILLA_01.rojo.H), `el último rojo de ${ORDEN} en H es ${PLANTILLA_01.rojo.H} (git da ${rojo.slice(0, 7)})`);
  assert.equal(git(ROOT, "log", "--format=%h %s", "--diff-filter=MDR", `${rojo}..main`, "--", `${CARPETA}/`), "", `${CARPETA}/ sigue congelada desde su último rojo`);
});
