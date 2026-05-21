import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyPayment } from "@/lib/cardcom";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip, "verify-onboarding-payment", 10, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: { lowProfileCode?: string; leadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lowProfileCode, leadId } = body;

  if (!lowProfileCode || !leadId) {
    return NextResponse.json(
      { error: "lowProfileCode y leadId son requeridos" },
      { status: 400 },
    );
  }

  // Verificar que el lead existe
  const leadDoc = await db.collection("hub_contract_leads").doc(leadId).get();
  if (!leadDoc.exists) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  const leadData = leadDoc.data()!;

  // Idempotencia: si ya esta pagado, retornar exito
  if (leadData.paymentStatus === "paid") {
    return NextResponse.json({
      success: true,
      alreadyVerified: true,
      plan: leadData.plan,
    });
  }

  // Verificar pago con Cardcom
  const result = await verifyPayment(lowProfileCode);

  if (!result.success) {
    await leadDoc.ref.update({
      paymentStatus: "failed",
      paymentError: result.error,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Actualizar lead con pago exitoso
  await leadDoc.ref.update({
    paymentStatus: "paid",
    cardcomTransactionId: result.transactionId || null,
    cardcomLowProfileCode: lowProfileCode,
    cardLastFour: result.cardLastFour || null,
    status: "paid",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    success: true,
    plan: leadData.plan,
    transactionId: result.transactionId,
  });
}
