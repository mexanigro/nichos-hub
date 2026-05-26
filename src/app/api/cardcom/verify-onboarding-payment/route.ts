import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { processCardcomPayment } from "@/lib/cardcom-promote";
import { signOnboardingToken } from "@/lib/onboarding-token";

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

  const result = await processCardcomPayment(leadId, lowProfileCode);

  if (!result.ok) {
    if (result.reason === "lead_not_found") {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: result.reason || "verify_failed" }, { status: 400 });
  }

  // Token short-lived (24h) para que la success page redirija a /info?token=...
  // sin que el clientId/email sean adivinables por URL.
  const onboardingToken = await signOnboardingToken({
    leadId,
    clientId: result.clientId!,
    plan: result.plan!,
  });

  return NextResponse.json({
    success: true,
    alreadyVerified: result.alreadyProcessed || false,
    plan: result.plan,
    clientId: result.clientId,
    transactionId: result.transactionId,
    infoSubmitted: result.infoSubmitted || false,
    nextChargeAt: result.nextChargeAt || null,
    onboardingToken,
  });
}
