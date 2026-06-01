import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";
import { z } from "zod";

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

const sendTemplateSchema = z.object({
  templateKey: z.enum(["reminder_24h", "reminder_1h", "booking_confirmed", "booking_cancelled"]),
  to: z.string().regex(/^\+[1-9]\d{6,14}$/),
  variables: z.record(z.string(), z.string()).optional(),
});

export const POST = withAgentAuth(async (req: NextRequest, ctx?) => {
  const { clientId } = await (ctx as { params: Promise<{ clientId: string }> }).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = sendTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input invalido", issues: parsed.error.issues }, { status: 422 });
  }

  const { templateKey, to, variables } = parsed.data;

  const templateSnap = await db.collection("whatsapp_templates").doc(clientId).get();
  if (!templateSnap.exists) {
    return NextResponse.json({ error: "Templates no configurados para este cliente" }, { status: 404 });
  }
  const templateData = templateSnap.data()!;
  const template = templateData.templates?.[templateKey];

  if (!template) {
    return NextResponse.json({ error: `Template '${templateKey}' no encontrado` }, { status: 404 });
  }
  if (!template.enabled) {
    return NextResponse.json({ error: `Template '${templateKey}' esta deshabilitado` }, { status: 400 });
  }
  if (template.status !== "approved") {
    return NextResponse.json({ error: `Template '${templateKey}' no esta aprobado (status: ${template.status})` }, { status: 400 });
  }
  if (!template.twilioTemplateSid) {
    return NextResponse.json({ error: `Template '${templateKey}' no tiene SID de Twilio configurado` }, { status: 400 });
  }

  const waConfigSnap = await db.collection("whatsapp_config").doc(clientId).get();
  if (!waConfigSnap.exists) {
    return NextResponse.json({ error: "WhatsApp config no encontrada" }, { status: 404 });
  }
  const waConfig = waConfigSnap.data()!;
  const fromNumber = waConfig.twilio?.phoneNumber;
  if (!fromNumber) {
    return NextResponse.json({ error: "Numero Twilio no configurado" }, { status: 400 });
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (!twilioSid || !twilioToken) {
    return NextResponse.json({ error: "Credenciales Twilio no configuradas en el servidor" }, { status: 500 });
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const params = new URLSearchParams({
      From: `whatsapp:${fromNumber}`,
      To: `whatsapp:${to}`,
      ContentSid: template.twilioTemplateSid,
    });
    if (variables) {
      params.set("ContentVariables", JSON.stringify(variables));
    }

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("[send-template] Twilio error:", errData);
      return NextResponse.json(
        { error: "Error al enviar template via Twilio", detail: errData.message },
        { status: 502 },
      );
    }

    const result = await res.json();
    return NextResponse.json({ ok: true, messageSid: result.sid });
  } catch (err) {
    console.error("[send-template] fetch error:", err);
    return NextResponse.json({ error: "Error al conectar con Twilio" }, { status: 502 });
  }
});
