import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = await db
    .collection("hub_payments")
    .orderBy("billingDate", "desc")
    .get();

  const payments = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      clientId: d.clientId,
      clientDocId: d.clientDocId,
      businessName: d.businessName,
      amount: d.amount,
      currency: d.currency,
      type: d.type ?? "recurring",
      status: d.status,
      billingDate: d.billingDate?.toDate(),
      nextBillingDate: d.nextBillingDate?.toDate(),
      cardLastFour: d.cardLastFour,
      failureReason: d.failureReason,
      cardcomTransactionId: d.cardcomTransactionId,
      contractAccepted: d.contractAccepted ?? false,
      contractAcceptedAt: d.contractAcceptedAt?.toDate(),
      contractVersion: d.contractVersion,
      createdAt: d.createdAt?.toDate(),
      updatedAt: d.updatedAt?.toDate(),
    };
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const now = FieldValue.serverTimestamp();
  const docRef = await db.collection("hub_payments").add({
    clientId,
    clientDocId,
    businessName,
    amount,
    currency: "ILS",
    type,
    status,
    billingDate: new Date(billingDate),
    nextBillingDate: new Date(nextBillingDate),
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
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  await db.collection("hub_payments").doc(id).update(filtered);

  return NextResponse.json({ ok: true });
}
