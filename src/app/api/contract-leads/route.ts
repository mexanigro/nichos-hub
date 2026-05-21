import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";
import type { PlanType } from "@/lib/pricing";
import { isContractLang, type ContractLang } from "@/lib/contracts";

const VALID_PLANS = new Set<PlanType>(["web_crm", "completo"]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip, "contract-leads", 3, 60_000)) {
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

  const { plan, lang, email, name, contractVersion } = body as {
    plan: string;
    lang: string;
    email: string;
    name: string;
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

  const ref = await db.collection("hub_contract_leads").add({
    email: email.toLowerCase().trim(),
    name: name.trim(),
    plan: plan as PlanType,
    lang: lang as ContractLang,
    contractVersion: contractVersion || "3.0",
    contractAccepted: true,
    contractAcceptedAt: FieldValue.serverTimestamp(),
    contractIp: ip,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
