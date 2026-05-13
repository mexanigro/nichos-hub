import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createLowProfilePayment } from "@/lib/cardcom";
import { getPaymentAmount } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "create-payment", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." }, { status: 429 });
  }

  let body: { clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId } = body;
  if (!clientId) {
    return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
  }

  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const clientData = snap.docs[0].data();

  const existingPaid = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("type", "==", "initial")
    .where("status", "==", "paid")
    .limit(1)
    .get();

  const isInitial = existingPaid.empty;
  const amount = getPaymentAmount(isInitial);
  const lang: "he" | "en" = clientData.language === "he" ? "he" : "en";

  const productName = isInitial
    ? `הקמת אתר - ${clientData.businessName || clientId}`
    : `תחזוקה חודשית - ${clientData.businessName || clientId}`;

  const result = await createLowProfilePayment({
    amount,
    clientId,
    productName,
    language: lang,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ url: result.url, lowProfileCode: result.lowProfileCode });
}
