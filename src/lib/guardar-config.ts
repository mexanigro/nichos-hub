/**
 * PLANTILLA-01 (D-255) · la lógica de `PUT /api/config/[clientId]`, en un solo lugar.
 * La usan la ruta del PUT y las dos consolas (`scripts/desde-plantilla.ts`, `scripts/textos.ts`): una consola guarda exactamente como
 * guarda la ficha, no por otra lógica. Lo que hace, en orden: la forma del cuerpo (`normalizeConfigShape`), el nicho del deploy desde
 * `hub_clients` (el del hub manda), `validateConfig` (con errores, 422 y no escribe), `paraFirestore` (`null` borra sólo ese campo y
 * ningún mapa vacío llega dentro de `translations`), `set` con `merge` y la entrada de auditoría en `config_history/{id}/entries`.
 * Importable con `node --experimental-strip-types` (imports relativos con extensión, sin alias @/) y sin inicializar Firebase al
 * importarse: el Firestore real se toma sólo al llamar sin `deps.db`.
 */
import { FieldValue } from "firebase-admin/firestore";
import { db as dbReal } from "./firebase-admin.ts";
import { normalizeBusinessNiche } from "./client-config/services.ts";
import { validateConfig, hasBlockingIssues, type ConfigIssue } from "./config-validator.ts";
import { diffConfig, summarizeValue } from "./config-diff.ts";
import { paraFirestore } from "./config-firestore.ts";

type Obj = Record<string, unknown>;

/** La forma de Firestore que usan el guardado y las consolas (los tests inyectan una en memoria). */
export type DbMinima = {
  collection(nombre: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; id: string; data(): Obj | undefined }>;
      set(data: Obj, opts?: { merge?: boolean }): Promise<unknown>;
      collection(sub: string): { add(data: Obj): Promise<unknown> };
    };
    where(campo: string, op: "==", valor: unknown): {
      limit(n: number): { get(): Promise<{ empty: boolean; size: number; docs: Array<{ id: string; data(): Obj | undefined }> }> };
    };
  };
};

export type ResultadoGuardado =
  | { ok: true; normalizedBusinessType: string; warning?: string; warnings: ConfigIssue[] }
  | { ok: false; status: 400 | 422; error: string; issues: ConfigIssue[] };

export const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * `conservarHuecos` (E2E-01, 2026-09-25): en `sections.services.images` el ÍNDICE es el que aparea la foto con `services[i]`, así
 * que descartar un vacío corre a todas las posteriores y le da a cada servicio la foto del que sigue. Medido: con el hueco del
 * fixture A en el índice 10, la casilla mandaba 12 y Firestore guardaba 11, con `servicio-12.jpg` en el 10. Donde el índice no
 * significa nada (galería, Instagram, portfolios) se sigue compactando, que es para lo que se escribió.
 */
function normalizeImageArray(value: unknown, conservarHuecos = false): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      if (item) out.push(item);
      else if (conservarHuecos) out.push("");
    } else if (item && typeof item === "object") {
      // Tolerate { src, alt } and { url } shapes that legacy data produced.
      const candidate =
        (item as { src?: unknown }).src ??
        (item as { url?: unknown }).url ??
        (item as { href?: unknown }).href;
      if (typeof candidate === "string" && candidate) out.push(candidate);
      else if (conservarHuecos) out.push("");
    } else if (conservarHuecos) out.push("");
  }
  return out;
}

/**
 * Coerce legacy/wrong shapes back to what the template expects.
 *
 * Currently:
 *   - `gallery` must be `string[]`. Old data from patch-images.mjs and an
 *     earlier brand-package-import bug wrote `Array<{ src, alt }>` which makes
 *     the template render `[object Object]` and triggers a runtime error in
 *     `<Gallery />` (it calls `.slice` on the value). We flatten it here so
 *     the editor never sees the broken shape; the next PUT then re-persists
 *     the clean shape into Firestore.
 *   - `sections.services.images`, `sections.instagram.images`, `staff[].portfolio`
 *     and `owner.portfolio` are also string arrays — apply the same coercion
 *     in case any importer ever wrote rich objects there.
 */
