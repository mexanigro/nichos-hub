/**
 * P-5 (Liam, 2026-09-12): la compra directa por la web queda desactivada hasta certificar el cobro;
 * sólo venta en persona desde el hub. Una sola bandera, legible en servidor y cliente:
 * NEXT_PUBLIC_WEB_CHECKOUT_ENABLED === "true" (literal). Cualquier otro valor = apagado.
 */
export function isWebCheckoutEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_WEB_CHECKOUT_ENABLED === "true";
}
