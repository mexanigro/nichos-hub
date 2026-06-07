import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { withOwner } from "@/lib/auth";
import { getStorageBucket, db } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

function resolveContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return EXT_TO_MIME[ext] || "";
}

export const POST = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;
  if (!/^[a-zA-Z0-9_-]+$/.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Se esperaba multipart/form-data" }, { status: 400 });
  }

  const lightFile = formData.get("logo-light") as File | null;
  const darkFile = formData.get("logo-dark") as File | null;

  if ((!lightFile || lightFile.size === 0) && (!darkFile || darkFile.size === 0)) {
    return NextResponse.json({ error: "Se requiere al menos un archivo de logo" }, { status: 400 });
  }

  const bucket = getStorageBucket();
  const errors: string[] = [];

  async function uploadFile(file: File, storagePath: string): Promise<string | null> {
    const contentType = resolveContentType(file);
    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      errors.push(`${file.name}: tipo no permitido (${contentType || "desconocido"})`);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: excede 5MB`);
      return null;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketFile = bucket.file(storagePath);
    await bucketFile.save(buffer, {
      metadata: { contentType, cacheControl: "public, max-age=31536000" },
    });
    const token = randomUUID();
    await bucketFile.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
  }

  let lightUrl: string | null = null;
  let darkUrl: string | null = null;

  try {
    if (lightFile && lightFile.size > 0) {
      lightUrl = await uploadFile(lightFile, `clients/${clientId}/logo-light-bg.png`);
    }
    if (darkFile && darkFile.size > 0) {
      darkUrl = await uploadFile(darkFile, `clients/${clientId}/logo-dark-bg.png`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-logo] Storage error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!lightUrl && !darkUrl) {
    return NextResponse.json({ error: errors.join("; ") || "Error al subir logos" }, { status: 400 });
  }

  // Check current config to decide auto-fill behavior
  const configRef = db.collection("config").doc(clientId);
  let currentLogo = "";
  let currentLogoDark = "";
  try {
    const snap = await configRef.get();
    if (snap.exists) {
      const brand = (snap.data()?.brand as Record<string, string>) || {};
      currentLogo = brand.logo || "";
      currentLogoDark = brand.logoDark || "";
    }
  } catch {
    // config may not exist yet
  }

  const result: { logo?: string; logoDark?: string } = {};
  const updates: Record<string, string> = {};

  if (lightUrl) {
    result.logo = lightUrl;
    updates["brand.logo"] = lightUrl;
    if (!darkUrl && !currentLogoDark) {
      result.logoDark = lightUrl;
      updates["brand.logoDark"] = lightUrl;
    }
  }

  if (darkUrl) {
    result.logoDark = darkUrl;
    updates["brand.logoDark"] = darkUrl;
    if (!lightUrl && !currentLogo) {
      result.logo = darkUrl;
      updates["brand.logo"] = darkUrl;
    }
  }

  // Persist to Firestore — update() for existing docs, set() as fallback
  try {
    await configRef.update(updates);
  } catch {
    try {
      const brand: Record<string, string> = {};
      if (result.logo) brand.logo = result.logo;
      if (result.logoDark) brand.logoDark = result.logoDark;
      await configRef.set({ brand }, { mergeFields: Object.keys(updates) });
    } catch (err) {
      console.error("[upload-logo] Firestore write failed:", err);
    }
  }

  return NextResponse.json({ ...result, errors: errors.length > 0 ? errors : undefined });
});
