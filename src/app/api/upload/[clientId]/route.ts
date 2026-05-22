import { NextRequest, NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { getStorageBucket } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);

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
    if (!ALLOWED_TYPES.has(file.type)) {
      errors.push(`${file.name}: tipo no permitido (${file.type})`);
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
          contentType: file.type,
          cacheControl: "public, max-age=31536000",
        },
      });

      await bucketFile.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
      urls.push(publicUrl);
    } catch (err) {
      console.error(`[upload] Error subiendo ${file.name}:`, err);
      errors.push(`${file.name}: error al subir`);
    }
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ urls, errors: errors.length > 0 ? errors : undefined });
});
