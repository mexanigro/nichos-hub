export type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails" | "cafeteria" | "remodelaciones" | "employment";

// N08 T1: ids, nombre (he), duración y precio = presets *.he.ts del template (niche-presets.he.json);
// antes cafetería y remodelaciones tenían ids que el template no conoce. employment no tiene preset.
export type NicheService = { id: string; label: string; duration?: number; price?: number };

export type ServiceVisibilityConfig = {
  visibleServices?: string[] | null;
  features?: Record<string, boolean>;
};

const BUSINESS_NICHES = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones", "employment"] as const;

export const NICHE_SERVICES: Record<BusinessNiche, NicheService[]> = {
  barberia: [
    { id: "haircut", label: "תספורת קלאסית", duration: 30, price: 45 },
    { id: "beard-sculpt", label: "פיסול זקן", duration: 25, price: 35 },
    { id: "straight-shave", label: "גילוח בתער קלאסי", duration: 35, price: 40 },
    { id: "color-treatment", label: "צבע והדגשות", duration: 50, price: 65 },
    { id: "full-ritual", label: "חוויית Ritual מלאה", duration: 75, price: 90 },
  ],
  estetica: [
    { id: "lip-filler", label: "פילר שפתיים", duration: 45, price: 1800 },
    { id: "cheek-filler", label: "פילר לחיים וקו לסת", duration: 50, price: 2200 },
    { id: "botox", label: "בוטוקס", duration: 30, price: 1400 },
    { id: "facial", label: "טיפול פנים סיגנטורי", duration: 60, price: 750 },
    { id: "skin-booster", label: "סקין בוסטר", duration: 45, price: 2000 },
  ],
  tattoo: [
    { id: "consultation", label: "פגישת ייעוץ חינם", duration: 60, price: 0 },
    { id: "custom-design", label: "עיצוב מותאם אישית", duration: 180, price: 180 },
    { id: "fine-line", label: "קו עדין ומינימליזם", duration: 120, price: 150 },
    { id: "black-grey-realism", label: "ריאליזם שחור־אפור", duration: 240, price: 200 },
    { id: "cover-up", label: "כיסוי ושיפור קעקוע", duration: 180, price: 160 },
    { id: "flash-small", label: "פלאש וקטנים", duration: 60, price: 120 },
    { id: "piercing", label: "פירסינג מדויק", duration: 30, price: 80 },
  ],
  nails: [
    { id: "classic-manicure", label: "מניקור קלאסי", duration: 45, price: 45 },
    { id: "gel-manicure", label: "מניקור ג׳ל", duration: 60, price: 65 },
    { id: "acrylic-full-set", label: "סט אקריל מלא", duration: 90, price: 85 },
    { id: "nail-art", label: "אמנות ציפורניים והתאמה אישית", duration: 60, price: 25 },
    { id: "spa-pedicure", label: "פדיקור ספא יוקרתי", duration: 75, price: 75 },
    { id: "extensions-infills", label: "הארכות ומילויים", duration: 60, price: 55 },
  ],
  cafeteria: [
    { id: "espresso", label: "אספרסו קלאסי", duration: 0, price: 0 },
    { id: "cappuccino", label: "קפוצ'ינו רך", duration: 0, price: 0 },
    { id: "flat-white", label: "פלט וויט", duration: 0, price: 0 },
    { id: "cold-brew", label: "קולד ברו", duration: 0, price: 0 },
    { id: "iced-latte", label: "אייס לאטה", duration: 0, price: 0 },
    { id: "frappe-moka", label: "פרפה מוקה", duration: 0, price: 0 },
    { id: "tiramisu", label: "טירמיסו ביתי", duration: 0, price: 0 },
    { id: "cheesecake", label: "עוגת גבינה קרמל", duration: 0, price: 0 },
  ],
  remodelaciones: [
    { id: "consultation", label: "ייעוץ חינם", duration: 60, price: 0 },
    { id: "interior", label: "צביעה פנימית", duration: 0, price: 1200 },
    { id: "exterior", label: "צביעה חיצונית", duration: 0, price: 2500 },
    { id: "deck-fence", label: "צביעת דק וגדר", duration: 0, price: 800 },
  ],
  employment: [
    { id: "job-placement", label: "Job Placement" },
    { id: "resume-review", label: "Resume Review" },
    { id: "interview-prep", label: "Interview Preparation" },
    { id: "career-counseling", label: "Career Counseling" },
    { id: "temp-staffing", label: "Temporary Staffing" },
  ],
};

export const LANDING_SERVICES_DEFAULTS: Record<BusinessNiche, number> = {
  barberia: 4,
  estetica: 2,
  tattoo: 4,
  nails: 3,
  cafeteria: 4,
  remodelaciones: 4,
  employment: 4,
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
