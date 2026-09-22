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
  // `translations.{lang}` (BLOQUE-04 · 4.2) es texto por idioma escrito desde Contenido:
  // no se valida aquí (sólo shape de raíz); el template cae al preset ante claves ausentes.
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
  // string variants ("impact-scale", "impact-split", "impact-reveal-3d"),
  // and the 5-variant system adds "v1"-"v5" — all recognised by the
  // template's splash router.
  const variant = getNested(config, "splash.variant");
  const isNumericVariant = typeof variant === "number" && variant >= 1 && variant <= 7;
  const isImpactVariant =
    typeof variant === "string" &&
    (variant === "impact-scale" || variant === "impact-split" || variant === "impact-reveal-3d");
  const isVNVariant =
    typeof variant === "string" && /^v[1-5]$/.test(variant);
  if (variant !== undefined && !isNumericVariant && !isImpactVariant && !isVNVariant) {
    issues.push({
      path: "splash.variant",
      message:
        'splash.variant debe ser un numero 1-7, "v1"-"v5", o uno de "impact-scale" | "impact-split" | "impact-reveal-3d".',
      severity: "error",
    });
  }

  // ── Sistema de variantes: {seccion}.variant debe ser "v1"-"v9" (v6+ BLOQUE-04) ──
  // Un valor desconocido no rompe el template (resolveVariant cae a "v1"),
  // asi que es warning, no error.
  const V5_VARIANT_PATHS = [
    "hero.variant",
    "hero.statsBar.variant",
    "navbar.variant",
    "footer.variant",
    "sections.services.variant",
    "sections.team.variant",
    "sections.whyChooseUs.variant",
    "sections.gallery.variant",
    "sections.testimonials.variant",
    "sections.instagram.variant",
    "sections.faq.variant",
    "sections.contact.variant",
    "sections.beforeAfter.variant",
  ];
  for (const path of V5_VARIANT_PATHS) {
    const v = getNested(config, path);
    if (v !== undefined && v !== null && !(typeof v === "string" && /^v[1-9]$/.test(v))) {
      issues.push({
        path,
        message: `${path} debe ser "v1"-"v9". El template va a caer al layout original (v1).`,
        severity: "warning",
      });
    }
  }

  // ── Flags globales de estilo (objeto `global`) ──
  const GLOBAL_ENUM_FLAGS: Record<string, readonly string[]> = {
    "global.borderRadius": ["none", "subtle", "rounded", "pill"],
    "global.shadowStyle": ["none", "subtle", "elevated", "dramatic"],
    "global.transitionSpeed": ["none", "fast", "normal", "slow"],
    "global.colorScheme": ["brand", "monochrome", "complementary", "analogous"],
    "global.spacing": ["compact", "normal", "spacious"],
    "global.density": ["dense", "normal", "airy"],
    "global.buttonShape": ["square", "rounded", "pill"],
    "global.dividerStyle": ["none", "line", "gradient", "ornament"],
    "global.animationLevel": ["none", "subtle", "rich"],
    "global.cardStyle": ["flat", "elevated", "bordered", "glass"],
    "global.imageStyle": ["square", "rounded", "circle", "blob"],
    "global.letterSpacing": ["tight", "normal", "wide"],
    "global.lineHeight": ["compact", "normal", "relaxed"],
  };
  for (const [path, allowed] of Object.entries(GLOBAL_ENUM_FLAGS)) {
    const v = getNested(config, path);
    if (v !== undefined && v !== null && !(typeof v === "string" && allowed.includes(v))) {
      issues.push({
        path,
        message: `${path} debe ser uno de: ${allowed.join(" | ")}. El template ignora valores desconocidos.`,
        severity: "warning",
      });
    }
  }
  const overlayOpacity = getNested(config, "global.overlayOpacity");
  if (
    overlayOpacity !== undefined &&
    overlayOpacity !== null &&
    !(typeof overlayOpacity === "number" && overlayOpacity >= 0 && overlayOpacity <= 1)
  ) {
    issues.push({
      path: "global.overlayOpacity",
      message: "global.overlayOpacity debe ser un numero entre 0 y 1.",
      severity: "warning",
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
        !!(typeof m.specialty === "string" && m.specialty.trim()) ||
        !!(typeof m.bio === "string" && m.bio.trim()) ||
        (Array.isArray(m.portfolio) && (m.portfolio as unknown[]).length > 0);
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

  // ══════════════════════════════════════════════════════════════════════
  // 3D Impact system — slot integrity + composition + variant cross-refs
  // ══════════════════════════════════════════════════════════════════════

  const heroObjectsRaw = getNested(config, "heroObjects");
  const heroObjects =
    heroObjectsRaw && typeof heroObjectsRaw === "object" && !Array.isArray(heroObjectsRaw)
      ? (heroObjectsRaw as Record<string, unknown>)
      : null;

  /** A slot is considered "renderable" if it has a base src OR a composition with at least one valid layer. */
  function slotIsRenderable(slot: string | undefined): boolean {
    if (!slot || !heroObjects) return false;
    const data = heroObjects[slot];
    if (!data || typeof data !== "object") return false;
    const d = data as Record<string, unknown>;
    if (typeof d.src === "string" && d.src.trim()) return true;
    const comp = d.composition;
    if (Array.isArray(comp)) {
      return comp.some(
        (layer) =>
          layer &&
          typeof layer === "object" &&
          typeof (layer as Record<string, unknown>).src === "string" &&
          ((layer as Record<string, unknown>).src as string).trim() !== "",
      );
    }
    return false;
  }

  // ── Per-slot composition shape ──
  if (heroObjects) {
    for (const [slotName, slotValue] of Object.entries(heroObjects)) {
      if (!slotValue || typeof slotValue !== "object") continue;
      const slot = slotValue as Record<string, unknown>;
      const comp = slot.composition;
      if (comp === undefined || comp === null) continue;
      if (!Array.isArray(comp)) {
        issues.push({
          path: `heroObjects.${slotName}.composition`,
          message: "composition debe ser un array.",
          severity: "error",
        });
        continue;
      }
      if (comp.length === 0) {
        issues.push({
          path: `heroObjects.${slotName}.composition`,
          message: "El slot tiene un composition vacio. Agrega layers o quitalo para usar la imagen base.",
          severity: "warning",
        });
      }
      comp.forEach((layer, i) => {
        if (!layer || typeof layer !== "object") {
          issues.push({
            path: `heroObjects.${slotName}.composition[${i}]`,
            message: "Cada layer debe ser un objeto.",
            severity: "error",
          });
          return;
        }
        const l = layer as Record<string, unknown>;
        if (typeof l.src !== "string" || !l.src.trim()) {
          issues.push({
            path: `heroObjects.${slotName}.composition[${i}].src`,
            message: "El layer no tiene imagen. El template va a ignorarlo.",
            severity: "error",
          });
        }
      });
    }
  }

  // ── Variant cross-references: slot used by an active 3D variant must be renderable ──
  const heroVariant = getNested(config, "heroVariant");
  if (heroVariant === "hero-3d-object") {
    const slot = (getNested(config, "heroObjectSlot") as string | undefined) ?? "primary";
    if (!slotIsRenderable(slot)) {
      issues.push({
        path: `heroObjects.${slot}`,
        message: `La variante "hero-3d-object" usa el slot "${slot}" pero no tiene imagen aun. La seccion va a caer al fallback legacy.`,
        severity: "warning",
      });
    }
  }

  const galleryVariant = getNested(config, "galleryVariant");
  if (galleryVariant === "portrait-bento-3d-cameo") {
    const slot = (getNested(config, "galleryObjectSlot") as string | undefined) ?? "primary";
    if (!slotIsRenderable(slot)) {
      issues.push({
        path: `heroObjects.${slot}`,
        message: `La variante "portrait-bento-3d-cameo" usa el slot "${slot}" pero no tiene imagen aun.`,
        severity: "warning",
      });
    }
  }

  // ── Splash variants that imply a primary slot ──
  const splashVariantValue = getNested(config, "splash.variant");
  if (splashVariantValue === "impact-scale" || splashVariantValue === "impact-reveal-3d") {
    if (!slotIsRenderable("primary")) {
      issues.push({
        path: "splash.variant",
        message: `La splash variant "${splashVariantValue}" necesita heroObjects.primary configurado. Se va a usar la animacion fallback.`,
        severity: "warning",
      });
    }
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

  issues.push(...validateVariantContracts(config));

  return issues;
}

// ── Contratos de hueco por variante (bloque-04/CONTRATOS-HUECOS.md) ──
// Sólo actúan cuando la sección usa la variante contratada (hero v6, services v6); para el
// resto de variantes y para los seis nichos no añaden nada. Todo es "warning": el template
// recorta o oculta lo que sobra (clampWords/leadSentences), aquí se avisa al editar.
const words = (v: unknown): number =>
  typeof v === "string" ? v.trim().split(/\s+/).filter(Boolean).length : 0;

export function validateVariantContracts(config: unknown): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const warn = (path: string, message: string) => issues.push({ path, message, severity: "warning" });

  if (getNested(config, "hero.variant") === "v6") {
    const eyebrow = getNested(config, "hero.eyebrow");
    if (words(eyebrow) > 4) warn("hero.eyebrow", `El eyebrow tiene ${words(eyebrow)} palabras; el hero v6 admite 4 (se recorta).`);
    const title = ["hero.titlePrefix", "hero.titleHighlight", "hero.titleSuffix"].map((k) => getNested(config, k)).filter((v) => typeof v === "string").join(" ");
    const tw = words(title);
    if (tw > 0 && (tw < 2 || tw > 6)) warn("hero.titlePrefix", `El titular tiene ${tw} palabras; el hero v6 pide 2–6 (con 6 y sufijo ocupa 3 lineas en movil).`);
    const subtitle = getNested(config, "hero.subtitle");
    if (words(subtitle) > 12) warn("hero.subtitle", `La frase tiene ${words(subtitle)} palabras; el hero v6 admite 12 (se recorta).`);
    for (const k of ["hero.ctaPrimary", "hero.ctaSecondary"]) {
      const n = words(getNested(config, k));
      if (n > 2) warn(k, `El CTA tiene ${n} palabras; el hero v6 pide 1–2 (la suma sobre el video no puede pasar de 30).`);
    }
    const video = getNested(config, "hero.video");
    if (video && typeof video === "object") {
      const v = video as Record<string, unknown>;
      if (typeof v.mp4 !== "string" || !v.mp4.trim()) warn("hero.video.mp4", "Hay video sin mp4: el hero cae a la foto.");
      if (typeof v.poster !== "string" || !v.poster.trim()) warn("hero.video.poster", "Video sin poster: hasta que cargue (y con reduced-motion) se ve la foto de fondo; conviene un AVIF del primer cuadro.");
      if (!v.portrait) warn("hero.video.portrait", "Video sin clip 9:16: en movil se recorta el horizontal con cover.");
    }
  }

  if (getNested(config, "sections.services.variant") === "v6") {
    const services = getNested(config, "services");
    const images = getNested(config, "sections.services.images");
    const phone = getNested(config, "contact.phone");
    if (Array.isArray(services)) {
      const list = services.filter((s): s is Record<string, unknown> => !!s && typeof s === "object");
      const popular = list.filter((s) => s.popular === true);
      const rest = list.filter((s) => s.popular !== true);
      const featured = new Set([...popular, ...rest].slice(0, 6));
      list.forEach((s, i) => {
        const nw = words(s.name);
        if (nw > 5) warn(`services[${i}].name`, `El nombre tiene ${nw} palabras; en la tarjeta caben 5 (dos lineas en movil).`);
        if (typeof s.description === "string" && s.description.trim()) {
          const first = s.description.trim().split(/(?<=[.!?…])\s+/)[0];
          if (words(first) > 12) warn(`services[${i}].description`, `La primera oracion tiene ${words(first)} palabras; la tarjeta muestra oraciones completas de hasta 12 (si no, recorta con "…").`);
        }
        if (typeof s.priceMax === "number" && typeof s.price === "number" && s.priceMax < s.price) {
          warn(`services[${i}].priceMax`, "priceMax es menor que price.");
        }
        if (s.mode === "consulta" && (typeof phone !== "string" || !phone.trim())) {
          warn(`services[${i}].mode`, "Servicio a consulta sin contact.phone: no hay a donde enviar la foto por WhatsApp.");
        }
        if (featured.has(s) && Array.isArray(images) && !(typeof images[i] === "string" && (images[i] as string).trim())) {
          warn(`sections.services.images[${i}]`, `Falta la foto del servicio destacado "${String(s.name ?? s.id ?? i)}": la tarjeta P-A sale sin foto.`);
        }
      });
    }
  }

  // CONEXION-02 (B2): producción sólo sirve Storage (https://). Una ruta local en hero.video.* es error, no aviso: el hub no
  // debe guardar lo que el tenant no puede mostrar. Sólo las ocho claves de material; `focus` es texto ("50% 30%").
  const heroVideo = getNested(config, "hero.video");
  if (heroVideo && typeof heroVideo === "object") {
    for (const k of ["mp4", "webm", "poster", "medium.mp4", "medium.webm", "portrait.mp4", "portrait.webm", "portrait.poster"]) {
      const v = getNested(heroVideo, k);
      if (typeof v === "string" && v.trim() && !v.startsWith("https://")) {
        issues.push({ path: `hero.video.${k}`, message: `producción no sirve rutas locales: ${k} debe ser una url https:// de Storage (hay "${v}").`, severity: "error" });
      }
    }
  }

  // CONEXION-03 (B2): lo mismo para la foto de cada servicio — `sections.services.images[i]` presente y sin `https://` es error,
  // no aviso: producción sólo sirve Storage y el hub no debe guardar lo que el tenant no puede mostrar. El hueco vacío ("") no.
  const imagenesServicios = getNested(config, "sections.services.images");
  if (Array.isArray(imagenesServicios)) {
    imagenesServicios.forEach((v, i) => {
      if (typeof v === "string" && v.trim() && !v.startsWith("https://")) {
        issues.push({ path: `sections.services.images[${i}]`, message: `producción no sirve rutas locales: la foto del servicio ${i + 1} debe ser una url https:// de Storage (hay "${v}").`, severity: "error" });
      }
    });
  }

  issues.push(...validateReplanteoHuecos(config));
  return issues;
}

// ── Huecos de REPLANTEO-01 (2026-09-19; CONTRATOS-HUECOS § huecos de REPLANTEO-01) ──
// Campos nuevos sin UI todavía (la UI va al bloque 5): `sections.services.featured` (2 ids del catálogo),
// `sections.gallery.selection` (4–6 índices de `gallery`), `branding.localPhoto`/`localPhotoMobile` (par),
// `sections.<id>.surface: "velo" | "liso"` (+ `veil` 0–1) y `branding.heroToBackdrop` (R19).
// Errores sólo donde el template no puede resolverlo (id o índice inexistente, duplicados, veil fuera de 0–1).
const SECTION_IDS = ["services", "gallery", "team", "testimonials", "faq", "instagram", "contact"] as const;
/** GALERIA-04: tipos del brief de peluquería, orden fijo (= píldoras de `/galeria`; mismo listado que T `src/lib/gallery.ts`). */
export const GALLERY_TYPES = ["color", "rizos", "liso", "recogidos", "novia", "cortes"] as const;
export function validateReplanteoHuecos(config: unknown): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const push = (path: string, message: string, severity: "error" | "warning") => issues.push({ path, message, severity });

  const featured = getNested(config, "sections.services.featured");
  if (featured !== undefined) {
    const services = getNested(config, "services");
    const ids = new Set(Array.isArray(services) ? services.map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).id ?? "") : "")) : []);
    if (!Array.isArray(featured) || !featured.every((v) => typeof v === "string")) {
      push("sections.services.featured", "featured debe ser una lista de ids de servicios.", "error");
    } else {
      // CONEXION-03 (D-41): `featured` es ORDEN, no cantidad — services v6 muestra todas y las ordena por esta lista, así que
      // cualquier longitud es válida. Sólo es error lo que el template no puede resolver (id inexistente o repetido).
      if (new Set(featured).size !== featured.length) push("sections.services.featured", "featured repite un id.", "error");
      for (const id of featured) if (!ids.has(id)) push("sections.services.featured", `El servicio "${id}" no existe en el catálogo.`, "error");
    }
  }

  // GALERIA-04 (2026-09-20, CONTRATOS § página `/galeria`): `sections.gallery.items[]` = galería completa con tipo del brief
  // (fuente cuando existe; `gallery[]` queda como respaldo sin tipo); `selection` por id de items (o por índice de gallery, histórico).
  const items = getNested(config, "sections.gallery.items");
  const services = getNested(config, "services");
  const serviceIds = new Set(Array.isArray(services) ? services.map((s) => (s && typeof s === "object" ? String((s as Record<string, unknown>).id ?? "") : "")) : []);
  const itemIds = new Set<string>();
  if (items !== undefined) {
    if (!Array.isArray(items)) push("sections.gallery.items", "items debe ser una lista de { id, src, type?, alt?, serviceId? }.", "error");
    else {
      items.forEach((it, i) => {
        const o = it && typeof it === "object" ? (it as Record<string, unknown>) : null;
        if (!o || typeof o.id !== "string" || !o.id.trim() || typeof o.src !== "string" || !o.src.trim()) { push(`sections.gallery.items[${i}]`, "Cada pieza necesita id y src.", "error"); return; }
        if (itemIds.has(o.id)) push(`sections.gallery.items[${i}].id`, `El id "${o.id}" está repetido.`, "error"); itemIds.add(o.id);
        if (o.type !== undefined && !GALLERY_TYPES.includes(o.type as (typeof GALLERY_TYPES)[number])) push(`sections.gallery.items[${i}].type`, `El tipo "${String(o.type)}" no es del brief (${GALLERY_TYPES.join(" · ")}).`, "error");
        if (o.serviceId !== undefined && !serviceIds.has(String(o.serviceId))) push(`sections.gallery.items[${i}].serviceId`, `El servicio "${String(o.serviceId)}" no existe en el catálogo.`, "error");
        if (typeof o.alt !== "string" || !o.alt.trim()) push(`sections.gallery.items[${i}].alt`, "alt obligatorio (GALERIA-05 A2): tipo + una frase corta en el idioma base.", "error");
      });
      // GALERIA-05: en otro idioma el alt llega por translations[lang].sections.gallery.alts[id]; sin él, el template pone la etiqueta del tipo (se avisa).
      const tr = getNested(config, "translations");
      if (tr && typeof tr === "object") {
        for (const [lang, layer] of Object.entries(tr as Record<string, unknown>)) {
          const alts = getNested(layer, "sections.gallery.alts");
          if (alts === undefined) { push(`translations.${lang}.sections.gallery.alts`, `Sin alt de galería en ${lang}: el template usa la etiqueta del tipo.`, "warning"); continue; }
          if (!alts || typeof alts !== "object" || Array.isArray(alts)) { push(`translations.${lang}.sections.gallery.alts`, "alts debe ser un objeto { id: alt }.", "error"); continue; }
          for (const [id, v] of Object.entries(alts as Record<string, unknown>)) {
            if (!itemIds.has(id)) push(`translations.${lang}.sections.gallery.alts.${id}`, `La pieza "${id}" no existe en sections.gallery.items.`, "warning");
            if (typeof v !== "string" || !v.trim()) push(`translations.${lang}.sections.gallery.alts.${id}`, "alt vacío.", "error");
          }
          for (const id of itemIds) if (!(id in (alts as Record<string, unknown>))) push(`translations.${lang}.sections.gallery.alts.${id}`, `Falta el alt de "${id}" en ${lang}: el template usa la etiqueta del tipo.`, "warning");
        }
      }
      if (items.length > 0 && items.length < 3) push("sections.gallery.items", `items tiene ${items.length} piezas; la galería de la home necesita ≥ 3 (con 3–5 se colapsan celdas).`, "warning");
    }
  }

  const selection = getNested(config, "sections.gallery.selection");
  if (selection !== undefined) {
    const gallery = getNested(config, "gallery");
    const n = Array.isArray(gallery) ? gallery.length : 0;
    const porId = Array.isArray(items) && items.length > 0;
    const ok = (v: unknown) => (porId ? typeof v === "string" : Number.isInteger(v) && (v as number) >= 0);
    if (!Array.isArray(selection) || !selection.every(ok)) {
      push("sections.gallery.selection", porId ? "selection debe ser una lista de ids de sections.gallery.items." : "selection debe ser una lista de índices (enteros ≥ 0) de gallery.", "error");
    } else {
      if (selection.length < 4 || selection.length > 6) push("sections.gallery.selection", `selection tiene ${selection.length} fotos; la home muestra 4–6 (D4).`, "warning");
      if (new Set(selection).size !== selection.length) push("sections.gallery.selection", porId ? "selection repite un id." : "selection repite un índice.", "error");
      for (const v of selection) {
        if (porId) { if (!itemIds.has(v as string)) push("sections.gallery.selection", `La pieza "${String(v)}" no existe en sections.gallery.items.`, "error"); }
        else if ((v as number) >= n) push("sections.gallery.selection", `La foto ${String(v)} no existe: gallery tiene ${n}.`, "error");
      }
    }
  }

  const local = getNested(config, "branding.localPhoto");
  const localMobile = getNested(config, "branding.localPhotoMobile");
  const isUrl = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  if (local !== undefined && !isUrl(local)) push("branding.localPhoto", "localPhoto debe ser una URL/ruta de imagen.", "error");
  if (localMobile !== undefined && !isUrl(localMobile)) push("branding.localPhotoMobile", "localPhotoMobile debe ser una URL/ruta de imagen.", "error");
  if (isUrl(local) && !isUrl(localMobile)) push("branding.localPhotoMobile", "Hay foto del local de escritorio sin la vertical: en móvil se recorta la de escritorio (D5).", "warning");
  if (isUrl(localMobile) && !isUrl(local)) push("branding.localPhoto", "Hay foto del local vertical sin la de escritorio: la capa fija no se monta y todo va liso (D5).", "warning");
  if (isUrl(local) && getNested(config, "hero.video") && getNested(config, "branding.heroToBackdrop") === undefined) {
    push("branding.heroToBackdrop", "Hay vídeo del hero y foto del local sin la relación hero → fondo escrita (R19: mismo tono · tono vecino · luz distinta).", "warning");
  }
  const rel = getNested(config, "branding.heroToBackdrop");
  if (rel !== undefined) {
    const r = (rel && typeof rel === "object" ? rel : {}) as Record<string, unknown>;
    if (!["same-hue", "adjacent-hue", "same-hue-different-light"].includes(String(r.relation))) push("branding.heroToBackdrop.relation", "relation debe ser same-hue | adjacent-hue | same-hue-different-light.", "error");
    if (!["photo-starts-at-hero-end", "scrim-dies-into-photo", "veil-from-first-pixel"].includes(String(r.mechanism))) push("branding.heroToBackdrop.mechanism", "mechanism debe ser photo-starts-at-hero-end | scrim-dies-into-photo | veil-from-first-pixel.", "error");
  }

  // REPLANTEO-02 (D17 · R21): modo de la paleta y textura
  const mode = getNested(config, "branding.mode");
  if (mode !== undefined && mode !== "light" && mode !== "dark") push("branding.mode", "branding.mode debe ser light | dark (D17: el modo es de la paleta, por web).", "error");
  const texture = getNested(config, "branding.texture");
  if (texture !== undefined && !isUrl(texture)) push("branding.texture", "texture debe ser una URL/ruta de imagen (R21: mosaico 1024 sin costuras o imagen 2560).", "error");
  if (rel && typeof rel === "object") {
    const foot = (rel as Record<string, unknown>).foot as Record<string, unknown> | undefined;
    if (foot !== undefined && !(foot && typeof foot === "object" && /^#[0-9a-f]{6}$/i.test(String(foot.hex)))) push("branding.heroToBackdrop.foot", "foot debe llevar hex (#rrggbb) del pie del clip (transicion.mjs).", "error");
  }
  for (const id of SECTION_IDS) {
    const surface = getNested(config, `sections.${id}.surface`);
    if (surface !== undefined && !["base", "alt", "velo", "liso", "textura"].includes(String(surface))) push(`sections.${id}.surface`, "surface debe ser velo | textura (liso, base y alt son históricos).", "error");
    const veil = getNested(config, `sections.${id}.veil`);
    if (veil !== undefined && !(typeof veil === "number" && veil >= 0 && veil <= 1)) push(`sections.${id}.veil`, "veil es la opacidad del velo, 0–1.", "error");
    if (veil !== undefined && surface !== "velo") push(`sections.${id}.veil`, 'veil sólo actúa con surface: "velo".', "warning");
  }
  return issues;
}

/** Convenience: returns true if any "error" severity issue is present. */
export function hasBlockingIssues(issues: ConfigIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
