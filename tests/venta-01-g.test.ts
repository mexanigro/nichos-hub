// VENTA-01 · copia promovida (SECCIONES-02, 2026-10-07, D-281) de tests/orden/venta-01/g.test.ts. La orden quedó aprobada por Liam
// el 2026-10-06 (T 3222922 · H fa5674e) y su carpeta está congelada; esto es la copia editable que corre `npm test`.
// Recorte (D-281): SIN la huella de la guía ni el registro que la guarda. Liam edita la guía por consola y una copia que fijara su
// contenido caería con cada edición; afirma sus nueve secciones y lo que nombra cada una (la orden congelada sigue atándola por su
// huella: `rojo-verde --orden venta-01`).
// VENTA-01 · G1 (H) · la guía de una web nueva, completa (D-269).
// Caja negra: lectura de la guía por su ruta fija.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { GUIA, seccionDeTexto } from "./orden/venta-01/_comun.ts";

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

test("la guía de una web nueva (bloque-05/GUIA-WEB-NUEVA.md, por su ruta fija) tiene sus nueve secciones con lo que cada una tiene que decir: Plantilla A o C, El logo, El color (paleta), El material de la plantilla, Lo que se revisa con la clienta, Si trabaja sola, Fotos del equipo, De demo a clienta y El nombre en el link", () => {
  assert.ok(existsSync(GUIA), `existe ${GUIA}`);
  const texto = readFileSync(GUIA, "utf8");
  for (const [titulo, nombra] of Object.entries(SECCIONES)) {
    const s = seccionDeTexto(texto, titulo);
    assert.ok(s, `la guía tiene la sección «## ${titulo}»`);
    for (const n of nombra) assert.ok(s!.toLowerCase().includes(n.toLowerCase()), `la sección «${titulo}» nombra «${n}»`);
  }
});
