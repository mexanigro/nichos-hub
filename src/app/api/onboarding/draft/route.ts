import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyOnboardingToken } from "@/lib/onboarding-token";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Save parcial server-side del wizard /onboarding/info.
 *
 * Por que: el localStorage del wizard cubre "cierro y vuelvo en el mismo
 * browser", pero no "empece en mobile y termino en laptop" ni "cambio de
 * browser/sesion". Este endpoint guarda el draft en Firestore vinculado al
 * onboardingToken (JWT del flow post-pago), asi el mismo cliente recupera
 * su draft desde cualquier lado siguiendo el link de su email.
 *
 * Flujo:
 *   - POST: el wizard llama a este endpoint debounced 2s al cambiar campos.
 *     Body: { data: WizardDataPartial, currentStep }.
 *     Auth: header x-onboarding-token (JWT).
 *   - GET: el wizard llama al montar para hidratar.
 *     Header: x-onboarding-token.
 *   - DELETE: el wizard llama tras submit exitoso para limpiar.
 *
 * Idempotencia: el doc Firestore es hub_onboarding_drafts/{clientId} (de
 * dentro del token), un sobreescribe es siempre seguro.
 */
const COLLECTION = "hub_onboarding_drafts";

async function authClientId(req: NextRequest): Promise<string | null> {
  const tokenHeader = req.headers.get("x-onboarding-token") || "";
  const payload = await verifyOnboardingToken(tokenHeader);
  return payload?.clientId || null;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "onboarding-draft-post", 60, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const clientId = await authClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
  }

  let body: { data?: unknown; currentStep?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "data requerido" }, { status: 400 });
  }

  // Limpiar dataUrls y archivos serializados — esos viajan por upload, no draft.
  // Mantenemos solo strings, numbers, bools y arrays/objetos planos.
  const cleaned = stripBinaryFields(body.data as Record<string, unknown>);

  await db.collection(COLLECTION).doc(clientId).set(
    {
      data: cleaned,
      currentStep: typeof body.currentStep === "number" ? body.currentStep : 0,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const clientId = await authClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
  }

  const snap = await db.collection(COLLECTION).doc(clientId).get();
  if (!snap.exists) {
    return NextResponse.json({ data: null, currentStep: 0 });
  }
  const d = snap.data() || {};
  return NextResponse.json({
    data: d.data || null,
    currentStep: typeof d.currentStep === "number" ? d.currentStep : 0,
    updatedAt: d.updatedAt?.toDate?.().toISOString() || null,
  });
}

export async function DELETE(req: NextRequest) {
  const clientId = await authClientId(req);
  if (!clientId) {
    return NextResponse.json({ error: "Token invalido o expirado" }, { status: 401 });
  }
  await db.collection(COLLECTION).doc(clientId).delete();
  return NextResponse.json({ ok: true });
}

/**
 * Saca campos que no tiene sentido persistir server-side: SerializedFile con
 * dataUrl pesado, blobs, etc. Las imagenes viajan por /api/onboarding/upload
 * y se guardan como URLs separadas. El draft solo guarda texto/numeros.
 */
function stripBinaryFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
      continue;
    }
    if (Array.isArray(value)) {
      // Mantener arrays solo si son de primitivos u objetos simples sin dataUrl.
      const filtered = value
        .filter((v) => !(v && typeof v === "object" && "dataUrl" in (v as object)))
        .map((v) => (v && typeof v === "object" ? stripBinaryFields(v as Record<string, unknown>) : v));
      if (filtered.length > 0) out[key] = filtered;
      continue;
    }
    if (typeof value === "object") {
      // Si el objeto es un SerializedFile (tiene dataUrl), saltar.
      if ("dataUrl" in (value as object)) continue;
      out[key] = stripBinaryFields(value as Record<string, unknown>);
    }
  }
  return out;
}
