// SIN-ALTA-01 · E1 (H) · el registro: CLAUDE.md § Oferta y docs/GUIA-OPERACION.md sin el alta.
// Sesión A (2026-10-20): test rojo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fuente, seccion } from "./_comun.ts";

const OFERTA = ["250 NIS/mes", "todo incluido", "sin alta", "v9.0", "rige ese día", "días no usados", "a mano en Cardcom", "WhatsApp, IA y voz no se ofrecen", "2026-09-12", "2026-10-15"];

test("CLAUDE.md § Oferta dice 250 NIS/mes, todo incluido y sin alta, el contrato v9.0, la cancelación del día con devolución proporcional a mano en Cardcom, que WhatsApp, IA y voz no se ofrecen y que el alta rigió del 2026-09-12 al 2026-10-15; docs/GUIA-OPERACION.md no nombra «Alta negociada», setup-amount-panel ni charges.ts", () => {
  const oferta = seccion(fuente("CLAUDE.md"), "Oferta");
  assert.ok(oferta, "CLAUDE.md tiene § Oferta");
  const faltan = OFERTA.filter((w) => !oferta.includes(w));
  assert.deepEqual(faltan, [], `CLAUDE.md § Oferta debe nombrar ${faltan.map((w) => `«${w}»`).join(", ")}`);
  assert.match(oferta, /alta[^\n]{0,80}rigió del 2026-09-12 al 2026-10-15/, "el alta rigió del 2026-09-12 al 2026-10-15");
  assert.ok(!/\*\*Alta 1500 NIS\*\*|SETUP_AMOUNT|setupAmount|contrato v8\.0 en/.test(oferta), "§ Oferta ya no ofrece el alta (Alta 1500, SETUP_AMOUNT_*, setupAmount, contrato v8.0 vigente)");
  const guia = fuente("docs/GUIA-OPERACION.md");
  for (const w of ["Alta negociada", "setup-amount-panel", "charges.ts"]) assert.ok(!guia.includes(w), `docs/GUIA-OPERACION.md no nombra «${w}»`);
});
