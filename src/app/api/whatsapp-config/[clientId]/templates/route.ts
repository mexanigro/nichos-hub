import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { whatsAppTemplatesSchema } from "@/lib/schemas";
import { ZodError } from "zod";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

const DEFAULT_TEMPLATES = {
  reminder_24h: { enabled: false, twilioTemplateSid: "", status: "draft" as const, hoursBefore: 24 },
  reminder_1h: { enabled: false, twilioTemplateSid: "", status: "draft" as const, hoursBefore: 1 },
  booking_confirmed: { enabled: false, twilioTemplateSid: "", status: "draft" as const },
  booking_cancelled: { enabled: false, twilioTemplateSid: "", status: "draft" as const },
};

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("whatsapp_templates").doc(clientId).get();
  if (!snap.exists) {
    return NextResponse.json({ clientId, templates: DEFAULT_TEMPLATES });
  }
  return NextResponse.json(snap.data());
});

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

  let validated;
  try {
    validated = whatsAppTemplatesSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((iss) => ({
        path: iss.path.join("."),
        message: iss.message,
        severity: "error" as const,
      }));
      return NextResponse.json({ error: "Config de templates invalido", issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Validacion fallida" }, { status: 422 });
  }

  const data = { ...validated, clientId, updatedAt: FieldValue.serverTimestamp() };

  try {
    await db.collection("whatsapp_templates").doc(clientId).set(data, { merge: true });
  } catch (err) {
    console.error("[api/whatsapp-templates PUT]", err);
    return NextResponse.json({ error: "Error al guardar templates" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
