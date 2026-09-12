/**
 * Enlace de WhatsApp de Arzac Studio (SP-17, n10-precios-v1). Con la compra web apagada este botón es el camino
 * principal de la landing, así que el número de entorno se normaliza en vez de confiar en él:
 * sólo dígitos; un 0 pegado tras el 972 (formato local "05x" escrito con prefijo) se quita; vacío → número fijo.
 */
export const WHATSAPP_FALLBACK = "972557719141";

export function whatsappNumber(raw: string | undefined = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("9720")) digits = "972" + digits.slice(4);
  return digits || WHATSAPP_FALLBACK;
}

export function whatsappHref(raw?: string): string {
  return `https://wa.me/${whatsappNumber(raw)}`;
}
