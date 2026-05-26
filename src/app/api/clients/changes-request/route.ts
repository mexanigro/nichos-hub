import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendEmail } from "@/lib/email";
import { changesRequested } from "@/lib/email-templates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arzac.studio";

/**
 * POST /api/clients/changes-request
 *
 * Liam pide cambios sobre un cliente en pending_review. Hace tres cosas:
 *   1. Escribe el mensaje en provider_messages (sender=provider, kind=changes_request)
 *   2. Cambia hub_clients/{docId}.status = "changes_requested" + sync clients/{clientId}
 *   3. Manda email transaccional al cliente con el link al wizard para editar.
 *   4. Audit log en hub_status_history.
 */
export const POST = withOwner(async (req, session) => {
  const { hubDocId, message } = await req.json();

  if (!hubDocId || typeof hubDocId !== "string") {
    return NextResponse.json({ error: "hubDocId requerido" }, { status: 400 });
  }
  const text = typeof message === "string" ? message.trim() : "";
  if (text.length < 5) {
    return NextResponse.json({ error: "El mensaje es muy corto (mínimo 5 caracteres)" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "El mensaje es muy largo (máximo 4000 caracteres)" }, { status: 400 });
  }

  const hubDoc = await db.collection("hub_clients").doc(hubDocId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const data = hubDoc.data()!;
  const clientId: string | undefined = data.clientId;
  const previousStatus: string = data.status || "active";
  const approverEmail = session?.user?.email ?? "owner";

  if (!clientId) {
    return NextResponse.json({ error: "El cliente no tiene clientId" }, { status: 422 });
  }

  // 1) Mensaje en provider_messages
  let messageId: string | undefined;
  try {
    const ref = await db.collection("provider_messages").add({
      clientId,
      businessName: data.businessName || "",
      message: text,
      sender: "provider",
      kind: "changes_request",
      status: "new",
      createdAt: FieldValue.serverTimestamp(),
    });
    messageId = ref.id;
  } catch (err) {
    console.error("[changes-request] write message failed:", err);
    return NextResponse.json({ error: "No se pudo guardar el mensaje" }, { status: 500 });
  }

  // 2) Update hub_clients + clients
  try {
    await db.collection("hub_clients").doc(hubDocId).set(
      {
        status: "changes_requested",
        changesRequestedAt: FieldValue.serverTimestamp(),
        changesRequestedBy: approverEmail,
        lastChangesRequestMessage: text.slice(0, 500),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await db.collection("clients").doc(clientId).set(
      { status: "changes_requested" },
      { merge: true },
    );
  } catch (err) {
    console.error("[changes-request] status update failed:", err);
    return NextResponse.json({ error: "No se pudo actualizar el estado" }, { status: 500 });
  }

  // 3) Audit log
  try {
    if (previousStatus !== "changes_requested") {
      await db
        .collection("hub_status_history")
        .doc(clientId)
        .collection("entries")
        .add({
          from: previousStatus,
          to: "changes_requested",
          changedBy: approverEmail,
          changedAt: FieldValue.serverTimestamp(),
          hubDocId,
          messageId,
          messagePreview: text.slice(0, 200),
        });
    }
  } catch (err) {
    console.error("[changes-request] audit log failed:", err);
  }

  // 4) Email — best-effort, no bloquea la respuesta
  const customerEmail =
    (data.contact && typeof data.contact === "object" && (data.contact as { email?: string }).email) ||
    data.adminEmail ||
    "";
  if (typeof customerEmail === "string" && customerEmail.includes("@")) {
    const tpl = changesRequested({
      name: typeof data.ownerName === "string" ? data.ownerName : data.businessName,
      businessName: data.businessName,
      message: text,
      onboardingUrl: `${SITE}/onboarding/info?clientId=${encodeURIComponent(clientId)}`,
    });
    sendEmail({
      to: customerEmail,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
      tag: "changes_requested",
    }).catch((e) => console.error("[changes-request] email failed:", e));
  }

  return NextResponse.json({ ok: true, status: "changes_requested", messageId });
});
