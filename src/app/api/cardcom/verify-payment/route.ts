import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyPayment } from "@/lib/cardcom";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "verify-payment", 10, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: { lowProfileCode?: string; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lowProfileCode, clientId } = body;

  if (!lowProfileCode || !clientId) {
    return NextResponse.json(
      { error: "lowProfileCode y clientId son requeridos" },
      { status: 400 },
    );
  }

  // Idempotency: check if this lowProfileCode was already verified
  const alreadyVerified = await db
    .collection("hub_payments")
    .where("cardcomLowProfileCode", "==", lowProfileCode)
    .where("status", "==", "paid")
    .limit(1)
    .get();

  if (!alreadyVerified.empty) {
    const existing = alreadyVerified.docs[0].data();
    return NextResponse.json({
      success: true,
      transactionId: existing.cardcomTransactionId,
      cardLastFour: existing.cardLastFour,
      alreadyVerified: true,
    });
  }

  const result = await verifyPayment(lowProfileCode);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Find the pending payment, then atomically transition it to "paid"
  // inside a transaction to prevent concurrent duplicate transitions.
  const paymentsSnap = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!paymentsSnap.empty) {
    const paymentRef = paymentsSnap.docs[0].ref;
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(paymentRef);
      if (!fresh.exists || fresh.data()?.status !== "pending") return;
      tx.update(paymentRef, {
        status: "paid",
        cardcomTransactionId: result.transactionId || null,
        cardcomLowProfileCode: lowProfileCode,
        cardLastFour: result.cardLastFour || null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } else {
    // Fallback: payment confirmed by Cardcom but no pending doc found.
    // Create a record so the payment is never lost.
    await db.collection("hub_payments").add({
      clientId,
      status: "paid",
      cardcomTransactionId: result.transactionId || null,
      cardcomLowProfileCode: lowProfileCode,
      cardLastFour: result.cardLastFour || null,
      contractAccepted: true,
      note: "Auto-created: no pending doc found at verification time",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  const clientSnap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (!clientSnap.empty) {
    await clientSnap.docs[0].ref.update({
      paymentStatus: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({
    success: true,
    transactionId: result.transactionId,
    cardLastFour: result.cardLastFour,
  });
}
