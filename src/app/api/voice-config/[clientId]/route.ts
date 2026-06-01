import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";
import { voiceConfigSchema } from "@/lib/schemas";
import { ZodError } from "zod";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

const DEFAULT_VOICE_CONFIG = {
  enabled: false,
  twilio: { phoneNumber: "" },
  voice: { model: "female" as const, language: "he" as const },
  systemPrompt: "",
  greeting: "",
  transferNumber: "",
};

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("voice_config").doc(clientId).get();
  if (!snap.exists) {
    return NextResponse.json({ clientId, ...DEFAULT_VOICE_CONFIG });
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
    validated = voiceConfigSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = err.issues.map((iss) => ({
        path: iss.path.join("."),
        message: iss.message,
        severity: "error" as const,
      }));
      return NextResponse.json({ error: "Config de voz invalido", issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Validacion fallida" }, { status: 422 });
  }

  const data = {
    ...validated,
    clientId,
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("voice_config").doc(clientId).set(data, { merge: true });

    // Sync features.hasVoiceAgent flag in the client config
    await db.collection("config").doc(clientId).set(
      { features: { hasVoiceAgent: validated.enabled } },
      { merge: true },
    );
  } catch (err) {
    console.error("[api/voice-config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion de voz" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
