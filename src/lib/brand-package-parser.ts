/**
 * Brand Package Parser
 *
 * Pure client-side logic that takes a list of Files (from a folder drop)
 * and produces a normalized brand configuration ready to apply.
 *
 * Handles varying JSON formats from brand packages:
 *   - brand-data.json / brand-tokens.json
 *   - Different key names for colors, assets, brand name
 *   - Different filename conventions for logos
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Types
 * ═══════════════════════════════════════════════════════════════════════════ */

export type ImageRole =
  | "logo" | "logoDark" | "ogImage" | "favicon"
  | "heroBackground" | "whyChooseUsImage"
  | "serviceImage" | "galleryImage" | "instagramImage";

/** How a role was detected — used for UI badges */
export type DetectionMethod = "filename" | "json" | "dimensions" | "manual";

export interface RoleMeta {
  label: string;
  description: string;
  configPath: string;
  isArray: boolean;
  group: "branding" | "contenido" | "galeria";
}

export const ROLE_META: Record<ImageRole, RoleMeta> = {
  logo:             { label: "Logo (fondo claro)", description: "Header, footer", configPath: "brand.logo", isArray: false, group: "branding" },
  logoDark:         { label: "Logo (fondo oscuro)", description: "Header oscuro, splash", configPath: "brand.logoDark", isArray: false, group: "branding" },
  ogImage:          { label: "OG Image", description: "Previews en redes sociales", configPath: "brand.ogImage", isArray: false, group: "branding" },
  // Template uses `brand.faviconEmoji` (an emoji char), not a URL — see master-template/src/types.ts.
  // We still detect favicon files so they don't pollute other roles, but we don't write the
  // upload URL anywhere. The owner sets the emoji manually in the Branding section.
  favicon:          { label: "Favicon (no aplicable)", description: "El template usa un emoji, no URL — configuralo en Marca", configPath: "_unused.favicon", isArray: false, group: "branding" },
  heroBackground:   { label: "Hero (fondo)", description: "Imagen principal de la landing", configPath: "hero.backgroundImage", isArray: false, group: "contenido" },
  whyChooseUsImage: { label: "Por que elegirnos", description: "Seccion why-choose-us", configPath: "sections.whyChooseUs.mainImage", isArray: false, group: "contenido" },
  serviceImage:     { label: "Servicio", description: "Cards de servicios", configPath: "sections.services.images", isArray: true, group: "galeria" },
  galleryImage:     { label: "Galeria", description: "Seccion galeria", configPath: "gallery", isArray: true, group: "galeria" },
  instagramImage:   { label: "Instagram", description: "Feed de Instagram", configPath: "sections.instagram.images", isArray: true, group: "galeria" },
};

export interface MappedImage {
  file: File;
  role: ImageRole | null;
  previewUrl: string;
  filename: string;
  detectedBy?: DetectionMethod;
  /** Natural dimensions — populated async after initial parse */
  width?: number;
  height?: number;
}

export interface ParsedBrandPackage {
  brandName: string;
  colors: {
    accent: string;
    accentLight: string;
    surfaceDark: string;
  };
  /** Every color found in the JSON/CSS, keyed by its original name */
  allColors: Record<string, string>;
  /** Images with detected roles */
  images: MappedImage[];
  /** Typography info — persisted to Firestore */
  typography?: { display?: string; body?: string };
  /** Raw parsed JSON for reference */
  rawJson: Record<string, unknown>;
  /** True when colors came from canvas extraction (no JSON/CSS) */
  colorsFromImage?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Color utilities
 * ═══════════════════════════════════════════════════════════════════════════ */

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isValidHex(s: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s);
}

function normalizeHex(s: string): string {
  const clean = s.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const [, a, b, c] = clean;
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return clean.toLowerCase();
}

/** Lighten a hex color by delta percentage points in HSL lightness */
export function lightenHex(hex: string, delta: number): string {
  const { h, s, l } = hexToHSL(hex);
  return hslToHex(h, s, Math.min(100, l + delta));
}

/* ═══════════════════════════════════════════════════════════════════════════
 * JSON detection & parsing
 * ═══════════════════════════════════════════════════════════════════════════ */

