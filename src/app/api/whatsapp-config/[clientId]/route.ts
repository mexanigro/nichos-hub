import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { whatsAppConfigSchema } from "@/lib/schemas";
import { ZodError } from "zod";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("whatsapp_config").doc(clientId).get();
  return NextResponse.json(snap.exists ? snap.data() : {});
});

function replaceNullsWithDelete(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) {
      out[k] = FieldValue.delete();
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = replaceNullsWithDelete(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  let validated;
  try {
    validated = whatsAppConfigSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((iss) => ({
        path: iss.path.join("."),
        message: iss.message,
        severity: "error" as const,
      }));
      return NextResponse.json({ error: "Config invalido", issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Validacion fallida" }, { status: 422 });
  }

  const rawBody = validated as Record<string, unknown>;

  if (rawBody.twilio && typeof rawBody.twilio === "object") {
    const t = rawBody.twilio as Record<string, unknown>;
    if (typeof t.phoneNumber === "string") t.phoneNumber = t.phoneNumber.trim();
  }
  if (Array.isArray(rawBody.adminPhones)) {
    rawBody.adminPhones = (rawBody.adminPhones as unknown[]).map((p) =>
      typeof p === "string" ? p.trim() : p,
    );
  }

  const cleaned = replaceNullsWithDelete(rawBody);
  cleaned.updatedAt = FieldValue.serverTimestamp();

  try {
    await db.collection("whatsapp_config").doc(clientId).set(cleaned, { merge: true });
  } catch (err) {
    console.error("[api/whatsapp-config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion WhatsApp" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
