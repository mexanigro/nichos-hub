// PLANTILLA-01 · E1 (H) · el registro en CLAUDE.md. Sesión A (2026-10-05): test rojo.
// Cada orden deja su párrafo en § Puertas automáticas. Ésta es sólo de H (Liam, D-249: lo de T va con la orden de higiene): el párrafo
// va en el CLAUDE.md de H y nombra las dos consolas, la función de guardado común, el arreglo de las notas, el tsconfig, el inciso y), el
// inciso z) con avisosDePreset (A2, D-263) y el retiro de ALTA-IDIOMAS-01. El bloque CONTRATO-DECLARADO no cambia: esta orden no toca hooks.
// Caja negra: lectura de CLAUDE.md y `git show` del commit aprobado de ALTA-IDIOMAS-01. Sólo en H.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALTA_IDIOMAS_01, ROOT, bloqueDe, fuente, git, parrafoDe } from "./_comun.ts";

const NOMBRA = ["desde-plantilla", "exportar", "aplicar", "guardarConfig", "descartadosDePropuesta", "tsconfig", "inciso y", "inciso z", "avisosDePreset", "reseñas", "equipo", "ALTA-IDIOMAS-01"];
const lineas = (s: string) => s.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim());

test("CLAUDE.md § Puertas de H tiene un párrafo PLANTILLA-01 que nombra «desde-plantilla», «exportar», «aplicar», «guardarConfig», «descartadosDePropuesta», «tsconfig», «inciso y», «inciso z», «avisosDePreset», «reseñas», «equipo» y «ALTA-IDIOMAS-01»; y el bloque CONTRATO-DECLARADO es idéntico al del commit aprobado de ALTA-IDIOMAS-01 (H 5502f02)", () => {
  const texto = fuente("CLAUDE.md");
  // (1) El párrafo de esta orden. Hoy no está: aquí está el rojo.
  const p = parrafoDe(texto, "PLANTILLA-01");
  assert.ok(p, "§ Puertas automáticas de H debe tener un párrafo «**PLANTILLA-01 (AAAA-MM-DD):**»");
  for (const n of NOMBRA) assert.ok(p.includes(n), `el párrafo PLANTILLA-01 de H debe nombrar «${n}»:\n${p.slice(0, 400)}`);
  // (2) El bloque CONTRATO-DECLARADO, igual que en el commit aprobado de ALTA-IDIOMAS-01.
  const aprobado = lineas(bloqueDe(git(ROOT, "show", `${ALTA_IDIOMAS_01.aprobado.H}:CLAUDE.md`)));
  assert.ok(aprobado.some((l) => /^githook\.pre-push\s+= destino-no-despliega\.mjs rojo-verde\.mjs --todas$/.test(l)), "precondición: el bloque aprobado de ALTA-IDIOMAS-01 en H fija el pre-push");
  assert.deepEqual(lineas(bloqueDe(texto)), aprobado, `el bloque CONTRATO-DECLARADO de H es idéntico al de ${ALTA_IDIOMAS_01.aprobado.H} (esta orden no toca hooks)`);
});
