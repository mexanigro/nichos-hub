/**
 * Idioma del cliente — fuente única de verdad sobre qué locales se aceptan.
 *
 * El idioma se persiste en `hub_clients/{id}.language` y `config/{id}.language`,
 * y se usa para:
 *   - Wizard /onboarding/info (hidratar locale antes de fallback al browser).
 *   - /api/generate-content (forzar el output language del LLM).
 *   - Dashboard /clients/[id] (banner + placeholders por idioma).
 *
 * Hebreo es default porque el mercado real está en Israel.
 */

/**
 * "es" NO es un idioma de web de cliente (N05 · T5, D-8 a). El mercado es Israel;
 * el español es la lengua del dashboard de Liam, no la del negocio del cliente.
 * Ofrecerlo era además una promesa falsa: el template no tiene locale "es" y caía
 * a inglés en silencio. Sigue siendo detectable por `detect-language` a propósito,
 * para que pegar texto en español en un cliente hebreo dispare el warning.
 */
export type ClientLanguage = "he" | "en" | "ru" | "ar";

export const VALID_CLIENT_LANGUAGES: readonly ClientLanguage[] = [
  "he",
  "en",
  "ru",
  "ar",
] as const;

/** Enumeración para mensajes de error. Una sola fuente, para que no se desincronice. */
export const VALID_CLIENT_LANGUAGES_LABEL = VALID_CLIENT_LANGUAGES.join(", ");

export const DEFAULT_CLIENT_LANGUAGE: ClientLanguage = "he";

export function isValidClientLanguage(v: unknown): v is ClientLanguage {
  return (
    typeof v === "string" &&
    (VALID_CLIENT_LANGUAGES as readonly string[]).includes(v)
  );
}

/**
 * Normaliza un valor a un idioma válido. Si el input no es válido, devuelve
 * el default. Útil cuando aceptamos un valor de un sistema externo y queremos
 * sanitizar antes de persistir.
 */
export function normalizeClientLanguage(v: unknown): ClientLanguage {
  if (isValidClientLanguage(v)) return v;
  // Un valor heredado — "es" de antes de T5, o cualquier basura persistida — cae al
  // default y se avisa. Nunca devuelve undefined: quien llama espera un idioma.
  if (typeof v === "string" && v.trim() !== "") {
    console.warn(
      `[client-language] valor "${v}" no es un idioma de cliente valido (${VALID_CLIENT_LANGUAGES_LABEL}); se usa "${DEFAULT_CLIENT_LANGUAGE}"`,
    );
  }
  return DEFAULT_CLIENT_LANGUAGE;
}

/** Labels mostrados en el dashboard owner (siempre en español, es la UI de Liam). */
export const CLIENT_LANGUAGE_LABELS_ES: Record<ClientLanguage, string> = {
  he: "Hebreo",
  en: "Inglés",
  ru: "Ruso",
  ar: "Árabe",
};

/**
 * Nombre del idioma en inglés — para usar en prompts de LLM. Anthropic responde
 * mejor a "Hebrew" que a "he", y mejor a "Hebrew" que a la palabra hebrea para
 * "hebreo" (que el modelo podría interpretar como texto, no como instrucción).
 */
export const CLIENT_LANGUAGE_NAME_EN: Record<ClientLanguage, string> = {
  he: "Hebrew",
  en: "English",
  ru: "Russian",
  ar: "Arabic",
};
