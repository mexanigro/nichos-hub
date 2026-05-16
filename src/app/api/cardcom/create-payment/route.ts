import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { createLowProfilePayment } from "@/lib/cardcom";
import { getPlanAmount, type PlanType } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "create-payment", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." }, { status: 429 });
  }

  let body: { clientId?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { clientId, plan } = body;
  if (!clientId) {
    return NextResponse.json({ error: "clientId es requerido" }, { status: 400 });
  }

  const validPlan: PlanType = plan === "completo" ? "completo" : "web_crm";

  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const clientData = snap.docs[0].data();
  const amount = getPlanAmount(validPlan);
  const lang: "he" | "en" = clientData.language === "he" ? "he" : "en";

  const planLabel = validPlan === "completo" ? "Completo" : "Web+CRM";
  const productName = `${planLabel} - ${clientData.businessName || clientId}`;

  const result = await createLowProfilePayment({
    amount,
    clientId,
    productName,
    language: lang,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // Only return the redirect URL to the browser — lowProfileCode is sensitive
  return NextResponse.json({ url: result.url });
}
