export type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails" | "cafeteria" | "remodelaciones";

export type NicheService = { id: string; label: string };

export type ServiceVisibilityConfig = {
  visibleServices?: string[] | null;
  features?: Record<string, boolean>;
};

const BUSINESS_NICHES = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"] as const;

export const NICHE_SERVICES: Record<BusinessNiche, NicheService[]> = {
  barberia: [
    { id: "haircut", label: "Haircut" },
    { id: "beard-sculpt", label: "Beard Sculpture" },
    { id: "straight-shave", label: "Straight Razor Shave" },
    { id: "color-treatment", label: "Color & Tint" },
    { id: "full-ritual", label: "The Full Ritual" },
  ],
  estetica: [
    { id: "lip-filler", label: "Lip Filler" },
    { id: "cheek-filler", label: "Cheek & Jawline Filler" },
    { id: "botox", label: "Botox" },
    { id: "facial", label: "Signature Facial" },
    { id: "skin-booster", label: "Skin Booster" },
  ],
  tattoo: [
    { id: "consultation", label: "Consultation" },
    { id: "custom-design", label: "Custom Design" },
    { id: "fine-line", label: "Fine Line" },
    { id: "black-grey-realism", label: "Black & Grey Realism" },
    { id: "cover-up", label: "Cover-Up" },
    { id: "flash-small", label: "Flash & Small" },
    { id: "piercing", label: "Piercing" },
  ],
  nails: [
    { id: "classic-manicure", label: "Classic Manicure" },
    { id: "gel-manicure", label: "Gel Manicure" },
    { id: "acrylic-full-set", label: "Acrylic Full Set" },
    { id: "nail-art", label: "Nail Art" },
    { id: "spa-pedicure", label: "Spa Pedicure" },
    { id: "extensions-infills", label: "Extensions & Infills" },
  ],
  cafeteria: [
    { id: "espresso", label: "Espresso & Coffee" },
    { id: "pastries", label: "Pastries & Bakery" },
    { id: "brunch", label: "Brunch" },
    { id: "specialty-drinks", label: "Specialty Drinks" },
    { id: "sandwiches", label: "Sandwiches & Light Meals" },
  ],
  remodelaciones: [
    { id: "interior-painting", label: "Interior Painting" },
    { id: "exterior-painting", label: "Exterior Painting" },
    { id: "kitchen-remodel", label: "Kitchen Remodeling" },
    { id: "bathroom-remodel", label: "Bathroom Remodeling" },
    { id: "flooring", label: "Flooring" },
    { id: "general-renovation", label: "General Renovation" },
  ],
};

export function normalizeBusinessNiche(raw: unknown, fallback: BusinessNiche = "barberia"): BusinessNiche {
  if (typeof raw !== "string") return fallback;

  const value = raw.trim().toLowerCase();
  if (value === "otro") return "estetica";
  if ((BUSINESS_NICHES as readonly string[]).includes(value)) {
    return value as BusinessNiche;
  }

  return fallback;
}

export function getNicheServices(niche: unknown): NicheService[] {
  return NICHE_SERVICES[normalizeBusinessNiche(niche)];
}

function orderKnownServiceIds(ids: string[], services: NicheService[]): string[] {
  const selected = new Set(ids);
  return services.map((service) => service.id).filter((id) => selected.has(id));
}

/**
 * Contract shared with master-template:
 * - features.showServices === false => the services section is hidden (0 visible).
 * - visibleServices missing/null while showServices is true/undefined => all preset services.
 * - visibleServices with IDs => allow-list and order for the services to render.
 *
 * Do not persist [] to mean "0 visible": the current template treats an empty
 * array the same as "not configured" and would show all preset services.
 * Persist null instead when clearing the allow-list; the API converts null to
 * FieldValue.delete() so Firestore does not keep stale IDs after a merge save.
 */
export function resolveVisibleServiceIds(config: ServiceVisibilityConfig, services: NicheService[]): string[] {
  if (config.features?.showServices === false) return [];
  if (!Array.isArray(config.visibleServices)) {
    return services.map((service) => service.id);
  }
  return orderKnownServiceIds(config.visibleServices, services);
}

export function toPersistedVisibleServices(selectedIds: string[], services: NicheService[]): string[] | null {
  const ordered = orderKnownServiceIds(selectedIds, services);
  if (ordered.length === services.length) return null;
  if (ordered.length === 0) return null;
  return ordered;
}

export function toggleVisibleService(
  config: ServiceVisibilityConfig,
  services: NicheService[],
  serviceId: string,
): ServiceVisibilityConfig {
  const allIds = services.map((service) => service.id);
  if (!allIds.includes(serviceId)) return config;

  const current = resolveVisibleServiceIds(config, services);
  const nextSet = new Set(current);
  if (nextSet.has(serviceId)) {
    nextSet.delete(serviceId);
  } else {
    nextSet.add(serviceId);
  }

  const selectedIds = allIds.filter((id) => nextSet.has(id));
  return {
    ...config,
    features: {
      ...config.features,
      showServices: selectedIds.length > 0,
    },
    visibleServices: toPersistedVisibleServices(selectedIds, services),
  };
}
