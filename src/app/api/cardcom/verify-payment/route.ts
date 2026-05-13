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

  const now = FieldValue.serverTimestamp();

  const paymentsSnap = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("status", "==", "pending")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!paymentsSnap.empty) {
    await paymentsSnap.docs[0].ref.update({
      status: "paid",
      cardcomTransactionId: result.transactionId || null,
      cardcomLowProfileCode: lowProfileCode,
      cardLastFour: result.cardLastFour || null,
      updatedAt: now,
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
      updatedAt: now,
    });
  }

  return NextResponse.json({
    success: true,
    transactionId: result.transactionId,
    cardLastFour: result.cardLastFour,
  });
}
