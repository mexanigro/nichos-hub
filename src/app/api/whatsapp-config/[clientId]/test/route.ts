import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";

type RouteCtx = { params: Promise<{ clientId: string }> };
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const E164_RE = /^\+[1-9]\d{6,14}$/;

/**
 * GET /api/whatsapp-config/{clientId}/test
 *
 * Pre-flight check that the WhatsApp agent is wired up correctly. Does NOT
 * actually send a message -- that's the Python agent's job. This endpoint
 * just validates the doc and reports what's ready vs. missing so the owner
 * can fix things before a real customer message comes in.
 *
 * Returns: { ok, checks: [{ key, ok, message }] }
 */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const snap = await db.collection("whatsapp_config").doc(clientId).get();
  const checks: Array<{ key: string; ok: boolean; message: string }> = [];

  if (!snap.exists) {
    checks.push({
      key: "doc",
      ok: false,
      message: "No hay documento whatsapp_config para este cliente.",
    });
    return NextResponse.json({ ok: false, checks });
  }

  const data = snap.data() ?? {};
  checks.push({ key: "doc", ok: true, message: "Documento de config existe." });

  const phone = data.twilio?.phoneNumber;
  if (typeof phone === "string" && E164_RE.test(phone.trim())) {
    checks.push({ key: "phone", ok: true, message: `Numero Twilio: ${phone}` });
  } else {
    checks.push({ key: "phone", ok: false, message: "Falta o es invalido el numero Twilio (twilio.phoneNumber)." });
  }

  checks.push({
    key: "enabled",
    ok: data.enabled === true,
    message: data.enabled === true ? "Agente habilitado." : "Agente DESHABILITADO (config.enabled = false).",
  });

  if (typeof data.systemPrompt === "string" && data.systemPrompt.trim().length > 20) {
    checks.push({ key: "systemPrompt", ok: true, message: `System prompt cargado (${data.systemPrompt.length} chars).` });
  } else {
    checks.push({
      key: "systemPrompt",
      ok: false,
      message: "System prompt vacio o muy corto -- el agente va a usar el default.",
    });
  }

  const admins = Array.isArray(data.adminPhones) ? data.adminPhones : [];
  if (admins.length > 0) {
    const allValid = admins.every((p: unknown) => typeof p === "string" && E164_RE.test(p.trim()));
    checks.push({
      key: "adminPhones",
      ok: allValid,
      message: allValid
        ? `${admins.length} telefono${admins.length === 1 ? "" : "s"} admin configurado${admins.length === 1 ? "" : "s"}.`
        : "Algunos telefonos admin tienen formato invalido.",
    });
  } else {
    checks.push({
      key: "adminPhones",
      ok: false,
      message: "Sin telefonos admin. Comandos #pausa / #volver no van a funcionar.",
    });
  }

  const paused = data.pauseState?.paused === true;
  checks.push({
    key: "pauseState",
    ok: !paused,
    message: paused
      ? `Agente esta pausado manualmente desde ${data.pauseState?.pausedAt ?? "una fecha desconocida"}.`
      : "Agente no esta pausado.",
  });

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks });
});
