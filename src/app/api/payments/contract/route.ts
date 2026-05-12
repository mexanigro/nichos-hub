import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getPaymentAmount, CURRENCY } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, clientDocId, contractVersion } = body;

  if (!clientId || !clientDocId) {
    return NextResponse.json(
      { error: "clientId y clientDocId son requeridos" },
      { status: 400 },
    );
  }

  // Verify client exists
  const clientDoc = await db.collection("hub_clients").doc(clientDocId).get();
  if (!clientDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const clientData = clientDoc.data()!;
  if (clientData.clientId !== clientId) {
    return NextResponse.json({ error: "clientId no coincide" }, { status: 400 });
  }

  // Determine payment type based on history
  const existingPaid = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("type", "==", "initial")
    .where("status", "==", "paid")
    .limit(1)
    .get();

  const isInitial = existingPaid.empty;
  const type = isInitial ? "initial" : "recurring";
  const amount = getPaymentAmount(isInitial);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = FieldValue.serverTimestamp();
  const today = new Date();
  const nextBilling = new Date(today);
  nextBilling.setMonth(nextBilling.getMonth() + 1);

  const docRef = await db.collection("hub_payments").add({
    clientId,
    clientDocId,
    businessName: clientData.businessName || "",
    amount,
    currency: CURRENCY,
    type,
    status: "pending",
    billingDate: today,
    nextBillingDate: nextBilling,
    cardLastFour: null,
    failureReason: null,
    cardcomTransactionId: null,
    contractAccepted: true,
    contractAcceptedAt: now,
    contractVersion: contractVersion || "1.0",
    contractIp: ip,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({
    id: docRef.id,
    type,
    amount,
  }, { status: 201 });
}
