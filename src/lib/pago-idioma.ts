// SIN-ALTA-01 (G6, G8): el idioma de /pago/<clientId> sale de la ficha, y el título y la descripción de la pestaña van en ese idioma.

export type IdiomaPago = "he" | "en" | "es" | "ru" | "ar";

const IDIOMAS: readonly IdiomaPago[] = ["he", "en", "es", "ru", "ar"];

/** El `language` de hub_clients → el idioma de /pago; cualquier otra cosa, inglés. */
export function idiomaDePago(language: unknown): IdiomaPago {
  return IDIOMAS.includes(language as IdiomaPago) ? (language as IdiomaPago) : "en";
}

const METADATA: Record<IdiomaPago, { title: string; description: string }> = {
  he: { title: "תשלום — Arzac Studio", description: "השלמת התשלום על המנוי החודשי לאתר ול-CRM." },
  en: { title: "Payment — Arzac Studio", description: "Complete the monthly subscription payment for your website and CRM." },
  es: { title: "Pago — Arzac Studio", description: "Completá el pago de la suscripción mensual de tu web y tu CRM." },
  ru: { title: "Оплата — Arzac Studio", description: "Оплата ежемесячной подписки на сайт и CRM." },
  ar: { title: "الدفع — Arzac Studio", description: "إتمام دفع الاشتراك الشهري لموقعك ونظام CRM." },
};

/** `title.absolute`: el título entero, sin la plantilla «%s | Arzac Studio» del layout raíz. */
export function metadataDePago(lang: IdiomaPago) {
  const m = METADATA[lang];
  return { title: { absolute: m.title }, description: m.description };
}
