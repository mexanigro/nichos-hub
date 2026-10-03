import { resolveBranding } from "@/lib/branding-resolver";
import { NICHE_SERVICES, type BusinessNiche } from "@/lib/client-config/services";

/**
 * El config/{id} que escribe el alta (`POST /api/onboarding/client-info`) a partir del cuerpo del wizard /onboarding/info. Pura:
 * sacada de la ruta en CIERRE-TRAMO-01 (C3) para que un guard la EJECUTE y la pase por `validateConfig` sin errores
 * (`tests/alta-config.test.ts`). Mapas anidados sólo con hojas, para set+merge.
 */
export function configDeAlta(body: any, clientLanguage?: string): Record<string, unknown> {
  // Build config update from submitted data
  const niche =
    body.niche === "otro" ? "estetica" : body.niche || "estetica";

  const branding = body.colors
    ? resolveBranding({ niche, colors: body.colors })
    : { themeOverrides: {} };

  const configUpdate: Record<string, unknown> = {
    business: {
      type: niche,
      mode: body.businessMode || "team",
      name: body.businessName || "",
    },
  };
  const brandUpdate: Record<string, unknown> = {};
  const ownerUpdate: Record<string, unknown> = {};
  const themeUpdate: Record<string, unknown> = {};
  const whyChooseUsUpdate: Record<string, unknown> = {};
  const faqUpdate: Record<string, unknown> = {};

  // Persistir idioma del cliente en config (lo lee el template para localizar
  // labels de servicios, formatos de hora, etc.). Sólo escribimos si vino
  // válido; defaults van en cardcom-promote.ts al crear el hub_clients.
  if (clientLanguage) {
    configUpdate["language"] = clientLanguage;
  }

  // Brand
  if (body.businessName)
    brandUpdate.name = body.businessName;
  if (body.tagline) brandUpdate.tagline = body.tagline;
  if (body.description)
    brandUpdate.description = body.description;
  if (body.faviconEmoji) brandUpdate.faviconEmoji = body.faviconEmoji;

  // Contact: mapas anidados con sólo las hojas enviadas para set+merge.
  if (body.contact) {
    const contactUpdate: Record<string, unknown> = {};
    if (body.contact.phone)
      contactUpdate.phone = body.contact.phone;
    if (body.contact.email)
      contactUpdate.email = body.contact.email;
    if (body.contact.instagram)
      contactUpdate.instagram = body.contact.instagram;
    if (body.contact.facebook)
      contactUpdate.facebook = body.contact.facebook;
    if (body.contact.whatsapp)
      contactUpdate.whatsapp = body.contact.whatsapp;
    if (body.contact.address) {
      const addressUpdate: Record<string, unknown> = {};
      if (body.contact.address.street)
        addressUpdate.street = body.contact.address.street;
      if (body.contact.address.district)
        addressUpdate.district = body.contact.address.district;
      // CIERRE-TRAMO-01 (C3): la ciudad del wizard va a `cityStateZip`, que es lo que la página lee; `city` no lo lee nadie y
      // `validateConfig` lo rechaza (la pestaña Config no podía guardar la ficha).
      if (body.contact.address.city)
        addressUpdate.cityStateZip = body.contact.address.city;
      if (Object.keys(addressUpdate).length > 0)
        contactUpdate.address = addressUpdate;
    }
    if (Object.keys(contactUpdate).length > 0)
      configUpdate.contact = contactUpdate;
  }

  // Services
  //
  // El template tiene su propio dict de labels por idioma (t.serviceLabels[id]).
  // Persistimos sólo id + price + duration por servicio. Si el cliente cambió
  // el label respecto del default del nicho (por ej, dejó "Haircut" como
  // "Corte masculino"), guardamos `customLabel` para que el template lo
  // use por encima del dict. Para servicios custom (id="custom-…"), siempre
  // hay customLabel — no hay default contra qué comparar.
  if (Array.isArray(body.services) && body.services.length > 0) {
    const defaultsByNiche = (NICHE_SERVICES as Record<BusinessNiche, { id: string; label: string }[]>)[
      niche as BusinessNiche
    ];
    const defaultLabelById = new Map<string, string>();
    if (defaultsByNiche) {
      for (const d of defaultsByNiche) defaultLabelById.set(d.id, d.label);
    }

    configUpdate["services"] = body.services.map(
      (s: { id: string; label?: string; price?: string; duration?: string }) => {
        const id = s.id;
        const submittedLabel = (s.label ?? "").trim();
        const defaultLabel = defaultLabelById.get(id);
        const isCustomId = !defaultLabel; // id no presente en defaults del nicho
        const customLabel =
          isCustomId
            ? submittedLabel
            : submittedLabel && submittedLabel !== defaultLabel
              ? submittedLabel
              : "";

        const entry: {
          id: string;
          price: number;
          duration: number;
          customLabel?: string;
        } = {
          id,
          price: s.price ? Number(s.price) || 0 : 0,
          duration: s.duration ? Number(s.duration) || 30 : 30,
        };
        if (customLabel) entry.customLabel = customLabel;
        return entry;
      },
    );
  }

  // Hours
  if (body.hours && typeof body.hours === "object") {
    configUpdate["hours"] = body.hours;
  }

  // Owner
  if (body.ownerName) ownerUpdate.name = body.ownerName;
  if (body.ownerRole) ownerUpdate.role = body.ownerRole;
  if (body.ownerBio) ownerUpdate.bio = body.ownerBio;

  // Accent color / branding
  if (body.accentColor) {
    themeUpdate.accentColor = body.accentColor;
  }
  if (Object.keys(branding.themeOverrides).length > 0) {
    for (const [k, v] of Object.entries(branding.themeOverrides)) {
      themeUpdate[k] = v;
    }
  }

  // Branding input (raw user input for re-resolution)
  configUpdate.brandingInput = { colors: body.colors || "" };

  // Image uploads (URLs from /api/onboarding/upload)
  if (typeof body.logoUrl === "string" && body.logoUrl) {
    brandUpdate.logo = body.logoUrl;
  }
  if (typeof body.logoDarkUrl === "string" && body.logoDarkUrl) {
    brandUpdate.logoDark = body.logoDarkUrl;
  }
  if (typeof body.ownerPhotoUrl === "string" && body.ownerPhotoUrl) {
    ownerUpdate.photo = body.ownerPhotoUrl;
  }
  if (typeof body.heroImageUrl === "string" && body.heroImageUrl) {
    configUpdate.hero = { backgroundImage: body.heroImageUrl };
  }
  if (Array.isArray(body.staffPhotoUrls) && body.staffPhotoUrls.length > 0) {
    // Stub: array de URLs. Liam mapea a staff[].photo en config-tab cuando
    // tiene el contexto de quien es cada uno (nombre/role).
    configUpdate["staffPhotos"] = body.staffPhotoUrls;
  }
  if (Array.isArray(body.galleryImageUrls) && body.galleryImageUrls.length > 0) {
    configUpdate["gallery"] = body.galleryImageUrls.map((url: string) => ({ url }));
  }

  // ── Campos estructurados nuevos (Bloque 4) ─────────────────────────
  // Shapes alineados con los editors de src/components/config-editors/.

  // Benefits → sections.whyChooseUs.benefits[]: { title, desc, iconName }
  if (Array.isArray(body.benefits) && body.benefits.length > 0) {
    const cleaned = body.benefits
      .filter((b: { title?: string; desc?: string }) => b.title?.trim() || b.desc?.trim())
      .map((b: { title?: string; desc?: string; iconName?: string }) => ({
        title: (b.title || "").trim(),
        desc: (b.desc || "").trim(),
        iconName: b.iconName || "Star",
      }));
    if (cleaned.length > 0) whyChooseUsUpdate.benefits = cleaned;
  }
  if (typeof body.whyChooseUsMainImage === "string" && body.whyChooseUsMainImage) {
    whyChooseUsUpdate.mainImage = body.whyChooseUsMainImage;
  }

  // Testimonials → testimonials[]: { name, title, text, rating }
  if (Array.isArray(body.testimonials) && body.testimonials.length > 0) {
    const cleaned = body.testimonials
      .filter((t: { text?: string; name?: string }) => t.text?.trim() || t.name?.trim())
      .map((t: { name?: string; title?: string; text?: string; rating?: number }) => ({
        name: (t.name || "").trim(),
        title: (t.title || "").trim(),
        text: (t.text || "").trim(),
        rating: typeof t.rating === "number" && t.rating >= 1 && t.rating <= 5 ? t.rating : 5,
      }));
    if (cleaned.length > 0) configUpdate["testimonials"] = cleaned;
  }

  // FAQ → sections.faq.items[]: { q, a }
  if (Array.isArray(body.faqItems) && body.faqItems.length > 0) {
    const cleaned = body.faqItems
      .filter((f: { q?: string; a?: string }) => f.q?.trim() && f.a?.trim())
      .map((f: { q: string; a: string }) => ({ q: f.q.trim(), a: f.a.trim() }));
    if (cleaned.length > 0) faqUpdate.items = cleaned;
  }

  // Un mapa vacío en set+merge reemplaza su rama: adjuntar sólo mapas con hojas.
  if (Object.keys(brandUpdate).length > 0) configUpdate.brand = brandUpdate;
  if (Object.keys(ownerUpdate).length > 0) configUpdate.owner = ownerUpdate;
  if (Object.keys(themeUpdate).length > 0) configUpdate.themeOverrides = themeUpdate;
  const sectionsUpdate: Record<string, unknown> = {};
  if (Object.keys(whyChooseUsUpdate).length > 0)
    sectionsUpdate.whyChooseUs = whyChooseUsUpdate;
  if (Object.keys(faqUpdate).length > 0) sectionsUpdate.faq = faqUpdate;
  if (Object.keys(sectionsUpdate).length > 0) configUpdate.sections = sectionsUpdate;

  return configUpdate;
}
