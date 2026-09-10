/**
 * Deep diff between two config objects.
 *
 * Used by:
 *   - client-config-tab "Save" modal — preview what will change before PUT.
 *   - PUT /api/config/[clientId] — write an audit log entry summarizing the change.
 *
 * Design notes:
 *   - Plain objects are walked recursively.
 *   - Arrays are compared as opaque values via JSON.stringify (i.e. any
 *     change inside an array is reported as one "changed" entry at the array
 *     path, not per-element). This keeps the diff readable for editors that
 *     manage entire lists (testimonials, benefits, services).
 *   - `undefined` and `null` are treated as "missing" for the purpose of
 *     classifying added/removed.
 *
 * Output: array of leaf diffs ordered by traversal. Each entry has a
 * dotted path, before/after values, and a "kind".
 */

export type DiffKind = "added" | "removed" | "changed";

export type DiffEntry = {
  path: string;
  kind: DiffKind;
  before: unknown;
  after: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isMissing(v: unknown): boolean {
  return v === undefined || v === null;
}

export function diffConfig(before: unknown, after: unknown, basePath = ""): DiffEntry[] {
  const out: DiffEntry[] = [];
  walk(before, after, basePath, out);
  return out;
}

function walk(b: unknown, a: unknown, path: string, out: DiffEntry[]) {
  if (isPlainObject(b) && isPlainObject(a)) {
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    // Stable order so the diff renders deterministically.
    const sorted = Array.from(keys).sort();
    for (const k of sorted) {
      walk(b[k], a[k], path ? `${path}.${k}` : k, out);
    }
    return;
  }
  if (isMissing(b) && isMissing(a)) return;
  if (Array.isArray(b) || Array.isArray(a)) {
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      out.push({ path, kind: classifyKind(b, a), before: b, after: a });
    }
    return;
  }
  if (b === a) return;
  // Compare primitives (and any unequal references).
  if (JSON.stringify(b) === JSON.stringify(a)) return;
  out.push({ path, kind: classifyKind(b, a), before: b, after: a });
}

function classifyKind(b: unknown, a: unknown): DiffKind {
  if (isMissing(b) && !isMissing(a)) return "added";
  if (!isMissing(b) && isMissing(a)) return "removed";
  return "changed";
}

/**
 * Compact one-line summary of a value for display in diffs.
 * Strings shown raw, arrays as "[N items]", objects as "{...}".
 */
export function summarizeValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "—";
  if (typeof v === "string") {
    if (v.length === 0) return '""';
    if (v.length <= 60) return JSON.stringify(v);
    return JSON.stringify(v.slice(0, 57) + "…");
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? "" : "s"}]`;
  if (typeof v === "object") {
    const keys = Object.keys(v as Record<string, unknown>);
    return `{${keys.length} key${keys.length === 1 ? "" : "s"}}`;
  }
  return String(v);
}
