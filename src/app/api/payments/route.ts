import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { listPayments } from "@/lib/repos/payments";
import { CURRENCY } from "@/lib/pricing";

export const GET = withOwner(async () => {
  return NextResponse.json(await listPayments());
});

export const POST = withOwner(async (req) => {

  const body = await req.json();
  const {
    clientId,
    clientDocId,
    businessName,
    amount,
    type,
    status,
    billingDate,
    nextBillingDate,
    cardLastFour,
    contractAccepted,
    contractVersion,
  } = body;

  if (!clientId || !clientDocId || !businessName || !amount || !type || !status || !billingDate || !nextBillingDate) {
    return NextResponse.json(
      { error: "Campos requeridos: clientId, clientDocId, businessName, amount, type, status, billingDate, nextBillingDate" },
      { status: 400 },
    );
  }

  if (type !== "initial" && type !== "recurring") {
    return NextResponse.json(
      { error: "type debe ser 'initial' o 'recurring'" },
      { status: 400 },
    );
  }

  const validStatuses = ["paid", "pending", "failed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "status debe ser 'paid', 'pending', 'failed' o 'cancelled'" },
      { status: 400 },
    );
  }

  const bd = new Date(billingDate);
  const nbd = new Date(nextBillingDate);
  if (isNaN(bd.getTime()) || isNaN(nbd.getTime())) {
    return NextResponse.json({ error: "Fecha invalida" }, { status: 400 });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser un numero positivo" }, { status: 400 });
  }

  const now = FieldValue.serverTimestamp();
  const docRef = await db.collection("hub_payments").add({
    clientId,
    clientDocId,
    businessName,
    amount,
    currency: CURRENCY,
    type,
    status,
    billingDate: bd,
    nextBillingDate: nbd,
    cardLastFour: cardLastFour || null,
    failureReason: null,
    cardcomTransactionId: null,
    contractAccepted: contractAccepted ?? false,
    contractAcceptedAt: contractAccepted ? now : null,
    contractVersion: contractVersion || null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
});

export const PATCH = withOwner(async (req) => {

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const allowed = ["status", "type", "amount", "nextBillingDate", "cardLastFour", "failureReason", "cardcomTransactionId", "contractAccepted", "contractVersion"];
  const filtered: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const key of allowed) {
    if (key in updates) {
      if (key === "nextBillingDate") {
        filtered[key] = new Date(updates[key]);
      } else {
        filtered[key] = updates[key];
      }
    }
  }

  try {
    await db.collection("hub_payments").doc(id).update(filtered);
  } catch (err) {
    console.error("[api/payments PATCH]", err);
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});
