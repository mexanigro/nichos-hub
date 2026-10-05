// PLANTILLA-01 · G1 (H) · retiro de ALTA-IDIOMAS-01 (D-248): promovida a npm test como copias editables, con su carpeta congelada desde
// el último rojo. Sesión A (2026-10-05): test rojo. La línea «- alta-idiomas-01 · aprobada 2026-10-05 · T 3222922 · H 5502f02» de
// tests/orden/APROBADAS.md de H la escribe A en este mismo commit rojo (precedente D-38/D-146/…/D-235): por eso no es una afirmación.
// Lo de T (la línea en su APROBADAS.md y el párrafo en su CLAUDE.md) va con la orden de higiene (Liam, D-249).
// D-260: se promueven las letras que afirman producto —`a` (A1, A2), `b` (B1, B2), `c` (C1), `f` (F1), `g` (G1), `h` (H1), `i` (I1)—
// enteras (ninguna sale a la red: el cliente de Anthropic es falso y Firestore se modela en memoria), y `w` (W1) SÓLO con lo que se lee
// del árbol: el registro `tests/alta-idiomas-01-demo.json`, sin leer Firestore. No `e` (E1, registro).
// Caja negra: git del repo real y lectura de las copias. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { matchesGlob, resolve } from "node:path";
import { ALTA_IDIOMAS_01, ROOT, git } from "./_comun.ts";

const ORDEN = "alta-idiomas-01";
const LETRAS = ["a", "b", "c", "f", "g", "h", "i", "w"];
const CARPETA = `tests/orden/${ORDEN}`;

test("npm test corre las copias de alta-idiomas-01 que esta hoja promueve —a, b, c, f, g, h, i enteras y w sólo con el registro del árbol, sin leer Firestore—, que importan ./orden/alta-idiomas-01/_comun.ts; y tests/orden/alta-idiomas-01/ no cambia desde su último rojo (8dc015c)", () => {
  const leer = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
  const copias = LETRAS.map((s) => `tests/${ORDEN}-${s}.test.ts`);
  // (1) Las copias. Hoy no existen: aquí está el rojo.
  for (const c of copias) assert.ok(existsSync(resolve(ROOT, c)), `falta ${c} en H`);
  for (const c of copias) assert.match(leer(c), new RegExp(`from "\\./orden/${ORDEN}/_comun\\.ts"`), `${c} debe importar ./orden/${ORDEN}/_comun.ts`);
  // (2) La `w`, sólo con lo del árbol: el registro, sin Firestore.
  const wc = leer(`tests/${ORDEN}-w.test.ts`);
  assert.ok(wc.includes("tests/alta-idiomas-01-demo.json"), "la copia w lee el registro tests/alta-idiomas-01-demo.json");
  assert.ok(!/\bleerDoc\(|firebase-admin/.test(wc), "la copia w no lee Firestore (una copia promovida no sale a la red)");
  // (3) npm test las corre.
  const scripts = JSON.parse(leer("package.json")).scripts ?? {};
  const nombra = (script: string, archivo: string) => String(script ?? "").split(/\s+/).map((t) => t.replace(/^["']|["']$/g, "")).some((t) => t === archivo || (t.includes("*") && matchesGlob(archivo, t)));
  for (const c of copias) assert.ok(nombra(scripts.test, c), `npm test no corre ${c}`);
  // (4) La carpeta de la orden, congelada desde su último rojo.
  const rojo = git(ROOT, "log", "-1", "--format=%H", "--diff-filter=A", "main", "--", `${CARPETA}/HOJA.md`);
  assert.ok(rojo.startsWith(ALTA_IDIOMAS_01.rojo.H), `el último rojo de ${ORDEN} en H es ${ALTA_IDIOMAS_01.rojo.H} (git da ${rojo.slice(0, 7)})`);
  assert.equal(git(ROOT, "log", "--format=%h %s", "--diff-filter=MDR", `${rojo}..main`, "--", `${CARPETA}/`), "", `${CARPETA}/ sigue congelada desde su último rojo`);
});
