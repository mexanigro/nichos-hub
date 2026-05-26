import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
// E.164-ish: leading +, then 7-15 digits. Permissive enough for IL/AR/US.
const E164_RE = /^\+[1-9]\d{6,14}$/;
const VALID_TONES = new Set(["amigable", "profesional", "casual"]);
const VALID_LANGS = new Set(["auto", "es", "he", "en", "ru"]);

type ValidationIssue = { path: string; message: string; severity: "error" | "warning" };

function validateWhatsAppConfig(body: Record<string, unknown>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const twilio = body.twilio as Record<string, unknown> | undefined;
  const phone = twilio?.phoneNumber;
  if (phone !== undefined && phone !== null && phone !== "") {
    if (typeof phone !== "string" || !E164_RE.test(phone.trim())) {
      issues.push({
        path: "twilio.phoneNumber",
        message: "Numero invalido. Usa formato E.164 con +: +972501234567.",
        severity: "error",
      });
    }
  }

  if (body.enabled === true) {
    if (!phone || (typeof phone === "string" && !phone.trim())) {
      issues.push({
        path: "twilio.phoneNumber",
        message: "Para habilitar el agente WhatsApp necesitas un numero Twilio.",
        severity: "error",
      });
    }
  }

  const personality = body.personality as Record<string, unknown> | undefined;
  if (personality?.tone !== undefined && typeof personality.tone === "string" && !VALID_TONES.has(personality.tone)) {
    issues.push({ path: "personality.tone", message: "Tono invalido.", severity: "error" });
  }
  if (personality?.language !== undefined && typeof personality.language === "string" && !VALID_LANGS.has(personality.language)) {
    issues.push({ path: "personality.language", message: "Idioma invalido.", severity: "error" });
  }

  if (Array.isArray(body.adminPhones)) {
    (body.adminPhones as unknown[]).forEach((p, i) => {
      if (typeof p !== "string" || !E164_RE.test(p.trim())) {
        issues.push({
          path: `adminPhones[${i}]`,
          message: `Numero invalido (usa formato +CC...). Recibido: ${JSON.stringify(p)}`,
          severity: "error",
        });
      }
    });
  }

  return issues;
}

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
  const body = await req.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const rawBody = body as Record<string, unknown>;
  const issues = validateWhatsAppConfig(rawBody);
  const blocking = issues.filter((i) => i.severity === "error");
  if (blocking.length > 0) {
    return NextResponse.json({ error: "Config invalido", issues: blocking }, { status: 422 });
  }

  // Coerce phone number whitespace just in case the owner pasted with a leading/trailing space.
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
