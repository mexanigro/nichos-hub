import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getPaymentAmount, CURRENCY } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "contract", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, clientDocId, contractVersion } = body as {
    clientId?: string;
    clientDocId?: string;
    contractVersion?: string;
  };

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
