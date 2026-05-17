/**
 * Resolves user's free-text color preferences into theme overrides.
 * Parses keywords like "gold", "black", "pink" and hex codes.
 */

/** Mapping of common color keywords to hex values */
const COLOR_KEYWORDS: Record<string, string> = {
  // Neutrals
  black: "#000000",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  silver: "#c0c0c0",
  charcoal: "#333333",
  // Warm
  gold: "#c8a97e",
  golden: "#c8a97e",
  dorado: "#c8a97e",
  oro: "#c8a97e",
  cream: "#f5f0e8",
  beige: "#f5e6cc",
  ivory: "#fffff0",
  bronze: "#cd7f32",
  copper: "#b87333",
  // Reds
  red: "#c0392b",
  rojo: "#c0392b",
  burgundy: "#800020",
  maroon: "#800000",
  wine: "#722f37",
  vino: "#722f37",
  coral: "#ff6b6b",
  // Pinks
  pink: "#e091c0",
  rosa: "#e091c0",
  magenta: "#c2185b",
  salmon: "#fa8072",
  // Oranges
  orange: "#e67e22",
  naranja: "#e67e22",
  peach: "#ffdab9",
  // Yellows
  yellow: "#f1c40f",
  amarillo: "#f1c40f",
  // Greens
  green: "#27ae60",
  verde: "#27ae60",
  emerald: "#2ecc71",
  olive: "#808000",
  mint: "#98ff98",
  teal: "#008080",
  // Blues
  blue: "#2980b9",
  azul: "#2980b9",
  navy: "#1a1a5c",
  sky: "#87ceeb",
  turquoise: "#40e0d0",
  royal: "#4169e1",
  // Purples
  purple: "#8e44ad",
  morado: "#8e44ad",
  violet: "#7c3aed",
  lavender: "#b57edc",
  lilac: "#c8a2c8",
  // Palette adjectives (return null — used for context only)
  minimal: "",
  minimalist: "",
  modern: "",
  classic: "",
  elegant: "",
  rustic: "",
  vibrant: "",
  dark: "#1a1a1a",
  light: "#f8f8f8",
  pastel: "",
  neon: "",
  warm: "",
  cool: "",
};

/** Hebrew color keywords */
const COLOR_KEYWORDS_HE: Record<string, string> = {
  "שחור": "#000000",   // שחור
  "לבן": "#ffffff",            // לבן
  "אדום": "#c0392b",     // אדום
  "כחול": "#2980b9",     // כחול
  "ירוק": "#27ae60",     // ירוק
  "צהוב": "#f1c40f",     // צהוב
  "כתום": "#e67e22",     // כתום
  "ורוד": "#e091c0",     // ורוד
  "סגול": "#8e44ad",     // סגול
  "זהב": "#c8a97e",           // זהב
};

/** Russian color keywords */
const COLOR_KEYWORDS_RU: Record<string, string> = {
  "чёрный": "#000000",   // чёрный
  "белый": "#ffffff",          // белый
  "красный": "#c0392b", // красный
  "синий": "#2980b9",          // синий
  "зелёный": "#27ae60", // зелёный
  "жёлтый": "#f1c40f",    // жёлтый
  "золотой": "#c8a97e", // золотой
  "розовый": "#e091c0", // розовый
  "фиолетовый": "#8e44ad", // фиолетовый
};

export interface ResolvedBranding {
  /** Hex colors extracted from user input */
  parsedColors: string[];
  /** Theme overrides to deep-merge over niche default */
  themeOverrides: Record<string, string>;
  /** The raw user input for reference */
  rawInput: string;
}

/**
 * Parse a free-text color input into resolved hex colors.
 * Handles: hex codes (#xxx, #xxxxxx), English keywords, Spanish keywords,
 * Hebrew keywords, Russian keywords.
 */
function parseColors(input: string): string[] {
  if (!input) return [];

  const colors: string[] = [];
  const lower = input.toLowerCase().trim();

  // Extract hex codes
  const hexMatches = lower.match(/#[0-9a-f]{3,6}/gi) || [];
  for (const hex of hexMatches) {
    if (hex.length === 4) {
      // Expand #abc → #aabbcc
      colors.push(`#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`);
    } else if (hex.length === 7) {
      colors.push(hex);
    }
  }

  // Split by common delimiters and match keywords
  const words = lower
    .replace(/#[0-9a-f]{3,6}/gi, "") // remove already-extracted hex
    .split(/[,;/&+\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const allKeywords = { ...COLOR_KEYWORDS, ...COLOR_KEYWORDS_HE, ...COLOR_KEYWORDS_RU };

  for (const word of words) {
    // Check exact match first
    if (allKeywords[word] !== undefined) {
      const hex = allKeywords[word];
      if (hex && !colors.includes(hex)) {
        colors.push(hex);
      }
      continue;
    }
    // Check if the word contains a keyword (e.g. "dorado/gold" in longer text)
    for (const [kw, hex] of Object.entries(allKeywords)) {
      if (kw.length >= 3 && word.includes(kw) && hex && !colors.includes(hex)) {
        colors.push(hex);
        break;
      }
    }
  }

  return colors;
}

/**
 * Resolve user's branding input into theme overrides.
 * The overrides are designed to deep-merge over the niche's default theme
 * in master-template.
 */
export function resolveBranding(input: {
  niche: string;
  colors: string;
}): ResolvedBranding {
  const parsedColors = parseColors(input.colors);

  const themeOverrides: Record<string, string> = {};

  if (parsedColors.length >= 1) {
    themeOverrides.primary = parsedColors[0];
  }
  if (parsedColors.length >= 2) {
    themeOverrides.secondary = parsedColors[1];
  }
  if (parsedColors.length >= 3) {
    themeOverrides.accent = parsedColors[2];
  }

  return {
    parsedColors,
    themeOverrides,
    rawInput: input.colors,
  };
}
