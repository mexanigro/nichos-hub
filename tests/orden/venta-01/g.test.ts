// VENTA-01 · G1 (H) · la guía de una web nueva, completa (D-269). Sesión A (2026-10-06): test rojo.
//
// La guía vive en el registro (`Nichos/bloque-05/GUIA-WEB-NUEVA.md`), fuera de los repos y sin git: un test que sólo la leyera por su ruta
// fija pasaría también en el árbol rojo una vez escrita, y `rojo-verde` lo daría por «nunca estuvo en rojo» (inciso l). Por eso el árbol
// la ata por su sha256: `tests/venta-01-guia.json` (lo escribe B al terminar la guía) declara la ruta y el sha256 de la versión revisada.
// Sin el registro (el árbol rojo) cae siempre; con él, la guía tiene que ser esa versión y decir lo que la hoja pide en cada sección.
// Si Liam edita la guía después, el sha256 cambia y la copia promovida de este test lo dice: se actualiza el registro.
// Caja negra: lectura del registro y de la guía.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GUIA, ROOT, existe, seccionDeTexto } from "./_comun.ts";

const REGISTRO = "tests/venta-01-guia.json";
/** Cada sección («## <título>») y lo que tiene que nombrar (sin distinguir mayúsculas). */
const SECCIONES: Record<string, string[]> = {
  "Plantilla A o C": ["clara", "oscura", "--plantilla a", "--plantilla c"],
  "El logo": ["casilla", "logo"],
  "El color (paleta)": ["paleta", "color fuente", "origen", "motivo"],
  "El material de la plantilla": ["vídeo del hero", "servicios", "galería", "textura", "foto del local", "local-v", "Instagram", "casilla"],
  "Lo que se revisa con la clienta": ["FAQ", "servicios", "precios", "horarios"],
  "Si trabaja sola": ["descripción del equipo"],
  "Fotos del equipo": ["foto", "reserva", "imagen rota"],
  "De demo a clienta": ["/pago/", "demo-", "no vence solo"],
  "El nombre en el link": ["Redeploy", "OG Image", "nombre"],
};

test("la guía de una web nueva (bloque-05/GUIA-WEB-NUEVA.md, por su ruta fija) es la que declara tests/venta-01-guia.json por su sha256 y tiene sus nueve secciones con lo que cada una tiene que decir: Plantilla A o C, El logo, El color (paleta), El material de la plantilla, Lo que se revisa con la clienta, Si trabaja sola, Fotos del equipo, De demo a clienta y El nombre en el link", () => {
  // (1) El registro. Hoy no existe: aquí está el rojo.
  assert.ok(existe(REGISTRO), `falta ${REGISTRO} (D-269): la guía no está completa para vender (sin logo, color, material, FAQ revisado, demo → clienta ni el nombre en el link)`);
  const r = JSON.parse(readFileSync(resolve(ROOT, REGISTRO), "utf8")) as { ruta?: string; sha256?: string };
  assert.equal(r.ruta, GUIA, `el registro declara la guía por su ruta fija (${GUIA})`);
  assert.ok(existsSync(GUIA), `existe ${GUIA}`);
  const bytes = readFileSync(GUIA);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), r.sha256, "la guía es la versión que declara el registro (si Liam la editó, se actualiza el sha256 del registro)");

  // (2) Las nueve secciones y lo que dice cada una.
  const texto = bytes.toString("utf8");
  for (const [titulo, nombra] of Object.entries(SECCIONES)) {
    const s = seccionDeTexto(texto, titulo);
    assert.ok(s, `la guía tiene la sección «## ${titulo}»`);
    for (const n of nombra) assert.ok(s!.toLowerCase().includes(n.toLowerCase()), `la sección «${titulo}» nombra «${n}»`);
  }
});
