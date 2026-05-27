/**
 * Shape and semantics validator for Firestore `config/{clientId}` documents.
 *
 * Used:
 *  - Server-side in `PUT /api/config/[clientId]` before writing
 *  - Client-side in `client-config-tab.tsx` before sending the save request
 *
 * Returns a list of issues. Severity:
 *  - "error"   → block the save (would break the rendered site)
 *  - "warning" → allow save but surface a visible warning (cosmetic risk)
 *
 * Keep this pure — no I/O, no Firestore calls.
 */

export type ConfigIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

const PLACEHOLDER_NAME_RE = /^sin\s*nombre$/i;
const URL_LIKE_RE = /^(https?:|\/)/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9()\-\s]{6,}$/;
const HH_MM_RE = /^\d{1,2}:\d{2}$/;

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function getNested(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  let cur: unknown = obj;
  for (const key of path.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

export function validateConfig(config: unknown): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (!config || typeof config !== "object") {
    issues.push({ path: "", message: "El config debe ser un objeto.", severity: "error" });
    return issues;
  }

  // ── brand.name ──
  const brandName = getNested(config, "brand.name");
  if (brandName === undefined) {
    // Allowed at intermediate states (e.g. fresh config before first save).
  } else if (typeof brandName !== "string" || !brandName.trim()) {
    issues.push({
      path: "brand.name",
      message: "El nombre del negocio no puede estar vacio. Aparecera en blanco en el splash.",
      severity: "error",
    });
  } else if (PLACEHOLDER_NAME_RE.test(brandName.trim())) {
    issues.push({
      path: "brand.name",
      message: 'El nombre figura como "Sin nombre" — ese es el placeholder del importer, no un nombre real.',
      severity: "error",
    });
  }

  // ── splash.variant ──
  // Legacy variants 1-7 keep working unchanged. The 3D Impact system adds
  // string variants ("impact-scale", "impact-split", "impact-reveal-3d")
  // that the template's splash router recognises.
  const variant = getNested(config, "splash.variant");
  const isNumericVariant = typeof variant === "number" && variant >= 1 && variant <= 7;
  const isImpactVariant =
    typeof variant === "string" &&
    (variant === "impact-scale" || variant === "impact-split" || variant === "impact-reveal-3d");
  if (variant !== undefined && !isNumericVariant && !isImpactVariant) {
    issues.push({
      path: "splash.variant",
      message:
        'splash.variant debe ser un numero 1-7 o uno de "impact-scale" | "impact-split" | "impact-reveal-3d".',
      severity: "error",
    });
  }

  // ── gallery shape ──
  const gallery = getNested(config, "gallery");
  if (gallery !== undefined && gallery !== null) {
    if (!isStringArray(gallery)) {
      issues.push({
        path: "gallery",
        message: "gallery debe ser un array de URLs (string[]). El template renderizara [object Object] en otro caso.",
        severity: "error",
      });
    }
  }

  // ── parallel image arrays ──
  for (const path of [
    "sections.services.images",
    "sections.instagram.images",
  ]) {
    const v = getNested(config, path);
    if (v !== undefined && v !== null && !isStringArray(v)) {
      issues.push({ path, message: `${path} debe ser string[].`, severity: "error" });
    }
  }

  // ── staff[].portfolio + photoUrl ──
  const staff = getNested(config, "staff");
  if (Array.isArray(staff)) {
    staff.forEach((member, i) => {
      if (!member || typeof member !== "object") return;
      const m = member as Record<string, unknown>;
      if (m.portfolio !== undefined && m.portfolio !== null && !isStringArray(m.portfolio)) {
        issues.push({
          path: `staff[${i}].portfolio`,
          message: "El portfolio del miembro debe ser string[].",
          severity: "error",
        });
      }
      if (m.photoUrl !== undefined && m.photoUrl !== null && typeof m.photoUrl !== "string") {
        issues.push({
          path: `staff[${i}].photoUrl`,
          message: "photoUrl debe ser una URL string.",
          severity: "error",
        });
      }
    });
  }

  // ── URL-like fields ──
  const urlFields: { path: string; severity: ConfigIssue["severity"] }[] = [
    { path: "hero.backgroundImage", severity: "warning" },
    { path: "sections.whyChooseUs.mainImage", severity: "warning" },
    { path: "brand.logo", severity: "warning" },
    { path: "brand.logoDark", severity: "warning" },
    { path: "brand.ogImage", severity: "warning" },
  ];
  for (const { path, severity } of urlFields) {
    const v = getNested(config, path);
    if (typeof v === "string" && v.trim() && !URL_LIKE_RE.test(v.trim())) {
      issues.push({
        path,
        message: `${path} no parece una URL valida (debe empezar con http(s):// o /).`,
        severity,
      });
    }
  }

  // ── gallery enabled but empty ──
  const showGallery = getNested(config, "features.showGallery");
  if (showGallery === true && Array.isArray(gallery) && gallery.length === 0) {
    issues.push({
      path: "gallery",
      message: "La galeria esta habilitada pero vacia. La seccion quedara en blanco en la landing.",
      severity: "warning",
    });
  }

  // ── contact.email format ──
  const email = getNested(config, "contact.email");
  if (typeof email === "string" && email.trim() && !EMAIL_RE.test(email.trim())) {
    issues.push({
      path: "contact.email",
      message: "Formato de email invalido.",
      severity: "warning",
    });
  }

  // ── contact.phone format ──
  const phone = getNested(config, "contact.phone");
  if (typeof phone === "string" && phone.trim() && !PHONE_RE.test(phone.trim())) {
    issues.push({
      path: "contact.phone",
      message: "Formato de telefono invalido (usa solo numeros, +, -, espacios y parentesis).",
      severity: "warning",
    });
  }

  // ── testimonials[] ──
  const testimonials = getNested(config, "testimonials");
  if (Array.isArray(testimonials)) {
    testimonials.forEach((t, i) => {
      if (!t || typeof t !== "object") {
        issues.push({ path: `testimonials[${i}]`, message: "Debe ser un objeto.", severity: "error" });
        return;
      }
      const tt = t as Record<string, unknown>;
      if (typeof tt.name !== "string" || !tt.name.trim()) {
        issues.push({ path: `testimonials[${i}].name`, message: "Falta el nombre.", severity: "warning" });
      }
      if (typeof tt.text !== "string" || !tt.text.trim()) {
        issues.push({ path: `testimonials[${i}].text`, message: "Falta el texto del testimonio.", severity: "warning" });
      }
      const r = tt.rating;
      if (typeof r !== "number" || r < 1 || r > 5) {
        issues.push({ path: `testimonials[${i}].rating`, message: "Rating debe ser 1-5.", severity: "warning" });
      }
    });
  }

  // ── whyChooseUs.benefits[] ──
  const benefits = getNested(config, "sections.whyChooseUs.benefits");
  if (Array.isArray(benefits)) {
    benefits.forEach((b, i) => {
      if (!b || typeof b !== "object") {
        issues.push({ path: `sections.whyChooseUs.benefits[${i}]`, message: "Debe ser un objeto.", severity: "error" });
        return;
      }
      const bb = b as Record<string, unknown>;
      if (typeof bb.title !== "string" || !bb.title.trim()) {
        issues.push({ path: `sections.whyChooseUs.benefits[${i}].title`, message: "Falta el titulo.", severity: "warning" });
      }
      if (typeof bb.desc !== "string" || !bb.desc.trim()) {
        issues.push({ path: `sections.whyChooseUs.benefits[${i}].desc`, message: "Falta la descripcion.", severity: "warning" });
      }
      if (typeof bb.iconName !== "string" || !bb.iconName.trim()) {
        issues.push({ path: `sections.whyChooseUs.benefits[${i}].iconName`, message: "Falta el nombre del icono (Lucide).", severity: "warning" });
      }
    });
  }

  // ── staff[] full ──
  if (Array.isArray(staff)) {
    staff.forEach((member, i) => {
      if (!member || typeof member !== "object") return;
      const m = member as Record<string, unknown>;
      // If the member has any non-photo data, name should be present.
      const hasData =
        (typeof m.specialty === "string" && m.specialty.trim()) ||
        (typeof m.bio === "string" && m.bio.trim()) ||
        Array.isArray(m.portfolio) && (m.portfolio as unknown[]).length > 0;
      if (hasData && (typeof m.name !== "string" || !m.name.trim())) {
        issues.push({
          path: `staff[${i}].name`,
          message: "El miembro tiene datos cargados pero le falta el nombre.",
          severity: "warning",
        });
      }
    });
  }

  // ── services[] (custom mode) ──
  const services = getNested(config, "services");
  if (Array.isArray(services)) {
    const seenIds = new Set<string>();
    services.forEach((s, i) => {
      if (!s || typeof s !== "object") {
        issues.push({ path: `services[${i}]`, message: "Debe ser un objeto.", severity: "error" });
        return;
      }
      const sv = s as Record<string, unknown>;
      if (typeof sv.id !== "string" || !sv.id.trim()) {
        issues.push({ path: `services[${i}].id`, message: "Falta el id del servicio.", severity: "error" });
      } else {
        if (seenIds.has(sv.id)) {
          issues.push({ path: `services[${i}].id`, message: `id "${sv.id}" duplicado.`, severity: "error" });
        }
        seenIds.add(sv.id);
      }
      if (typeof sv.name !== "string" || !sv.name.trim()) {
        issues.push({ path: `services[${i}].name`, message: "Falta el nombre del servicio.", severity: "warning" });
      }
      if (typeof sv.duration !== "number" || sv.duration <= 0) {
        issues.push({ path: `services[${i}].duration`, message: "Duracion debe ser un numero mayor a 0.", severity: "warning" });
      }
      if (typeof sv.price !== "number" || sv.price < 0) {
        issues.push({ path: `services[${i}].price`, message: "Precio debe ser un numero >= 0.", severity: "warning" });
      }
    });
  }

  // ── philosophy.pillars[] / process.steps[] (shared shape) ──
  for (const path of ["sections.philosophy.pillars", "sections.process.steps"]) {
    const list = getNested(config, path);
    if (!Array.isArray(list)) continue;
    list.forEach((it, i) => {
      if (!it || typeof it !== "object") {
        issues.push({ path: `${path}[${i}]`, message: "Debe ser un objeto.", severity: "error" });
        return;
      }
      const item = it as Record<string, unknown>;
      const missing: string[] = [];
      if (typeof item.number !== "string" || !item.number.trim()) missing.push("number");
      if (typeof item.title !== "string" || !item.title.trim()) missing.push("title");
      if (typeof item.description !== "string" || !item.description.trim()) missing.push("description");
      if (missing.length > 0) {
        issues.push({
          path: `${path}[${i}]`,
          message: `Falta completar: ${missing.join(", ")}.`,
          severity: "warning",
        });
      }
    });
  }

  // ── ambience.sectors[] ──
  const ambience = getNested(config, "sections.ambience.sectors");
  if (Array.isArray(ambience)) {
    ambience.forEach((s, i) => {
      if (!s || typeof s !== "object") return;
      const sec = s as Record<string, unknown>;
      if (typeof sec.label !== "string" || !sec.label.trim()) {
        issues.push({ path: `sections.ambience.sectors[${i}].label`, message: "Falta el nombre del sector.", severity: "warning" });
      }
      if (typeof sec.imageSrc !== "string" || !sec.imageSrc.trim()) {
        issues.push({ path: `sections.ambience.sectors[${i}].imageSrc`, message: "Falta la imagen del sector.", severity: "warning" });
      }
    });
  }

  // ── portfolio (filters + projects coupled) ──
  const portfolioFilters = getNested(config, "sections.portfolio.filters");
  const portfolioProjects = getNested(config, "sections.portfolio.projects");
  if (Array.isArray(portfolioFilters) || Array.isArray(portfolioProjects)) {
    const filterKeys = new Set<string>();
    if (Array.isArray(portfolioFilters)) {
      portfolioFilters.forEach((f, i) => {
        if (!f || typeof f !== "object") return;
        const ff = f as Record<string, unknown>;
        if (typeof ff.key !== "string" || !ff.key.trim()) {
          issues.push({ path: `sections.portfolio.filters[${i}].key`, message: "Falta key del filtro.", severity: "error" });
        } else {
          if (filterKeys.has(ff.key)) {
            issues.push({ path: `sections.portfolio.filters[${i}].key`, message: `key "${ff.key}" duplicada.`, severity: "error" });
          }
          filterKeys.add(ff.key);
        }
        if (typeof ff.label !== "string" || !ff.label.trim()) {
          issues.push({ path: `sections.portfolio.filters[${i}].label`, message: "Falta label del filtro.", severity: "warning" });
        }
      });
    }
    if (Array.isArray(portfolioProjects)) {
      portfolioProjects.forEach((p, i) => {
        if (!p || typeof p !== "object") return;
        const pp = p as Record<string, unknown>;
        if (typeof pp.title !== "string" || !pp.title.trim()) {
          issues.push({ path: `sections.portfolio.projects[${i}].title`, message: "Falta titulo del proyecto.", severity: "warning" });
        }
        if (typeof pp.filter !== "string" || !pp.filter.trim()) {
          issues.push({ path: `sections.portfolio.projects[${i}].filter`, message: "Falta filtro del proyecto.", severity: "warning" });
        } else if (filterKeys.size > 0 && !filterKeys.has(pp.filter)) {
          issues.push({
            path: `sections.portfolio.projects[${i}].filter`,
            message: `El filtro "${pp.filter}" no existe en sections.portfolio.filters.`,
            severity: "error",
          });
        }
      });
    }
  }

  // ── menu (categories + items coupled) ──
  const menuCategories = getNested(config, "sections.menu.categories");
  const menuItems = getNested(config, "sections.menu.items");
  if (Array.isArray(menuCategories) || Array.isArray(menuItems)) {
    const catKeys = new Set<string>();
    if (Array.isArray(menuCategories)) {
      menuCategories.forEach((c, i) => {
        if (!c || typeof c !== "object") return;
        const cc = c as Record<string, unknown>;
        if (typeof cc.key !== "string" || !cc.key.trim()) {
          issues.push({ path: `sections.menu.categories[${i}].key`, message: "Falta key de la categoria.", severity: "error" });
        } else {
          if (catKeys.has(cc.key)) {
            issues.push({ path: `sections.menu.categories[${i}].key`, message: `key "${cc.key}" duplicada.`, severity: "error" });
          }
          catKeys.add(cc.key);
        }
      });
    }
    const itemIds = new Set<string>();
    if (Array.isArray(menuItems)) {
      menuItems.forEach((it, i) => {
        if (!it || typeof it !== "object") return;
        const item = it as Record<string, unknown>;
        if (typeof item.id !== "string" || !item.id.trim()) {
          issues.push({ path: `sections.menu.items[${i}].id`, message: "Falta id del item.", severity: "error" });
        } else {
          if (itemIds.has(item.id)) {
            issues.push({ path: `sections.menu.items[${i}].id`, message: `id "${item.id}" duplicado.`, severity: "error" });
          }
          itemIds.add(item.id);
        }
        if (typeof item.name !== "string" || !item.name.trim()) {
          issues.push({ path: `sections.menu.items[${i}].name`, message: "Falta el nombre.", severity: "warning" });
        }
        if (typeof item.category !== "string" || !item.category.trim()) {
          issues.push({ path: `sections.menu.items[${i}].category`, message: "Falta la categoria.", severity: "warning" });
        } else if (catKeys.size > 0 && !catKeys.has(item.category)) {
          issues.push({
            path: `sections.menu.items[${i}].category`,
            message: `La categoria "${item.category}" no existe en sections.menu.categories.`,
            severity: "error",
          });
        }
      });
    }
  }

  // ── staff[].schedule shape ──
  if (Array.isArray(staff)) {
    staff.forEach((member, i) => {
      if (!member || typeof member !== "object") return;
      const m = member as Record<string, unknown>;
      const sched = m.schedule;
      if (sched === undefined) return;
      if (!sched || typeof sched !== "object") {
        issues.push({ path: `staff[${i}].schedule`, message: "Debe ser un objeto WeeklySchedule.", severity: "error" });
        return;
      }
      const sc = sched as Record<string, unknown>;
      for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
        const wd = sc[day];
        if (wd === undefined) continue;
        if (!wd || typeof wd !== "object" || Array.isArray(wd)) {
          issues.push({ path: `staff[${i}].schedule.${day}`, message: "Debe ser {isOpen, hours, breaks}.", severity: "error" });
          continue;
        }
        const w = wd as Record<string, unknown>;
        const hours = w.hours as Record<string, unknown> | undefined;
        if (w.isOpen === true && hours && typeof hours.start === "string" && typeof hours.end === "string" && hours.start >= hours.end) {
          issues.push({
            path: `staff[${i}].schedule.${day}`,
            message: `Inicio (${hours.start}) >= cierre (${hours.end}).`,
            severity: "warning",
          });
        }
      }
    });
  }

  // ── hours.* shape ──
  const hours = getNested(config, "hours");
  if (hours && typeof hours === "object") {
    for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
      const range = (hours as Record<string, unknown>)[day];
      if (range == null) continue;
      if (typeof range !== "object" || Array.isArray(range)) {
        issues.push({ path: `hours.${day}`, message: "Debe ser un objeto {start,end} o null.", severity: "error" });
        continue;
      }
      const start = (range as { start?: unknown }).start;
      const end = (range as { end?: unknown }).end;
      if (typeof start !== "string" || !HH_MM_RE.test(start)) {
        issues.push({ path: `hours.${day}.start`, message: "Debe ser HH:mm.", severity: "warning" });
      }
      if (typeof end !== "string" || !HH_MM_RE.test(end)) {
        issues.push({ path: `hours.${day}.end`, message: "Debe ser HH:mm.", severity: "warning" });
      } else if (typeof start === "string" && start >= end) {
        issues.push({
          path: `hours.${day}`,
          message: `Hora de inicio (${start}) no puede ser >= hora de fin (${end}).`,
          severity: "warning",
        });
      }
    }
  }

  return issues;
}

/** Convenience: returns true if any "error" severity issue is present. */
export function hasBlockingIssues(issues: ConfigIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