async function findAndParseJson(files: File[]): Promise<Record<string, unknown> | null> {
  // Priority: files named brand-data.json or brand-tokens.json
  const jsonFiles = files.filter((f) => f.name.endsWith(".json"));
  const branded = jsonFiles.find((f) => /brand[-_]?(data|tokens)/i.test(f.name));
  const target = branded ?? jsonFiles[0];

  if (!target) return null;

  const text = await target.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * CSS variable parsing
 * ═══════════════════════════════════════════════════════════════════════════ */

interface CssParsed {
  colors: Record<string, string>;
  fonts: { display?: string; body?: string };
}

async function findAndParseCss(files: File[]): Promise<CssParsed> {
  const cssFiles = files.filter((f) => f.name.endsWith(".css"));
  const branded = cssFiles.find((f) => /brand[-_]?(tokens?|data)/i.test(f.name) || /tokens/i.test(f.name));
  const target = branded ?? cssFiles[0];

  if (!target) return { colors: {}, fonts: {} };

  const text = await target.text();
  const colors: Record<string, string> = {};
  const fonts: { display?: string; body?: string } = {};

  // Extract CSS custom properties with hex color values
  const colorRegex = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b/g;
  let match: RegExpExecArray | null;
  while ((match = colorRegex.exec(text)) !== null) {
    const name = match[1].replace(/^color-/, "");
    const hex = normalizeHex(match[2]);
    if (isValidHex(hex)) colors[name] = hex;
  }

  // Extract font family values
  const fontRegex = /--([\w-]*(?:font|typeface|family)[\w-]*)\s*:\s*['"]?([^;'"]+)['"]?\s*;/gi;
  while ((match = fontRegex.exec(text)) !== null) {
    const key = match[1].toLowerCase();
    const val = match[2].trim().replace(/['",]/g, "").trim();
    if (/display|heading|serif|title/i.test(key)) fonts.display = val;
    else if (/body|text|sans|ui/i.test(key)) fonts.body = val;
    else if (!fonts.display) fonts.display = val; // first unmatched → display
  }

  return { colors, fonts };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Brand name extraction
 * ═══════════════════════════════════════════════════════════════════════════ */

function extractBrandName(json: Record<string, unknown> | null, files?: File[]): string {
  if (json) {
    // Try common keys
    for (const key of ["brandName", "brand", "name", "businessName"]) {
      if (typeof json[key] === "string" && json[key]) return json[key] as string;
    }
    // Try nested
    const og = json.og as Record<string, unknown> | undefined;
    if (og && typeof og.title === "string") return og.title;
  }

  // Fallback: extract from folder name via webkitRelativePath
  if (files && files.length > 0) {
    const firstPath = files[0].webkitRelativePath;
    if (firstPath) {
      const folderName = firstPath.split("/")[0];
      if (folderName) {
        const cleaned = folderName
          .replace(/[-_]?brand[-_]?package/gi, "")
          .replace(/[-_]?v\d+$/i, "")
          .replace(/[_-]/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        if (cleaned) return cleaned;
      }
    }
  }

  // Return empty so the UI can flag the field instead of persisting a placeholder.
  return "";
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Color extraction & mapping
 * ═══════════════════════════════════════════════════════════════════════════ */

function extractAllColors(json: Record<string, unknown>): Record<string, string> {
  const colors: Record<string, string> = {};

  function crawl(obj: unknown, prefix: string) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof val === "string" && isValidHex(val)) {
        const label = prefix ? `${prefix}.${key}` : key;
        colors[label] = normalizeHex(val);
      } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        crawl(val, prefix ? `${prefix}.${key}` : key);
      }
    }
  }

  // Check known color containers first
  for (const containerKey of ["colors", "palette", "webTokens", "web_tokens"]) {
    if (json[containerKey] && typeof json[containerKey] === "object") {
      crawl(json[containerKey], "");
    }
  }

  // If nothing found, crawl the entire JSON
  if (Object.keys(colors).length === 0) {
    crawl(json, "");
  }

  return colors;
}

/** Score keywords to determine which color serves as accent, accentLight, surfaceDark */
function mapColors(allColors: Record<string, string>): {
  accent: string;
  accentLight: string;
  surfaceDark: string;
} {
  const entries = Object.entries(allColors);
  if (entries.length === 0) {
    return { accent: "#d97706", accentLight: "#f59e0b", surfaceDark: "#09090b" };
  }

  // --- Accent (primary brand color) ---
  const accentKeywords = /primary|accent|cta|caramel|copper|rust|brand|main|azul_cielo|sand/i;
  const darkKeywords = /dark|black|charcoal|rich|profundo|panel|background/i;
  const lightKeywords = /cream|white|blanco|light|claro|oat|warm|soft|beige/i;
  const accentLightKeywords = /light|hover|soft|secondary|blush|latte|accentLight/i;
  const surfaceDarkKeywords = /dark|black|charcoal|rich|profundo|panel|surface/i;

  let accent: string | null = null;
  let accentLight: string | null = null;
  let surfaceDark: string | null = null;

  // Pass 1: keyword-based matching
  for (const [key, hex] of entries) {
    const { l } = hexToHSL(hex);

    if (!accent && accentKeywords.test(key) && l > 15 && l < 80) {
      accent = hex;
    }
    if (!accentLight && accentLightKeywords.test(key) && l > 30 && l < 90) {
      accentLight = hex;
    }
    if (!surfaceDark && surfaceDarkKeywords.test(key) && l < 20) {
      surfaceDark = hex;
    }
  }

  // Pass 2: fallback by luminosity if keywords didn't match
  if (!accent) {
    // Pick the most "colorful" mid-range color (highest saturation, mid lightness)
    let bestScore = -1;
    for (const [, hex] of entries) {
      const { s, l } = hexToHSL(hex);
      if (l > 15 && l < 80) {
        const score = s * (1 - Math.abs(l - 45) / 45);
        if (score > bestScore) {
          bestScore = score;
          accent = hex;
        }
      }
    }
  }

  accent = accent || entries[0][1];

  if (!accentLight) {
    accentLight = lightenHex(accent, 15);
  }

  if (!surfaceDark) {
    // Find darkest color
    let darkest = "#09090b";
    let darkestL = 100;
    for (const [, hex] of entries) {
      const { l } = hexToHSL(hex);
      if (l < darkestL && l < 20) {
        darkestL = l;
        darkest = hex;
      }
    }
    surfaceDark = darkestL < 20 ? darkest : "#09090b";
  }

  // Ensure accentLight is actually lighter than accent
  const accentL = hexToHSL(accent).l;
  const accentLightL = hexToHSL(accentLight).l;
  if (accentLightL <= accentL) {
    accentLight = lightenHex(accent, 15);
  }

  return { accent, accentLight, surfaceDark };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Typography extraction
 * ═══════════════════════════════════════════════════════════════════════════ */

function extractTypography(
  json: Record<string, unknown> | null,
  cssFonts?: { display?: string; body?: string },
): { display?: string; body?: string } | undefined {
  let display: string | undefined;
  let body: string | undefined;

  if (json) {
    // Try nested under various container keys
    for (const containerKey of ["typography", "fonts", "fontFamily", "typeface"]) {
      const container = json[containerKey] as Record<string, string> | undefined;
      if (!container || typeof container !== "object") continue;

      display = display || container.display || container.displayHeadings || container.latin_headings
        || container.headings || container.heading || container.title || container.serif;
      body = body || container.body || container.bodyUi || container.body_ui
        || container.text || container.sans || container.ui;
    }
  }

  // CSS fallback
  if (cssFonts) {
    display = display || cssFonts.display;
    body = body || cssFonts.body;
  }

  if (!display && !body) return undefined;
  return { display, body };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Image role detection
 * ═══════════════════════════════════════════════════════════════════════════ */

const ROLE_PATTERNS: Record<ImageRole, RegExp[]> = {
  logo: [
    /logo[-_]?prim/i,
    /logo[-_]?principal(?![-_]light)/i,
    /primary[-_]?logo/i,
    /logo[-_]?primary[-_]?light/i,
    /logo[-_]?principal[-_]?light/i,
  ],
  logoDark: [
    /logo[-_]?revers/i,
    /logo[-_]?negativ/i,
    /logo[-_]?dark/i,
    /reversed[-_]?logo/i,
    /logo[-_]?reversed[-_]?dark/i,
  ],
  ogImage: [
    /og[-_]?image/i,
    /opengraph/i,
  ],
  favicon: [
    /favicon/i,
  ],
  heroBackground: [
    /hero/i,
    /banner/i,
    /header[-_]?bg/i,
    /portada/i,
    /cover[-_]?photo/i,
  ],
  whyChooseUsImage: [
    /why[-_]?choose/i,
    /about[-_]?us/i,
    /nosotros/i,
    /por[-_]?que/i,
  ],
  serviceImage: [
    /servic/i,
    /treatment/i,
    /tratamiento/i,
    /work[-_]?\d/i,
  ],
  galleryImage: [
    /galler/i,
    /portfolio/i,
    /show[-_]?case/i,
    /result/i,
    /antes[-_]?despues/i,
  ],
  instagramImage: [
    /instagram/i,
    /insta[-_]?feed/i,
    /social[-_]?media/i,
  ],
};

/** Filenames to skip entirely (reference boards, not uploadable assets) */
const SKIP_PATTERNS = [
  /board/i,
  /guidelines/i,
  /suite/i,
  /reference/i,
  /original_generated/i,
];

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif|avif|ico)$/i.test(file.name);
}

function detectImageRole(filename: string): { role: ImageRole; method: DetectionMethod } | null {
  // Check skip patterns first
  if (SKIP_PATTERNS.some((p) => p.test(filename))) return null;

  for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
    if (patterns.some((p) => p.test(filename))) {
      return { role: role as ImageRole, method: "filename" };
    }
  }

  return null;
}

/* ── Dimension-based role inference ─────────────────────────────────── */

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

async function inferRoleByDimensions(images: MappedImage[]): Promise<void> {
  // Load dimensions for all images in parallel
  await Promise.all(
    images.map(async (img) => {
      try {
        const dims = await loadImageDimensions(img.previewUrl);
        img.width = dims.width;
        img.height = dims.height;
      } catch {
        // skip images that fail to load
      }
    }),
  );

  // Track which single roles are already assigned
  const assignedSingle = new Set<ImageRole>(
    images.filter((i) => i.role && !ROLE_META[i.role].isArray).map((i) => i.role!),
  );

  for (const img of images) {
    if (img.role !== null || !img.width || !img.height) continue;

    const { width, height } = img;
    const ratio = width / height;

    // Favicon: tiny square
    if (width <= 64 && height <= 64) {
      if (!assignedSingle.has("favicon")) {
        img.role = "favicon";
        img.detectedBy = "dimensions";
        assignedSingle.add("favicon");
        continue;
      }
    }

    // OG Image: ~1.91:1 aspect ratio, wide
    if (ratio > 1.7 && ratio < 2.1 && width >= 1000 && width <= 1400) {
      if (!assignedSingle.has("ogImage")) {
        img.role = "ogImage";
        img.detectedBy = "dimensions";
        assignedSingle.add("ogImage");
        continue;
      }
    }

    // Logo: very wide, short height
    if (width >= 3 * height && height < 200) {
      if (!assignedSingle.has("logo")) {
        img.role = "logo";
        img.detectedBy = "dimensions";
        assignedSingle.add("logo");
      } else if (!assignedSingle.has("logoDark")) {
        img.role = "logoDark";
        img.detectedBy = "dimensions";
        assignedSingle.add("logoDark");
      }
      continue;
    }

    // Hero: large landscape
    if (width >= 1200 && ratio > 1.4) {
      if (!assignedSingle.has("heroBackground")) {
        img.role = "heroBackground";
        img.detectedBy = "dimensions";
        assignedSingle.add("heroBackground");
        continue;
      }
    }
  }

  // Second pass: assign remaining unassigned medium images to gallery/service
  for (const img of images) {
    if (img.role !== null || !img.width || !img.height) continue;

    const { width, height } = img;
    const ratio = width / height;

    // Square-ish, medium size → gallery
    if (ratio >= 0.7 && ratio <= 1.4 && width >= 400 && width <= 1200) {
      img.role = "galleryImage";
      img.detectedBy = "dimensions";
      continue;
    }

    // Remaining medium+ images → service
    if (width >= 300 && height >= 200) {
      img.role = "serviceImage";
      img.detectedBy = "dimensions";
    }
  }
}

/* ── Canvas-based color extraction (fallback for image-only packages) ── */

async function extractColorsFromImages(images: MappedImage[]): Promise<Record<string, string>> {
  // Find the largest non-logo image
  const candidates = images
    .filter((img) => img.width && img.height && img.role !== "logo" && img.role !== "logoDark" && img.role !== "favicon")
    .sort((a, b) => (b.width! * b.height!) - (a.width! * a.height!));

  if (candidates.length === 0) return {};

  // Sample up to 3 images
  const toSample = candidates.slice(0, 3);
  const allPixelColors: { h: number; s: number; l: number; count: number }[] = [];

  for (const img of toSample) {
    try {
      const colors = await sampleImageColors(img.previewUrl);
      allPixelColors.push(...colors);
    } catch {
      // skip
    }
  }

  if (allPixelColors.length === 0) return {};

  // Merge similar colors (HSL distance < 20)
  const merged = mergeCloseColors(allPixelColors);

  // Sort by count descending, take top 5
  merged.sort((a, b) => b.count - a.count);
  const top = merged.slice(0, 5);

  const result: Record<string, string> = {};
  top.forEach((c, i) => {
    result[`imagen_${i + 1}`] = hslToHex(c.h, c.s, c.l);
  });

  return result;
}

function sampleImageColors(url: string): Promise<{ h: number; s: number; l: number; count: number }[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        const buckets: Map<string, { h: number; s: number; l: number; count: number }> = new Map();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          const a = data[i + 3] / 255;
          if (a < 0.5) continue; // skip transparent

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = ((max + min) / 2) * 100;
          if (l < 5 || l > 95) continue; // skip near-black and near-white

          const d = max - min;
          const s = d === 0 ? 0 : (l > 50 ? d / (2 - max - min) : d / (max + min)) * 100;
          if (s < 10) continue; // skip grays

          let h = 0;
          if (d !== 0) {
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
          }
          h = h * 360;

          // Bucket to 10-degree hue steps
          const bucketKey = `${Math.round(h / 10) * 10}_${Math.round(s / 10) * 10}_${Math.round(l / 10) * 10}`;
          const existing = buckets.get(bucketKey);
          if (existing) {
            existing.count++;
          } else {
            buckets.set(bucketKey, { h, s, l, count: 1 });
          }
        }

        resolve(Array.from(buckets.values()));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function mergeCloseColors(
  colors: { h: number; s: number; l: number; count: number }[],
): { h: number; s: number; l: number; count: number }[] {
  const merged: { h: number; s: number; l: number; count: number }[] = [];

  for (const c of colors) {
    let found = false;
    for (const m of merged) {
      const dh = Math.abs(m.h - c.h);
      const hDist = Math.min(dh, 360 - dh);
      const ds = Math.abs(m.s - c.s);
      const dl = Math.abs(m.l - c.l);
      if (hDist < 20 && ds < 15 && dl < 15) {
        // Weighted merge
        const total = m.count + c.count;
        m.h = (m.h * m.count + c.h * c.count) / total;
        m.s = (m.s * m.count + c.s * c.count) / total;
        m.l = (m.l * m.count + c.l * c.count) / total;
        m.count = total;
        found = true;
        break;
      }
    }
    if (!found) merged.push({ ...c });
  }

  return merged;
}

/**
 * Try to enhance role detection using JSON asset mappings.
 * JSON may have fields like:
 *   assets.logo_principal → "images/logo-principal.png"
 *   files.primaryLogo → "images/logo_primary_light.png"
 */
function enhanceRolesFromJson(
  images: MappedImage[],
  json: Record<string, unknown>,
): void {
  // Collect JSON file references
  const jsonRefs: Record<string, string> = {};

  function extractRefs(obj: unknown, prefix: string) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (typeof val === "string" && /\.(png|jpe?g|webp|svg)$/i.test(val)) {
        jsonRefs[`${prefix}.${key}`] = val;
      } else if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        extractRefs(val, `${prefix}.${key}`);
      }
    }
  }

  for (const container of ["assets", "files", "logoSystem"]) {
    if (json[container]) extractRefs(json[container], container);
  }

  // Map JSON keys to roles
  const keyToRole: Record<string, ImageRole> = {};
  for (const [jsonKey] of Object.entries(jsonRefs)) {
    const k = jsonKey.toLowerCase();
    if (/primary|principal/.test(k) && /logo/.test(k)) keyToRole[jsonKey] = "logo";
    else if (/reversed|negativ|dark/.test(k) && /logo/.test(k)) keyToRole[jsonKey] = "logoDark";
    else if (/og[-_]?image/.test(k)) keyToRole[jsonKey] = "ogImage";
    else if (/favicon/.test(k)) keyToRole[jsonKey] = "favicon";
  }

  // Match JSON references to actual files by filename
  for (const [jsonKey, filePath] of Object.entries(jsonRefs)) {
    const role = keyToRole[jsonKey];
    if (!role) continue;

    const basename = filePath.split("/").pop()?.toLowerCase();
    if (!basename) continue;

    const matchingImage = images.find(
      (img) => img.filename.toLowerCase() === basename && img.role === null,
    );
    if (matchingImage) {
      matchingImage.role = role;
      matchingImage.detectedBy = "json";
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Main parser
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function parseBrandPackage(files: File[]): Promise<ParsedBrandPackage> {
  // --- Parse JSON & CSS in parallel ---
  const [json, cssParsed] = await Promise.all([
    findAndParseJson(files),
    findAndParseCss(files),
  ]);

  // --- Brand name ---
  const brandName = extractBrandName(json, files);

  // --- Colors (JSON > CSS > canvas fallback) ---
  let allColors = json ? extractAllColors(json) : {};
  // Merge CSS colors (JSON takes priority for duplicate keys)
  if (Object.keys(cssParsed.colors).length > 0) {
    allColors = { ...cssParsed.colors, ...allColors };
  }
  let colorsFromImage = false;

  // --- Typography (JSON > CSS) ---
  const typography = extractTypography(json, cssParsed.fonts);

  // --- Images ---
  const imageFiles = files.filter(isImageFile);
  const mappedImages: MappedImage[] = imageFiles.map((file) => {
    const filename = file.webkitRelativePath
      ? file.webkitRelativePath.split("/").pop() || file.name
      : file.name;

    const detected = detectImageRole(filename);
    return {
      file,
      role: detected?.role ?? null,
      detectedBy: detected?.method,
      previewUrl: URL.createObjectURL(file),
      filename,
    };
  });

  // Enhance with JSON cross-references for unmatched images
  if (json) {
    enhanceRolesFromJson(mappedImages, json);
  }

  // Handle logo-principal vs logo-principal-light disambiguation
  const hasExplicitLight = mappedImages.some(
    (img) => img.role === "logo" && /light/i.test(img.filename),
  );
  if (hasExplicitLight) {
    for (const img of mappedImages) {
      if (img.role === "logo" && !/light/i.test(img.filename)) {
        if (!mappedImages.some((i) => i.role === "logoDark")) {
          img.role = "logoDark";
        }
      }
    }
  }

  // --- Dimension-based inference for unassigned images ---
  await inferRoleByDimensions(mappedImages);

  // --- Canvas color extraction fallback (only if no colors from JSON/CSS) ---
  if (Object.keys(allColors).length === 0 && mappedImages.length > 0) {
    allColors = await extractColorsFromImages(mappedImages);
    colorsFromImage = Object.keys(allColors).length > 0;
  }

  const colors = mapColors(allColors);

  // --- Dedupe: single roles keep first match, array roles allow multiples ---
  const seenSingleRoles = new Set<ImageRole>();
  for (const img of mappedImages) {
    if (!img.role) continue;
    if (ROLE_META[img.role].isArray) continue; // array roles: no dedup
    if (seenSingleRoles.has(img.role)) {
      img.role = null;
      img.detectedBy = undefined;
    } else {
      seenSingleRoles.add(img.role);
    }
  }

  return {
    brandName,
    colors,
    allColors,
    images: mappedImages,
    typography,
    rawJson: json || {},
    colorsFromImage,
  };
}

/**
 * Get images mapped to specific roles for easy access.
 */
export function getImageByRole(
  images: MappedImage[],
  role: ImageRole,
): MappedImage | undefined {
  return images.find((img) => img.role === role);
}

/**
 * Cleanup Object URLs when component unmounts.
 */
export function cleanupPreviews(images: MappedImage[]): void {
  for (const img of images) {
    URL.revokeObjectURL(img.previewUrl);
  }
}

/**
 * Set a nested value in an object using a dot-separated path.
 * e.g. setNestedValue(obj, "hero.backgroundImage", url)
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
