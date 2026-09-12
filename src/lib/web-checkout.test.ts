import test from "node:test";
import assert from "node:assert/strict";

// P-5 (Liam, 2026-09-12): la compra directa por la web queda desactivada hasta certificar el cobro;
// sólo venta en persona desde el hub. La bandera es NEXT_PUBLIC_WEB_CHECKOUT_ENABLED === "true".
async function load() {
  try {
    return await import("./web-checkout.ts");
  } catch {
    return {} as Record<string, unknown>;
  }
}

test("isWebCheckoutEnabled: apagado por defecto, sólo 'true' literal lo enciende", async () => {
  const mod = await load();
  const fn = mod.isWebCheckoutEnabled as ((env: Record<string, string | undefined>) => boolean) | undefined;
  assert.equal(typeof fn, "function", "existe isWebCheckoutEnabled");
  assert.equal(fn!({}), false, "sin variable → apagado");
  assert.equal(fn!({ NEXT_PUBLIC_WEB_CHECKOUT_ENABLED: "" }), false);
  assert.equal(fn!({ NEXT_PUBLIC_WEB_CHECKOUT_ENABLED: "1" }), false, "sólo 'true' literal");
  assert.equal(fn!({ NEXT_PUBLIC_WEB_CHECKOUT_ENABLED: "TRUE" }), false);
  assert.equal(fn!({ NEXT_PUBLIC_WEB_CHECKOUT_ENABLED: "true" }), true);
});
