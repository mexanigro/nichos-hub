// VENTA-01 · E1 (H) · el registro en CLAUDE.md. Sesión A (2026-10-06): test rojo.
// Cada orden deja su párrafo en § Puertas automáticas. Ésta es sólo de H (lo de T va con la orden de higiene): el párrafo nombra la
// función de las variables, el redeploy que ahora las sube, la variable del nombre, la casilla de la imagen, el alcance (peluquería), la
// guía y el retiro de PLANTILLA-01. El bloque CONTRATO-DECLARADO no cambia: esta orden no toca hooks.
// Caja negra: lectura de CLAUDE.md y `git show` del commit aprobado de PLANTILLA-01. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANTILLA_01, ROOT, bloqueDe, fuente, git, parrafoDe } from "./_comun.ts";

const NOMBRA = ["variablesDeDeploy", "redesplegar", "VITE_BRAND_NAME", "brand.ogImage", "peluquería", "GUIA-WEB-NUEVA", "PLANTILLA-01"];
const lineas = (s: string) => s.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());

test("CLAUDE.md § Puertas de H tiene un párrafo VENTA-01 que nombra «variablesDeDeploy», «redesplegar», «VITE_BRAND_NAME», «brand.ogImage», «peluquería», «GUIA-WEB-NUEVA» y «PLANTILLA-01»; y el bloque CONTRATO-DECLARADO es idéntico al del commit aprobado de PLANTILLA-01 (H 96cef4b)", () => {
  const texto = fuente("CLAUDE.md");
  // (1) El párrafo de esta orden. Hoy no está: aquí está el rojo.
  const p = parrafoDe(texto, "VENTA-01");
  assert.ok(p, "§ Puertas automáticas de H debe tener un párrafo «**VENTA-01 (AAAA-MM-DD):**»");
  for (const n of NOMBRA) assert.ok(p.includes(n), `el párrafo VENTA-01 de H debe nombrar «${n}»:\n${p.slice(0, 400)}`);
  // (2) El bloque CONTRATO-DECLARADO, igual que en el commit aprobado de PLANTILLA-01.
  const aprobado = lineas(bloqueDe(git(ROOT, "show", `${PLANTILLA_01.aprobado.H}:CLAUDE.md`)));
  assert.ok(aprobado.some((l) => /^githook\.pre-push\s+= destino-no-despliega\.mjs rojo-verde\.mjs --todas$/.test(l)), "precondición: el bloque aprobado de PLANTILLA-01 en H fija el pre-push");
  assert.deepEqual(lineas(bloqueDe(texto)), aprobado, `el bloque CONTRATO-DECLARADO de H es idéntico al de ${PLANTILLA_01.aprobado.H} (esta orden no toca hooks)`);
});
