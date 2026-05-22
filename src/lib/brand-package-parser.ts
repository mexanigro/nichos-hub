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

export type ImageRole = "logo" | "logoDark" | "ogImage" | "favicon";

export interface MappedImage {
  file: File;
  role: ImageRole | null;
  previewUrl: string; // Object URL for preview
  filename: string;
}

export interface ParsedBrandPackage {
  brandName: string;
  colors: {
    accent: string;
    accentLight: string;
    surfaceDark: string;
  };
  /** Every color found in the JSON, keyed by its original name */
  allColors: Record<string, string>;
  /** Images with detected roles */
  images: MappedImage[];
  /** Typography info (informational) */
  typography?: { display?: string; body?: string };
  /** Raw parsed JSON for reference */
  rawJson: Record<string, unknown>;
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
 * Brand name extraction
 * ═══════════════════════════════════════════════════════════════════════════ */

function extractBrandName(json: Record<string, unknown>): string {
  // Try common keys
  for (const key of ["brandName", "brand", "name", "businessName"]) {
    if (typeof json[key] === "string" && json[key]) return json[key] as string;
  }
  // Try nested
  const og = json.og as Record<string, unknown> | undefined;
  if (og && typeof og.title === "string") return og.title;
  return "Sin nombre";
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

function extractTypography(json: Record<string, unknown>): { display?: string; body?: string } | undefined {
  const typo = json.typography as Record<string, string> | undefined;
  if (!typo) return undefined;

  const display = typo.display || typo.displayHeadings || typo.latin_headings || typo.headings;
  const body = typo.body || typo.bodyUi || typo.body_ui;

  if (!display && !body) return undefined;
  return { display, body };
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Image role detection
 * ═══════════════════════════════════════════════════════════════════════════ */

const ROLE_PATTERNS: Record<ImageRole, RegExp[]> = {
  logo: [
    /logo[-_]?prim/i,
    /logo[-_]?principal(?![-_]light)/i, // "principal" pero no "principal-light" (eso es logoDark)
    /primary[-_]?logo/i,
    /logo[-_]?primary[-_]?light/i, // "primary-light" = logo for light backgrounds = logo (dark text on light bg)
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

function detectImageRole(filename: string): ImageRole | null {
  // Check skip patterns first
  if (SKIP_PATTERNS.some((p) => p.test(filename))) return null;

  for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
    if (patterns.some((p) => p.test(filename))) return role as ImageRole;
  }

  return null;
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
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Main parser
 * ═══════════════════════════════════════════════════════════════════════════ */

export async function parseBrandPackage(files: File[]): Promise<ParsedBrandPackage> {
  const json = await findAndParseJson(files);

  // --- Brand name ---
  const brandName = json ? extractBrandName(json) : "Sin nombre";

  // --- Colors ---
  const allColors = json ? extractAllColors(json) : {};
  const colors = mapColors(allColors);

  // --- Typography ---
  const typography = json ? extractTypography(json) : undefined;

  // --- Images ---
  const imageFiles = files.filter(isImageFile);
  const mappedImages: MappedImage[] = imageFiles.map((file) => {
    const filename = file.webkitRelativePath
      ? file.webkitRelativePath.split("/").pop() || file.name
      : file.name;

    return {
      file,
      role: detectImageRole(filename),
      previewUrl: URL.createObjectURL(file),
      filename,
    };
  });

  // Enhance with JSON cross-references for unmatched images
  if (json) {
    enhanceRolesFromJson(mappedImages, json);
  }

  // Handle case where logo-principal.png matched "logo" but logo-principal-light.png also exists
  // In estetica_prueba: logo-principal.png = dark bg version, logo-principal-light.png = light bg version
  // The "light" suffix means it's designed FOR light backgrounds → it IS the "logo" (dark text)
  const hasExplicitLight = mappedImages.some(
    (img) => img.role === "logo" && /light/i.test(img.filename),
  );
  if (hasExplicitLight) {
    // If we have both a "light" and non-light matched as "logo", reassign
    for (const img of mappedImages) {
      if (img.role === "logo" && !/light/i.test(img.filename)) {
        // The non-light version is actually for dark backgrounds
        if (!mappedImages.some((i) => i.role === "logoDark")) {
          img.role = "logoDark";
        }
      }
    }
  }

  // Dedupe: if multiple images got the same role, keep the first
  const seenRoles = new Set<ImageRole>();
  for (const img of mappedImages) {
    if (img.role && seenRoles.has(img.role)) {
      img.role = null;
    } else if (img.role) {
      seenRoles.add(img.role);
    }
  }

  return {
    brandName,
    colors,
    allColors,
    images: mappedImages,
    typography,
    rawJson: json || {},
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
