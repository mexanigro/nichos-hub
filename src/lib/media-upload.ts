/**
 * CONEXION-01 (2026-09-21) · la puerta del hub para todo el material de un cliente.
 * Guarda en Storage bajo `clients/<clientId>/media/<rol>/<nombre saneado>` (sin marca de tiempo: el mismo archivo va siempre al
 * mismo path) con cacheControl de un año y un token de descarga determinista (los 32 primeros hex del sha256 del contenido): el mismo
 * contenido produce la misma url, otro contenido otra. Importable con `node --experimental-strip-types` (imports relativos con
 * extensión, sin alias @/) y sin inicializar Firebase al importarse: el bucket real se toma sólo al llamar sin `deps`.
 */
import { createHash } from "node:crypto";
import { getStorageBucket } from "./firebase-admin.ts";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 6 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

/** Fallback por extensión: webkitGetAsEntry() en Windows suele dar File con `type` vacío. */
const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

/** Tipo declarado si es útil; si no, por extensión; desconocido → "". */
export function resolveContentType(nombre: string, tipo: string): string {
  if (tipo && tipo !== "application/octet-stream") return tipo;
  const ext = nombre.slice(nombre.lastIndexOf(".")).toLowerCase();
  return EXT_TO_MIME[ext] || "";
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);
}

/** Forma mínima de `@google-cloud/storage` que usa subirMaterial (los tests pasan un bucket en memoria). */
export type BucketMinimo = {
  name: string;
  file(path: string): {
    save(buffer: Buffer, opts: { metadata: Record<string, unknown> }): Promise<unknown>;
    setMetadata?(m: Record<string, unknown>): Promise<unknown>;
    exists?(): Promise<[boolean]>;
  };
};

/**
 * ARREGLOS-01 (2026-09-25, D-110) · el hueco fijo del logo, por variante y con la extensión REAL del archivo.
 * El nombre que trae el cliente no manda: manda el hueco, como en el resto de las casillas (D-36, D-43, D-50, D-66). Así la
 * casilla del hub y `scripts/b4-material.ts` producen la MISMA url para los mismos bytes.
 */
export function nombreLogo(variante: "light" | "dark", archivo: string): string {
  const i = archivo.lastIndexOf(".");
  const ext = i > 0 ? archivo.slice(i + 1).toLowerCase() : "";
  return `${variante === "dark" ? "logo-dark" : "logo"}${ext ? `.${ext}` : ""}`;
}

/**
 * ARREGLOS-01 (D-110) · qué se escribe en `config/{id}` tras subir uno o los dos logos.
 * La variante subida se escribe siempre; la OTRA se rellena con ella sólo cuando el cliente no tenía nada guardado. Un cliente
 * que ya tiene logo no lo pierde: no hay migración ni reescritura.
 */
export function actualizacionDeLogos(
  { lightUrl, darkUrl, logoActual, logoDarkActual }: { lightUrl?: string; darkUrl?: string; logoActual?: string; logoDarkActual?: string },
): { result: { logo?: string; logoDark?: string }; updates: Record<string, string> } {
  const result: { logo?: string; logoDark?: string } = {};
  const updates: Record<string, string> = {};
  if (lightUrl) {
    result.logo = lightUrl;
    updates["brand.logo"] = lightUrl;
    if (!darkUrl && !logoDarkActual) { result.logoDark = lightUrl; updates["brand.logoDark"] = lightUrl; }
  }
  if (darkUrl) {
    result.logoDark = darkUrl;
    updates["brand.logoDark"] = darkUrl;
    if (!lightUrl && !logoActual) { result.logo = darkUrl; updates["brand.logo"] = darkUrl; }
  }
  return { result, updates };
}

export type Material = { clientId: string; rol: string; nombre: string; buffer: Buffer; contentType: string };
export type Subida = { url: string; path: string; bytes: number };

export const tokenDeContenido = (buffer: Buffer) => createHash("sha256").update(buffer).digest("hex").slice(0, 32);

export const urlDeStorage = (bucket: string, path: string, token: string) =>
  `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;

export async function subirMaterial(
  { clientId, rol, nombre, buffer, contentType }: Material,
  deps: { bucket: BucketMinimo } = { bucket: getStorageBucket() },
): Promise<Subida> {
  const esImagen = IMAGE_TYPES.has(contentType);
  const esVideo = VIDEO_TYPES.has(contentType);
  if (!esImagen && !esVideo) throw new Error(`${nombre}: tipo no permitido (${contentType || "desconocido"})`);
  const tope = esVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buffer.length > tope) throw new Error(`${nombre}: excede ${tope / 1024 / 1024} MB`);

  const path = `clients/${clientId}/media/${rol}/${sanitizeFilename(nombre)}`;
  const token = tokenDeContenido(buffer);
  await deps.bucket.file(path).save(buffer, {
    metadata: {
      contentType,
      cacheControl: "public, max-age=31536000",
      // Token de descarga en vez de makePublic(): vale con Uniform y con Fine-grained.
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });
  return { url: urlDeStorage(deps.bucket.name, path, token), path, bytes: buffer.length };
}
