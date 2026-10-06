// SECCIONES-02 · R1 (H) · retiro de VENTA-01 (D-281): promovida a npm test como copias editables, con su carpeta congelada desde su
// rojo. Sesión A (2026-10-06): test rojo. La línea «- venta-01 · aprobada 2026-10-06 · T 3222922 · H fa5674e» de
// tests/orden/APROBADAS.md de H la escribe A en este mismo commit rojo (precedente D-38/…/D-270): por eso no es una afirmación.
// D-281: se promueven las letras que afirman producto —`a` (A1), `b` (B1) enteras (ninguna sale a la red), `g` (G1) SIN el sha256 de la
// guía (Liam la edita por consola: una copia que fija el sha256 caería con cada edición; afirma sus nueve secciones y lo que nombra
// cada una) y `w` (W1) SÓLO con lo que está en el repo (el registro `tests/venta-01-demo.json`, sin Firestore, sin la API de Vercel y
// sin pedir la web). No `e` (E1, registro) ni `r` (R1, retiro de otra orden).
// Caja negra: git del repo real y lectura de las copias. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { matchesGlob, resolve } from "node:path";
import { ROOT, VENTA_01, git } from "./_comun.ts";

const ORDEN = "venta-01";
const LETRAS = ["a", "b", "g", "w"];
const CARPETA = `tests/orden/${ORDEN}`;
const SECCIONES = ["Plantilla A o C", "El logo", "El color (paleta)", "El material de la plantilla", "Lo que se revisa con la clienta", "Si trabaja sola", "Fotos del equipo", "De demo a clienta", "El nombre en el link"];

test("npm test corre las copias de venta-01 que esta hoja promueve —a y b enteras, g con las nueve secciones de la guía y lo que nombra cada una pero sin fijar su sha256, y w sólo con el registro tests/venta-01-demo.json, sin leer Firestore, Vercel ni la web—, que importan ./orden/venta-01/_comun.ts; y tests/orden/venta-01/ no cambia desde su rojo (6c6854b)", () => {
  const leer = (rel: string) => readFileSync(resolve(ROOT, rel), "utf8");
  const copias = LETRAS.map((s) => `tests/${ORDEN}-${s}.test.ts`);
  // (1) Las copias. Hoy no existen: aquí está el rojo.
  for (const c of copias) assert.ok(existsSync(resolve(ROOT, c)), `falta ${c} en H`);
  for (const c of copias) assert.match(leer(c), new RegExp(`from "\\./orden/${ORDEN}/_comun\\.ts"`), `${c} debe importar ./orden/${ORDEN}/_comun.ts`);
  // (2) La `g`: las nueve secciones, sin el sha256 (ni el registro que lo guarda).
  const g = leer(`tests/${ORDEN}-g.test.ts`);
  for (const s of SECCIONES) assert.ok(g.includes(`"${s}"`), `la copia g pide la sección «${s}»`);
  assert.ok(!/createHash|venta-01-guia\.json/.test(g), "la copia g no fija el sha256 de la guía ni lee tests/venta-01-guia.json (Liam la edita por consola)");
  // (3) La `w`, sólo con lo del árbol.
  const w = leer(`tests/${ORDEN}-w.test.ts`);
  assert.ok(w.includes("tests/venta-01-demo.json"), "la copia w lee el registro tests/venta-01-demo.json");
  assert.ok(!/\bdbReal\(|\bvercel\(|\bfetch\(|firebase-admin/.test(w), "la copia w no lee Firestore, ni la API de Vercel, ni la web (una copia promovida no sale a la red)");
  // (4) npm test las corre.
  const scripts = JSON.parse(leer("package.json")).scripts ?? {};
  const nombra = (script: string, archivo: string) => String(script ?? "").split(/\s+/).map((t) => t.replace(/^["']|["']$/g, "")).some((t) => t === archivo || (t.includes("*") && matchesGlob(archivo, t)));
  for (const c of copias) assert.ok(nombra(scripts.test, c), `npm test no corre ${c}`);
  // (5) La carpeta de la orden, congelada desde su rojo.
  const rojo = git(ROOT, "log", "-1", "--format=%H", "--diff-filter=A", "main", "--", `${CARPETA}/HOJA.md`);
  assert.ok(rojo.startsWith(VENTA_01.rojo.H), `el rojo de ${ORDEN} en H es ${VENTA_01.rojo.H} (git da ${rojo.slice(0, 7)})`);
  assert.equal(git(ROOT, "log", "--format=%h %s", "--diff-filter=MDR", `${rojo}..main`, "--", `${CARPETA}/`), "", `${CARPETA}/ sigue congelada desde su rojo`);
});
