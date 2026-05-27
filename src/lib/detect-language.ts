/**
 * Heurística liviana para detectar el idioma de un texto.
 *
 * Pensado para advertir cuando Liam pega un texto en español dentro de un campo
 * de un cliente que tiene `language: "he"` (o cualquier otro mismatch). NO es
 * un detector de calidad lingüística — es un guard rail barato para evitar
 * deploys con textos en el idioma equivocado.
 *
 * Estrategia:
 *   - Para scripts no-latinos (hebreo, cirílico, árabe), basta con detectar la
 *     presencia del bloque Unicode correspondiente. Mismo enfoque que el
 *     backfill script (`scripts/backfill-client-languages.mjs`), pero con un
 *     umbral del 30% para no marcar como hebreo un texto que tiene una sola
 *     letra hebrea suelta dentro de un párrafo en latín.
 *   - Para texto en alfabeto latino (es/en) usamos un bag-of-words pequeño con
 *     palabras-marcador muy comunes en cada idioma. El idioma con más matches
 *     gana. Si empata o no encuentra ninguno → "unknown".
 *
 * Función pura, sin side effects, segura para correr en client.
 */

export type DetectedLanguage = "es" | "en" | "he" | "ru" | "ar" | "unknown";

// ── Bloques Unicode ────────────────────────────────────────────────────────
// Hebreo: U+0590..U+05FF
// Cirílico: U+0400..U+04FF + suplemento U+0500..U+052F
// Árabe: bloque base, suplementario y formas de presentación A/B
const RE_HEBREW = /[֐-׿]/g;
const RE_CYRILLIC = /[Ѐ-ԯ]/g;
const RE_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
const RE_LATIN_LETTER = /[A-Za-zÀ-ÖØ-öø-ÿ]/;

// ── Marcadores para distinguir español vs inglés ──────────────────────────
// Palabras muy comunes que rara vez aparecen en el otro idioma. Mantener la
// lista corta y conservadora: agregar palabras dudosas (ej. "no" — está en
// ambos) genera falsos positivos.
const SPANISH_MARKERS = new Set<string>([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "es", "son", "está", "esta", "estos", "estas", "esto", "eso",
  "que", "qué", "para", "por", "con", "sin",
  "muy", "más", "mas", "menos",
  "donde", "dónde", "cuando", "cuándo", "porque", "porqué",
  "también", "siempre", "nunca", "ahora", "después", "antes",
  "aquí", "allá", "allí",
  "nosotros", "ustedes", "ellos", "ellas",
  "pero", "como", "cómo", "ser", "hacer", "tener",
  "del", "al", "lo", "le", "se", "su", "sus",
  "todo", "todos", "toda", "todas",
  "mi", "mis", "tu", "tus", "nuestro", "nuestra",
]);

const ENGLISH_MARKERS = new Set<string>([
  "the", "and", "is", "are", "was", "were", "be", "been", "being",
  "this", "that", "these", "those",
  "with", "without", "for", "from", "about", "into", "through",
  "during", "before", "after", "above", "below", "between",
  "however", "therefore", "because", "although",
  "have", "has", "had", "having",
  "will", "would", "should", "could", "shall", "may", "might",
  "their", "they", "them", "your", "yours", "our", "ours",
  "which", "what", "who", "whom", "whose",
  "of", "to", "in", "on", "at", "by",
]);

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

/**
 * Cuenta caracteres "alfabéticos" — descarta espacios, dígitos y puntuación —
 * para calcular un denominador justo. Un texto como "אבא 123" no es 25% hebreo
 * por los dígitos: es 100% hebreo sobre las letras reales.
 */
function countLetterLike(text: string): number {
  let count = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    // Hebreo, cirílico, árabe, latino con diacríticos.
    if (
      (code >= 0x0400 && code <= 0x052F) ||  // cirílico
      (code >= 0x0590 && code <= 0x05FF) ||  // hebreo
      (code >= 0x0600 && code <= 0x06FF) ||  // árabe
      (code >= 0x0750 && code <= 0x077F) ||  // árabe suplementario
      (code >= 0xFB50 && code <= 0xFDFF) ||  // árabe presentación A
      (code >= 0xFE70 && code <= 0xFEFF) ||  // árabe presentación B
      (code >= 0x0041 && code <= 0x005A) ||  // A-Z
      (code >= 0x0061 && code <= 0x007A) ||  // a-z
      (code >= 0x00C0 && code <= 0x00FF)     // latín con diacríticos (á, é, ñ, ü...)
    ) {
      count++;
    }
  }
  return count;
}

function detectLatinLanguage(text: string): DetectedLanguage {
  // Tokenizar: separamos por todo lo que no es letra. Mantener acentos para
  // que "está" no se rompa en "est" + "a".
  const tokens = text
    .toLowerCase()
    .split(/[^a-záéíóúñüà-ÿ]+/i)
    .filter(Boolean);

  let esHits = 0;
  let enHits = 0;
  for (const t of tokens) {
    if (SPANISH_MARKERS.has(t)) esHits++;
    if (ENGLISH_MARKERS.has(t)) enHits++;
  }

  if (esHits === 0 && enHits === 0) return "unknown";
  if (esHits === enHits) return "unknown";
  return esHits > enHits ? "es" : "en";
}

export function detectLanguage(text: string): DetectedLanguage {
  if (typeof text !== "string") return "unknown";
  const trimmed = text.trim();
  if (trimmed.length === 0) return "unknown";

  const letterCount = countLetterLike(trimmed);
  if (letterCount === 0) return "unknown";

  const hebrewCount = countMatches(trimmed, RE_HEBREW);
  const cyrillicCount = countMatches(trimmed, RE_CYRILLIC);
  const arabicCount = countMatches(trimmed, RE_ARABIC);

  // Umbral 30% sobre letras reales. Si el texto es mayormente hebreo/ruso/
  // árabe, ese script gana. Comparamos los tres y el más fuerte se queda.
  const THRESHOLD = 0.3;
  const ratios: { lang: DetectedLanguage; ratio: number }[] = [
    { lang: "he", ratio: hebrewCount / letterCount },
    { lang: "ru", ratio: cyrillicCount / letterCount },
    { lang: "ar", ratio: arabicCount / letterCount },
  ];
  ratios.sort((a, b) => b.ratio - a.ratio);
  if (ratios[0].ratio >= THRESHOLD) {
    return ratios[0].lang;
  }

  // Caso mayoría latín — distinguir es vs en por palabras-marcador.
  if (RE_LATIN_LETTER.test(trimmed)) {
    return detectLatinLanguage(trimmed);
  }

  return "unknown";
}
