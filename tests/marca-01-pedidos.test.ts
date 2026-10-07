// MARCA-01 · el pedido de un servicio para chicos (sesión B, 2026-10-07, medido en W1): con «A woman … PERSON: a woman …» ChatGPT
// dibujó a una mujer adulta para «תספורת ילדים» (Kids haircut) y el servicio no se reconocía. En las dos direcciones: un servicio de
// chicos lleva a una niña o un niño; los demás siguen con una mujer distinta en cada foto (R17).
import { test } from "node:test";
import assert from "node:assert/strict";
import { PALETA_YULIA, importarModulo, porJson } from "./orden/marca-01/_comun.ts";

test("pedidosDeMaterial: un servicio de chicos (Kids haircut) pide un niño en PERSON y en el sujeto; los demás, una mujer distinta en cada foto", async () => {
  const { pedidosDeMaterial } = await importarModulo("src/lib/pedidos-chatgpt.ts");
  const config = porJson({
    branding: { mode: "light", colors: PALETA_YULIA },
    services: [{ id: "a", name: "א" }, { id: "kids", name: "ב" }, { id: "c", name: "ג" }],
    translations: { en: { services: { a: { name: "Precision haircut" }, kids: { name: "Kids haircut" }, c: { name: "Full colour" } } } },
  });
  const ps = (pedidosDeMaterial(config, "a bright salon") as { ruta: string; pedido: string }[]).filter((p) => p.ruta.startsWith("sections.services.images."));
  const persona = (p: { pedido: string }) => p.pedido.match(/^PERSON: (.*)$/m)?.[1] ?? "";
  assert.match(persona(ps[1]), /child/, `el de chicos pide un niño (${persona(ps[1])})`);
  assert.match(ps[1].pedido, /The child seen from behind/, "y el sujeto es el niño");
  for (const i of [0, 2]) {
    assert.match(persona(ps[i]), /^a woman/, `el servicio ${i + 1} pide una mujer (${persona(ps[i])})`);
    assert.match(ps[i].pedido, /A woman seen from behind/);
  }
  assert.notEqual(persona(ps[0]), persona(ps[2]), "una mujer distinta en cada foto");
});
