import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, getStorageBucket } from "@/lib/firebase-admin";
import { verifyOnboardingToken } from "@/lib/onboarding-token";
import { isRateLimited } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 20;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
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

/**
 * Endpoint publico de upload para el wizard /onboarding/info.
 *
 * Autenticacion: header `x-onboarding-token` con el JWT firmado por
 * /api/cardcom/verify-onboarding-payment. El clientId se extrae del token —
 * NO se acepta clientId del body, asi un cliente no puede escribir en el
 * bucket de otro cliente.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "onboarding-upload", 30, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  const tokenHeader = req.headers.get("x-onboarding-token") || "";
  const payload = await verifyOnboardingToken(tokenHeader);
  if (!payload) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
  }
  const clientId = payload.clientId;

  // Defensive: si el token es de modo "resubmit", solo es válido mientras el
  // cliente esté efectivamente en changes_requested. Si Liam ya aprobó (active)
  // o el cliente ya reenvió y pasó a pending_review, este token queda inválido
  // — el cliente debería pedir un link nuevo si necesita más cambios.
  if (payload.mode === "resubmit") {
    try {
      const hubSnap = await db.collection("hub_clients").doc(clientId).get();
      const status = hubSnap.exists ? hubSnap.data()?.status : undefined;
      if (status !== "changes_requested") {
        return NextResponse.json(
          { error: "El link de reenvío ya no es válido. Pedile a Liam un link nuevo." },
          { status: 403 },
        );
      }
    } catch (err) {
      console.error("[onboarding/upload] hub_clients status check failed:", err);
      return NextResponse.json({ error: "No se pudo verificar el estado del cliente" }, { status: 500 });
    }
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
      errors.push(`${file.name}: tipo no permitido`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: excede 5MB`);
      continue;
    }

    const timestamp = Date.now();
    const safeName = sanitizeFilename(file.name);
    const storagePath = `clients/${clientId}/onboarding/${timestamp}-${safeName}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const bucketFile = bucket.file(storagePath);

      await bucketFile.save(buffer, {
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000",
        },
      });

      const token = randomUUID();
      await bucketFile.setMetadata({
        metadata: { firebaseStorageDownloadTokens: token },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
      urls.push(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[onboarding/upload] ${file.name}:`, msg);
      errors.push(`${file.name}: ${msg}`);
    }
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ urls, errors: errors.length > 0 ? errors : undefined });
}
