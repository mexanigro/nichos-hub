/**
 * Centralized security helpers for input validation and sanitization.
 * Used on public-facing API endpoints that accept user input.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=/gi;

/**
 * Strip HTML tags, script blocks, and event handlers from a string.
 * Trims whitespace and enforces a max length.
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input
    .replace(SCRIPT_RE, "")
    .replace(EVENT_HANDLER_RE, "")
    .replace(HTML_TAG_RE, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Validate that an object only contains allowed top-level fields.
 * Returns a new object with only the whitelisted keys.
 * Also strips any field whose key starts with "__" (prototype pollution).
 */
export function sanitizeForFirestore<T extends Record<string, unknown>>(
  data: T,
  allowedFields: readonly string[],
): Partial<T> {
  const allowed = new Set(allowedFields);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!allowed.has(key)) continue;
    if (key.startsWith("__")) continue;
    if (key === "constructor" || key === "prototype") continue;
    result[key] = value;
  }

  return result as Partial<T>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;
  return EMAIL_RE.test(email);
}

/**
 * Validate phone number — accepts Israeli formats:
 * 05X-XXXXXXX, +972XXXXXXXXX, 972XXXXXXXXX, or international +XXXXXXXXXXX
 */
const PHONE_RE = /^(\+?\d{1,4}[-\s]?)?\d{7,14}$/;

export function validatePhone(phone: string): boolean {
  if (typeof phone !== "string") return false;
  const cleaned = phone.replace(/[\s()-]/g, "");
  if (cleaned.length < 7 || cleaned.length > 18) return false;
  return PHONE_RE.test(cleaned);
}

/**
 * Validate clientId format — must be alphanumeric with hyphens, reasonable length.
 */
const CLIENT_ID_RE = /^[a-z0-9][a-z0-9-]{2,80}$/;

export function validateClientId(id: string): boolean {
  if (typeof id !== "string") return false;
  return CLIENT_ID_RE.test(id);
}
