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

export type ClientLanguage = "he" | "en" | "ru" | "ar" | "es";

export const VALID_CLIENT_LANGUAGES: readonly ClientLanguage[] = [
  "he",
  "en",
  "ru",
  "ar",
  "es",
] as const;

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
  return isValidClientLanguage(v) ? v : DEFAULT_CLIENT_LANGUAGE;
}

/** Labels mostrados en el dashboard owner (siempre en español, es la UI de Liam). */
export const CLIENT_LANGUAGE_LABELS_ES: Record<ClientLanguage, string> = {
  he: "Hebreo",
  en: "Inglés",
  ru: "Ruso",
  ar: "Árabe",
  es: "Español",
};
