/**
 * LANDING-01: el precio de la landing sale de src/lib/pricing.ts y nunca se escribe a mano en los textos.
 * Los locales escriben `{precio}` donde va la cuota; `aplicarPrecios` lo reemplaza al cargar el idioma y pone
 * `pricing.plans[i].price`. Importable con `node --experimental-strip-types` (imports relativos con extensión).
 */
import { MONTHLY_AMOUNT } from "../pricing.ts";
import type { Locale, Translations } from "./types.ts";

/** La cuota como se escribe en cada idioma: en hebreo el símbolo va después del número. */
export function precio(locale: Locale, monto: number = MONTHLY_AMOUNT): string {
  return locale === "he" ? `${monto} ₪` : `₪${monto}`;
}

function reemplazar<T>(valor: T, texto: string): T {
  if (typeof valor === "string") return valor.split("{precio}").join(texto) as T;
  if (Array.isArray(valor)) return valor.map((v) => reemplazar(v, texto)) as T;
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) salida[k] = reemplazar(v, texto);
    return salida as T;
  }
  return valor;
}

export function aplicarPrecios(t: Translations, locale: Locale, monto: number = MONTHLY_AMOUNT): Translations {
  const salida = reemplazar(t, precio(locale, monto));
  salida.pricing.plans = salida.pricing.plans.map((p) => ({ ...p, price: monto }));
  return salida;
}
