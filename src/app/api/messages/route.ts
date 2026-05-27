import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { classifyMessage } from "@/lib/classify";
import { sendEmail } from "@/lib/email";
import { liamMessage } from "@/lib/email-templates";

async function autoClassify(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<Record<string, { category: string; categoryReason: string }>> {
  const classified: Record<string, { category: string; categoryReason: string }> = {};
  const unclassified = docs.filter((doc) => !doc.data().category && doc.data().message).slice(0, 10);
  if (unclassified.length === 0) return classified;

  const results = await Promise.allSettled(
    unclassified.map(async (doc) => {
      const result = await classifyMessage(doc.data().message);
      await db.collection("provider_messages").doc(doc.id).update({
        category: result.category,
        categoryReason: result.reason,
      });
      classified[doc.id] = { category: result.category, categoryReason: result.reason };
    }),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) console.error(`[auto-classify] ${failed}/${unclassified.length} failed`);
  return classified;
}

export const GET = withOwner(async (req) => {
  const category = req.nextUrl.searchParams.get("category");

  let query = db.collection("provider_messages")
    .where("sender", "==", "client")
    .orderBy("createdAt", "desc")
    .limit(100);

  if (category) {
    query = db.collection("provider_messages")
      .where("sender", "==", "client")
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .limit(100);
  }

  const snap = await query.get();
  const newClassifications = await autoClassify(snap.docs);

  const messages = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    ...newClassifications[doc.id],
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(messages);
});

/**
 * Inicia una conversación nueva (mensaje raíz, sin parentId) desde el hub.
 * El reply endpoint cubre las respuestas a mensajes existentes.
 *
 * El body acepta `body` (canónico) o `message` (compat); persiste como `message`
 * para mantener consistencia con los docs viejos que renderiza MessagesPanel.
 */
export const POST = withOwner(async (req, session) => {
  const payload = await req.json().catch(() => ({}));
  const clientIdRaw = typeof payload.clientId === "string" ? payload.clientId.trim() : "";
  const text = typeof payload.body === "string"
    ? payload.body.trim()
    : typeof payload.message === "string"
      ? payload.message.trim()
      : "";
  const channel = payload.channel === "email" ? "email" : "in_app";

  if (!clientIdRaw) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }
  if (text.length < 1) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
  }
  if (text.length > 4000) {
    return NextResponse.json({ error: "El mensaje es muy largo (máximo 4000 caracteres)" }, { status: 400 });
  }

  // clientIdRaw puede ser el doc id de hub_clients o el clientId interno.
  // Resolvemos a ambos para escribir el mensaje (usa internal) y auditar (usa internal).
  let hubDoc = await db.collection("hub_clients").doc(clientIdRaw).get();
  let internalClientId: string | undefined;
  let businessName = "";
  let customerEmail = "";
  let customerName = "";

  if (hubDoc.exists) {
    const d = hubDoc.data()!;
    internalClientId = typeof d.clientId === "string" ? d.clientId : clientIdRaw;
    businessName = typeof d.businessName === "string" ? d.businessName : "";
    customerEmail =
      (d.contact && typeof d.contact === "object" && (d.contact as { email?: string }).email) ||
      (typeof d.adminEmail === "string" ? d.adminEmail : "") ||
      "";
    customerName = typeof d.ownerName === "string" ? d.ownerName : "";
  } else {
    const snap = await db.collection("hub_clients").where("clientId", "==", clientIdRaw).limit(1).get();
    if (!snap.empty) {
      hubDoc = snap.docs[0];
      const d = hubDoc.data()!;
      internalClientId = clientIdRaw;
      businessName = typeof d.businessName === "string" ? d.businessName : "";
      customerEmail =
        (d.contact && typeof d.contact === "object" && (d.contact as { email?: string }).email) ||
        (typeof d.adminEmail === "string" ? d.adminEmail : "") ||
        "";
      customerName = typeof d.ownerName === "string" ? d.ownerName : "";
    }
  }

  if (!internalClientId) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (channel === "email" && (!customerEmail || !customerEmail.includes("@"))) {
    return NextResponse.json(
      { error: "El cliente no tiene email registrado — usá el canal in_app." },
      { status: 422 },
    );
  }

  const senderEmail = session?.user?.email ?? "owner";

  let messageId: string;
  try {
    const ref = await db.collection("provider_messages").add({
      clientId: internalClientId,
      businessName,
      message: text,
      sender: "provider",
      parentId: null,
      kind: "owner_initiated",
      channel,
      senderEmail,
      status: "sent",
      createdAt: FieldValue.serverTimestamp(),
    });
    messageId = ref.id;
  } catch (err) {
    console.error("[api/messages POST] write failed:", err);
    return NextResponse.json({ error: "No se pudo guardar el mensaje" }, { status: 500 });
  }

  // Audit log — paralelo a otros endpoints que escriben en hub_status_history.
  try {
    await db
      .collection("hub_status_history")
      .doc(internalClientId)
      .collection("entries")
      .add({
        kind: "owner_message_sent",
        changedBy: senderEmail,
        changedAt: FieldValue.serverTimestamp(),
        channel,
        messageId,
        messagePreview: text.slice(0, 200),
      });
  } catch (err) {
    console.error("[api/messages POST] audit log failed:", err);
  }

  // Email — best-effort, no bloquea la respuesta.
  if (channel === "email" && customerEmail.includes("@")) {
    const tpl = liamMessage({
      name: customerName || businessName,
      body: text,
    });
    sendEmail({
      to: customerEmail,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
      tag: "owner_message",
    }).catch((e) => console.error("[api/messages POST] email failed:", e));
  }

  return NextResponse.json({ id: messageId, channel }, { status: 201 });
});

export const PATCH = withOwner(async (req) => {
  const { id, status } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const validStatuses = ["new", "read"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  try {
    await db.collection("provider_messages").doc(id).update({ status });
  } catch (err) {
    console.error("[api/messages PATCH]", err);
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
