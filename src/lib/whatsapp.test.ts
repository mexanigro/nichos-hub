import test from "node:test";
import assert from "node:assert/strict";

// SP-17 (revisión externa, n10-precios-v1): el enlace de WhatsApp es el camino principal de la landing con la
// compra web apagada; el número de entorno tuvo un 0 de más tras el 972. El helper lo tolera.
async function load() {
  try { return await import("./whatsapp.ts"); } catch { return {} as Record<string, unknown>; }
}

test("whatsappHref: normaliza el número y tolera el 0 tras el 972", async () => {
  const mod = await load();
  const fn = mod.whatsappHref as ((raw?: string) => string) | undefined;
  assert.equal(typeof fn, "function", "existe whatsappHref");
  assert.equal(fn!("9720557719141"), "https://wa.me/972557719141", "cero de más tras 972");
  assert.equal(fn!("972557719141"), "https://wa.me/972557719141", "correcto queda igual");
  assert.equal(fn!(""), "https://wa.me/972557719141", "vacío → fallback");
  assert.equal(fn!(undefined), "https://wa.me/972557719141", "ausente → fallback");
  assert.equal(fn!("+972 55-771-9141"), "https://wa.me/972557719141", "formato humano → dígitos");
  assert.equal(fn!("  wa.me/972557719141 "), "https://wa.me/972557719141", "basura no numérica fuera");
});
