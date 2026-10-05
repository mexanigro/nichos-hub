// ALTA-IDIOMAS-01 · guard de lo que midió W1 (2026-10-05): `PUT /api/config` valida el CUERPO solo con `validateConfig`, y el texto
// de una capa por id (`translations.<lang>.services|staff|testimonials.<id>`) da error si la lista de la raíz no viene en el mismo
// cuerpo («el id … no existe en services de la raíz»). Con la API real, el primer «Guardar propuesta» del cliente demo cayó en 422
// por eso; los tests de la orden modelan la fusión de Firestore pero no esa puerta. Esto vigila que el cuerpo de
// `cuerpoDePropuesta` pase `validateConfig` por sí solo, en las dos direcciones (sin las listas de la raíz, cae).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { camposDeTexto, cuerpoDePropuesta } from "../src/lib/textos-claude.ts";
import { validateConfig } from "../src/lib/config-validator.ts";

type Cfg = Record<string, any>;
const ROOT = resolve(import.meta.dirname, "..");
const { translations: _t, ...A } = JSON.parse(readFileSync(resolve(ROOT, "tests/orden/alta-idiomas-01/peluqueria-paleta-a.json"), "utf8")) as Cfg;
/** Un texto que cumple cualquier límite del catálogo y no trae números. */
const texto = (c: { min?: number; max?: number }) => Array.from({ length: Math.min(c.max ?? 2, Math.max(c.min ?? 2, 2)) }, () => "palabra").join(" ");

test("el cuerpo de `cuerpoDePropuesta` con texto por id en otros idiomas pasa `validateConfig` solo (la puerta del PUT), y sin las listas de la raíz no", () => {
  const propuesta: Record<string, Record<string, string>> = {};
  for (const l of ["en", "ru", "ar"]) propuesta[l] = Object.fromEntries((camposDeTexto(A, "peluqueria", l, "he") as { ruta: string; min?: number; max?: number }[]).map((c) => [c.ruta, texto(c)]));
  const aceptados = Object.entries(propuesta).flatMap(([l, t]) => Object.keys(t).map((r) => `${l}:${r}`));
  const cuerpo = cuerpoDePropuesta(A, "peluqueria", "he", propuesta, aceptados) as Cfg;
  assert.ok(cuerpo.translations?.en?.services?.cut?.name, "precondición: el cuerpo lleva texto de servicios por id en inglés");
  const errores = (c: Cfg) => validateConfig(c).filter((e) => e.severity === "error");
  assert.deepEqual(errores(cuerpo), [], "el cuerpo pasa la puerta del PUT");
  assert.deepEqual(cuerpo.services, A.services, "la lista de la raíz va sin cambios");
  const { services: _s, staff: _st, testimonials: _r, ...sinListas } = cuerpo;
  assert.ok(errores(sinListas).some((e) => /no existe en services de la raíz/.test(e.message)), "sin las listas de la raíz, el PUT lo rechazaría (el defecto que midió W1)");
});

// W1 (Liam, 2026-10-05): el sufijo del titular es opcional; un vacío propuesto ahí no es error, y en cualquier otro campo sí.
test("`validarPropuesta` acepta el sufijo del titular vacío (campo opcional) y sigue dando error por otro campo vacío", async () => {
  const { validarPropuesta } = await import("../src/lib/textos-claude.ts");
  const errores = validarPropuesta(A, "peluqueria", "he", { en: { "hero.titlePrefix": "Colour that", "hero.titleHighlight": "feels yours", "hero.titleSuffix": "", "hero.subtitle": " " } }).filter((e) => e.severity === "error").map((e) => e.path);
  assert.ok(!errores.includes("en:hero.titleSuffix"), `el sufijo vacío no es error (hubo: ${errores.join(", ")})`);
  assert.ok(errores.includes("en:hero.subtitle"), "otro campo vacío sí es error");
});
