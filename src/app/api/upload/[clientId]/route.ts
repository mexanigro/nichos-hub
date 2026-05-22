import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { withOwner } from "@/lib/auth";
import { getStorageBucket } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 20;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "application/json",
]);

/** Fallback MIME detection by extension — webkitGetAsEntry() on Windows
 *  often produces File objects with an empty `type` string. */
const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

function resolveContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return EXT_TO_MIME[ext] || "";
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 80);
}

export const POST = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;

  if (!/^[a-z0-9-]+$/.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Se esperaba multipart/form-data" }, { status: 400 });
  }

  const files = formData.getAll("file").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximo ${MAX_FILES} archivos por request` }, { status: 400 });
  }

  const bucket = getStorageBucket();
  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const contentType = resolveContentType(file);

    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      errors.push(`${file.name}: tipo no permitido (${file.type || "vacío"} → ${contentType || "desconocido"})`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: excede 5MB`);
      continue;
    }

    const timestamp = Date.now();
    const safeName = sanitizeFilename(file.name);
    const storagePath = `clients/${clientId}/images/${timestamp}-${safeName}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucketFile = bucket.file(storagePath);

      await bucketFile.save(buffer, {
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000",
        },
      });

      // Use Firebase download token instead of makePublic() — works regardless
      // of bucket access control settings (Uniform or Fine-grained).
      const token = randomUUID();
      await bucketFile.setMetadata({
        metadata: { firebaseStorageDownloadTokens: token },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
      urls.push(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[upload] Error subiendo ${file.name}:`, msg);
      errors.push(`${file.name}: ${msg}`);
    }
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ urls, errors: errors.length > 0 ? errors : undefined });
});
