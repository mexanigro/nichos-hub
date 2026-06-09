import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { createLowProfilePayment } from "@/lib/cardcom";
import { getPlanAmount, type PlanType } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";
import { isContractLang, type ContractLang } from "@/lib/contracts";

const VALID_PLANS = new Set<PlanType>(["solo_web", "web_crm", "completo", "base", "pro", "enterprise"]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip, "create-onboarding-payment", 3, 60_000)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { plan, lang, email, name, phone, businessName, niche, contractVersion } = body as {
    plan: string;
    lang: string;
    email: string;
    name: string;
    phone?: string;
    businessName?: string;
    niche?: string;
    contractVersion: string;
  };

  if (!plan || !VALID_PLANS.has(plan as PlanType)) {
    return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
  }

  if (!lang || !isContractLang(lang)) {
    return NextResponse.json({ error: "Idioma invalido" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const tierMap: Record<string, string> = { base: "base", pro: "pro", enterprise: "enterprise", solo_web: "base" };
  const tier = tierMap[plan] || "base";

  // 1. Guardar lead con contrato aceptado
  const leadRef = await db.collection("hub_contract_leads").add({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    phone: phone?.trim() || "",
    businessName: businessName?.trim() || "",
    niche: niche?.trim() || "",
    plan: plan as PlanType,
    tier,
    lang: lang as ContractLang,
    contractVersion: contractVersion || "3.0",
    contractAccepted: true,
    contractAcceptedAt: FieldValue.serverTimestamp(),
    contractIp: ip,
    paymentStatus: "pending",
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  // 2. Crear pago en Cardcom
  const amount = getPlanAmount(plan as PlanType);
  const cardcomLang: "he" | "en" = lang === "he" ? "he" : "en";
  const tierLabels: Record<string, string> = { base: "Base", pro: "Pro", enterprise: "Enterprise", solo_web: "Solo Web" };
  const planLabel = tierLabels[plan] || (plan === "completo" ? "Completo" : "Web+CRM");
  const productName = plan === "solo_web"
    ? `Solo Web - ${name.trim()}`
    : `Web+CRM (${planLabel}) - ${name.trim()}`;

  const result = await createLowProfilePayment({
    amount,
    clientId: leadRef.id, // ReturnValue sera el leadId
    productName,
    language: cardcomLang,
    successPath: `/onboarding/pago/success?leadId=${leadRef.id}`,
    errorPath: "/onboarding/pago/error",
  });

  if (!result.success) {
    // Actualizar lead con error de pago
    await leadRef.update({ paymentStatus: "error", paymentError: result.error });
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // 3. Guardar lowProfileCode en el lead
  await leadRef.update({
    cardcomLowProfileCode: result.lowProfileCode,
  });

  return NextResponse.json({ url: result.url, leadId: leadRef.id });
}