export function normalizeConfigShape(data: Obj): Obj {
  const out = { ...data };

  // Drop legacy `brand.favicon` URL — template only reads `brand.faviconEmoji`.
  // Mark as null so `paraFirestore` converts it to a real Firestore delete on merge.
  if (out.brand && typeof out.brand === "object" && !Array.isArray(out.brand)) {
    const brand = { ...(out.brand as Obj) };
    if ("favicon" in brand) {
      brand.favicon = null;
    }
    out.brand = brand;
  }

  // Same for any accidental `_unused.*` payload from Brand Package legacy writes.
  if ("_unused" in out) {
    out._unused = null;
  }

  const flatGallery = normalizeImageArray(out.gallery);
  if (flatGallery !== undefined) out.gallery = flatGallery;

  if (out.sections && typeof out.sections === "object" && !Array.isArray(out.sections)) {
    const sections = { ...(out.sections as Obj) };
    if (sections.services && typeof sections.services === "object") {
      const services = { ...(sections.services as Obj) };
      const flat = normalizeImageArray(services.images, true);
      if (flat !== undefined) services.images = flat;
      sections.services = services;
    }
    if (sections.instagram && typeof sections.instagram === "object") {
      const instagram = { ...(sections.instagram as Obj) };
      const flat = normalizeImageArray(instagram.images);
      if (flat !== undefined) instagram.images = flat;
      sections.instagram = instagram;
    }
    out.sections = sections;
  }

  if (Array.isArray(out.staff)) {
    out.staff = (out.staff as unknown[]).map((m) => {
      if (!m || typeof m !== "object") return m;
      const next = { ...(m as Obj) };
      const flat = normalizeImageArray(next.portfolio);
      if (flat !== undefined) next.portfolio = flat;
      return next;
    });
  }

  if (out.owner && typeof out.owner === "object") {
    const owner = { ...(out.owner as Obj) };
    const flat = normalizeImageArray(owner.portfolio);
    if (flat !== undefined) owner.portfolio = flat;
    out.owner = owner;
  }

  return out;
}

function getNestedBusinessType(body: Obj): string | undefined {
  const business = body.business;
  if (!business || typeof business !== "object" || Array.isArray(business)) return undefined;
  const type = (business as Obj).type;
  return typeof type === "string" ? type : undefined;
}

async function getDeployNiche(db: DbMinima, clientId: string, fallback?: string) {
  const snap = await db.collection("hub_clients").where("clientId", "==", clientId).limit(1).get();
  const hubNiche = snap.empty ? undefined : snap.docs[0].data()?.niche;
  return normalizeBusinessNiche((hubNiche as string | undefined) ?? fallback);
}

function withNormalizedBusinessType(body: Obj, businessType: string): Obj {
  const currentBusiness = body.business && typeof body.business === "object" && !Array.isArray(body.business) ? (body.business as Obj) : {};
  return { ...body, business: { ...currentBusiness, type: businessType } };
}

/**
 * Guarda `body` en `config/{clientId}` como lo hace `PUT /api/config`. `quien` va a la auditoría (`changedBy`): el email del dueño
 * desde la ficha, «consola» desde un script. La auditoría es de buen esfuerzo: si falla, el guardado ya está hecho y no se revierte.
 */
export async function guardarConfig(clientId: string, body: unknown, deps: { db?: DbMinima; quien?: string } = {}): Promise<ResultadoGuardado> {
  if (!CLIENT_ID_RE.test(clientId)) return { ok: false, status: 400, error: "Invalid clientId", issues: [] };
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, status: 400, error: "Body must be an object", issues: [] };
  const db = deps.db ?? (dbReal as unknown as DbMinima);

  const rawBody = body as Obj;
  const requestedBusinessType = getNestedBusinessType(rawBody);
  const deployBusinessType = await getDeployNiche(db, clientId, requestedBusinessType);
  const normalizedBody = withNormalizedBusinessType(normalizeConfigShape(rawBody), deployBusinessType);

  // Un error de forma o de semántica bloquea la escritura; los avisos vuelven sin bloquear.
  const issues = validateConfig(normalizedBody);
  if (hasBlockingIssues(issues)) return { ok: false, status: 422, error: "Config invalido", issues: issues.filter((i) => i.severity === "error") };

  // El estado previo para la auditoría, en la forma normalizada: el log muestra lo que cambió en disco.
  let previousData: Obj = {};
  try {
    const prev = await db.collection("config").doc(clientId).get();
    if (prev.exists) previousData = normalizeConfigShape(prev.data() ?? {});
  } catch (err) {
    console.error("[guardarConfig] failed to snapshot prev for audit log:", err);
  }

  // IDIOMAS-01: sin mapas vacíos (un parche vacío no borra nada) y null → FieldValue.delete() sólo en ese campo.
  await db.collection("config").doc(clientId).set(paraFirestore(normalizedBody), { merge: true });

  try {
    const diff = diffConfig(previousData, normalizedBody);
    if (diff.length > 0) {
      const changes = diff.slice(0, 100).map((d) => ({ path: d.path, kind: d.kind, beforeSummary: summarizeValue(d.before), afterSummary: summarizeValue(d.after) }));
      await db.collection("config_history").doc(clientId).collection("entries").add({
        changedAt: FieldValue.serverTimestamp(),
        changedBy: deps.quien ?? "owner",
        changeCount: diff.length,
        truncated: diff.length > 100,
        changes,
      });
    }
  } catch (err) {
    console.error("[guardarConfig] audit log write failed:", err);
  }

  const warning =
    requestedBusinessType && normalizeBusinessNiche(requestedBusinessType) !== deployBusinessType
      ? `El nicho guardado se normalizo a "${deployBusinessType}" porque debe coincidir con el nicho del deploy.`
      : undefined;
  return { ok: true, normalizedBusinessType: deployBusinessType, warning, warnings: issues.filter((i) => i.severity === "warning") };
}
