// CONEXION-02 · B · contrato, validador y guard de las tres filas del hero. B1 (T): verdad/contratos.json declara `ui` en hero.video,
// hero.video.portrait y hero.video.poster y CONTRATOS-HUECOS.md lo dice en sus tres filas; las otras 33 filas iguales a las del commit
// aprobado de VERDAD-07. B2 (H): validateVariantContracts da error (no aviso) ante un valor de hero.video.* que no empieza por https://.
// B3 (T): ajustes-01 nombra «hero.video» y «poster» sin cambiar lo que afirma; hueco.mjs --json da las tres filas hechas y «5/36 huecos
// hechos». Sesión A (2026-09-22): tests rojos (hoy `ui: null` en las tres, el validador sólo avisa, hueco 2/36). Un mismo archivo en T y
// en H (cmp → 0): B1 y B3 sólo corren en T, B2 sólo en H (por REPO).
// CONEXION-03 D1 (2026-09-22): copia editable promovida a npm test (la orden está aprobada y retirada de rojo-verde --todas; el
// original de la carpeta congelada no se toca).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { BLOQUE, CAMPOS, clon, correr, FILAS_HERO, fixture, git, REPO, ROOT, UI_HERO, VERDAD_07 } from "./orden/conexion-02/_util.ts";

const CONTRATOS = "verdad/contratos.json";
const GUARD = "tests/ajustes-01.test.ts";
const HUECO = "tools/verdad/hueco.mjs";
const VALIDADOR = "src/lib/config-validator.ts";
type Fila = { id: string; ui: unknown; contrato?: { campo?: string }; [k: string]: unknown };
type Contratos = { huecos: Fila[] };
type Check = { ok: boolean; detalle: string };
type Resultado = { id: string; checks: Record<"contrato" | "validador" | "ui" | "material" | "guard", Check>; hecho: boolean };
type Issue = { path: string; message: string; severity: "error" | "warning" };
const ultimaLinea = (stdout: string) => stdout.split(/\r?\n/).filter((l) => l.trim()).pop() ?? "";
/** Nombres de los tests de un archivo (primer argumento de cada `test(`), para comparar lo que afirma sin comparar el cuerpo. */
const nombresDeTests = (fuente: string) => [...fuente.matchAll(/^test\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/gm)].map((m) => m[1].slice(1, -1));

if (REPO === "H") test("`validateVariantContracts` de src/lib/config-validator.ts, además de sus avisos actuales, da **error** (no aviso) cuando un valor de `hero.video.*` está presente y no empieza por `https://` («producción no sirve rutas locales», nombra la clave); el fixture A y el C pasan sin errores; un config con `hero.video.mp4 = \"/dev-fixtures/media/paleta-a/hero.mp4\"` es rechazado", async () => {
  const m = (await import(pathToFileURL(resolve(ROOT, VALIDADOR)).href)) as { validateVariantContracts: (c: unknown) => Issue[] };
  assert.equal(typeof m.validateVariantContracts, "function", "exporta validateVariantContracts");
  const validar = m.validateVariantContracts;
  const A = fixture("a"), C = fixture("c");
  assert.equal((A.hero as Record<string, unknown>).variant, "v6", "precondición: el fixture A es hero v6 (validateVariantContracts mira hero.*)");
  // Rechazado: hero.video.mp4 con ruta local → error que nombra la clave.
  const malo = clon(A);
  ((malo.hero as Record<string, unknown>).video as Record<string, unknown>).mp4 = "/dev-fixtures/media/paleta-a/hero.mp4";
  const errores = validar(malo).filter((i) => i.severity === "error");
  assert.ok(errores.some((i) => i.path === "hero.video.mp4"), `hero.video.mp4 = /dev-fixtures/media/paleta-a/hero.mp4 da un error con path hero.video.mp4 (errores: ${JSON.stringify(errores)}; avisos: ${JSON.stringify(validar(malo).filter((i) => i.severity === "warning").map((i) => i.path))})`);
  assert.ok(errores.filter((i) => i.path === "hero.video.mp4").some((i) => i.message.includes("producción no sirve rutas locales")), `el error dice «producción no sirve rutas locales»: ${JSON.stringify(errores)}`);
  // Cada una de las ocho claves: presente y sin https:// → error con esa clave.
  for (const campo of CAMPOS) {
    const c = clon(A);
    const partes = campo.split("."), ultimo = partes.pop() as string;
    let o = (c.hero as Record<string, unknown>).video as Record<string, unknown>;
    for (const p of partes) o = o[p] as Record<string, unknown>;
    o[ultimo] = `/dev-fixtures/media/paleta-a/${ultimo}`;
    assert.ok(validar(c).some((i) => i.severity === "error" && i.path === `hero.video.${campo}`), `hero.video.${campo} con ruta local → error con path hero.video.${campo}`);
  }
  // Los fixtures A y C pasan sin errores (todo hero.video.* es https://).
  assert.deepEqual(validar(A).filter((i) => i.severity === "error"), [], "el fixture A no da errores");
  assert.deepEqual(validar(C).filter((i) => i.severity === "error"), [], "el fixture C no da errores");
  // Además de sus avisos actuales: vídeo sin poster sigue siendo aviso en hero.video.poster; ausente (no presente) no es error.
  const sinPoster = clon(A);
  delete ((sinPoster.hero as Record<string, unknown>).video as Record<string, unknown>).poster;
  const avisos = validar(sinPoster);
  assert.ok(avisos.some((i) => i.severity === "warning" && i.path === "hero.video.poster"), "vídeo sin poster sigue avisando en hero.video.poster");
  assert.deepEqual(avisos.filter((i) => i.severity === "error"), [], "una clave ausente no es error");
});

