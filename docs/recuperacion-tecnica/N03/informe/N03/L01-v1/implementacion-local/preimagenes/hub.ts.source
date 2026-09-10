import type { WizardData, WizardNiche } from "./wizard-types";
import { NICHE_SERVICES, type BusinessNiche } from "@/lib/client-config/services";

/**
 * Convierte un doc Firestore `config/{clientId}` (shape anidado del template)
 * a Partial<WizardData> para hidratar el wizard en modo re-edición.
 *
 * NO hidrata imágenes (logo, hero, staff, gallery) — esas viven como URLs
 * en config y el wizard espera SerializedFile|null. Si el cliente quiere
 * cambiarlas, sube archivos nuevos; si no, las URLs viejas se mantienen
 * porque el dot-notation merge del endpoint client-info nunca las borra.
 */
export function configToWizardData(
  config: Record<string, unknown> | null | undefined,
): Partial<WizardData> {
  if (!config || typeof config !== "object") return {};

  const business = (config.business as Record<string, unknown>) || {};
  const brand = (config.brand as Record<string, unknown>) || {};
  const contact = (config.contact as Record<string, unknown>) || {};
  const address = (contact.address as Record<string, unknown>) || {};
  const owner = (config.owner as Record<string, unknown>) || {};
  const brandingInput = (config.brandingInput as Record<string, unknown>) || {};
  const themeOverrides = (config.themeOverrides as Record<string, unknown>) || {};
  const sections = (config.sections as Record<string, unknown>) || {};
  const whyChooseUs = (sections.whyChooseUs as Record<string, unknown>) || {};
  const faq = (sections.faq as Record<string, unknown>) || {};

  const out: Partial<WizardData> = {};

  // Business
  const niche = business.type as string | undefined;
  if (niche) out.niche = niche as WizardNiche;
  const mode = business.mode as "solo" | "team" | undefined;
  if (mode === "solo" || mode === "team") out.businessMode = mode;
  if (typeof business.name === "string") out.businessName = business.name;
  else if (typeof brand.name === "string") out.businessName = brand.name;

  // Brand
  if (typeof brand.tagline === "string") out.tagline = brand.tagline;
  if (typeof brand.description === "string") out.description = brand.description;
  if (typeof brand.faviconEmoji === "string") out.faviconEmoji = brand.faviconEmoji;

  // Contact
  if (typeof contact.phone === "string") out.phone = contact.phone;
  if (typeof contact.email === "string") out.email = contact.email;
  if (typeof contact.whatsapp === "string") out.whatsapp = contact.whatsapp;
  if (typeof contact.instagram === "string") out.instagram = contact.instagram;
  if (typeof contact.facebook === "string") out.facebook = contact.facebook;
  if (typeof address.street === "string") out.address = address.street;
  if (typeof address.district === "string") out.district = address.district;
  if (typeof address.city === "string") out.city = address.city;

  // Brand keywords / accent
  if (typeof brandingInput.colors === "string") out.colors = brandingInput.colors;
  if (typeof themeOverrides.accentColor === "string") out.accentColor = themeOverrides.accentColor;

  // Owner
  if (typeof owner.name === "string") out.ownerName = owner.name;
  if (typeof owner.role === "string") out.ownerRole = owner.role;
  if (typeof owner.bio === "string") out.ownerBio = owner.bio;

  // Services — el config los persiste con price:number / duration:number, sin
  // label (sólo id + opcionalmente customLabel). El wizard UI necesita un label
  // para mostrar al cliente, así que lo resolvemos: customLabel si lo hay, sino
  // el default del nicho del dict en services.ts, sino el id como fallback.
  if (Array.isArray(config.services)) {
    const nicheRaw = typeof business.type === "string" ? business.type : "";
    const nicheKey = (nicheRaw === "otro" ? "estetica" : nicheRaw) as BusinessNiche;
    const defaultsByNiche = (NICHE_SERVICES as Record<BusinessNiche, { id: string; label: string }[]>)[
      nicheKey
    ];
    const defaultLabelById = new Map<string, string>();
    if (defaultsByNiche) {
      for (const d of defaultsByNiche) defaultLabelById.set(d.id, d.label);
    }

    out.services = (config.services as Array<Record<string, unknown>>).map((s) => {
      const id = String(s.id || "");
      const customLabel =
        typeof s.customLabel === "string" && s.customLabel ? s.customLabel : "";
      // Compat: docs viejos que aún tienen `label` legacy. Mantenemos el valor
      // como si fuera customLabel para no perder data hasta que pase el backfill.
      const legacyLabel = typeof s.label === "string" && s.label ? s.label : "";
      const label = customLabel || legacyLabel || defaultLabelById.get(id) || id;
      return {
        id,
        label,
        price: s.price !== undefined && s.price !== null ? String(s.price) : "",
        duration: s.duration !== undefined && s.duration !== null ? String(s.duration) : "",
        visible: true,
      };
    });
  }

  // Hours
  if (config.hours && typeof config.hours === "object" && !Array.isArray(config.hours)) {
    out.hours = config.hours as WizardData["hours"];
  }

  // Benefits / Testimonials / FAQ (campos del Bloque 4)
  if (Array.isArray(whyChooseUs.benefits)) {
    out.benefits = (whyChooseUs.benefits as Array<Record<string, unknown>>).map((b) => ({
      title: String(b.title || ""),
      desc: String(b.desc || ""),
      iconName: String(b.iconName || "Star"),
    }));
  }
  if (Array.isArray(config.testimonials)) {
    out.testimonials = (config.testimonials as Array<Record<string, unknown>>).map((t) => ({
      name: String(t.name || ""),
      title: String(t.title || ""),
      text: String(t.text || ""),
      rating: typeof t.rating === "number" ? t.rating : 5,
    }));
  }
  if (Array.isArray(faq.items)) {
    out.faqItems = (faq.items as Array<Record<string, unknown>>).map((f) => ({
      q: String(f.q || ""),
      a: String(f.a || ""),
    }));
  }

  return out;
}
