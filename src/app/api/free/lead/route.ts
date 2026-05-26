import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { demoLeadNotification } from "@/lib/email-templates";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arzac.studio";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "website@arzac.studio";

/**
 * Captura comercial del wizard /onboarding/free.
 *
 * Hasta hoy, las demos gratis se guardaban solo en IndexedDB del browser del
 * prospect — Liam no se enteraba de nada. Este endpoint crea un doc en
 * `hub_leads` con todo el contexto del wizard para que aparezca en su panel
 * de leads y pueda contactar.
 *
 * Idempotencia: si el mismo email ya tiene un lead con status="demo_completed"
 * de los ultimos 60 minutos, no crea uno nuevo — actualiza el existente.
 * Evita duplicados si el usuario hace submit dos veces.
 */
const DEDUP_WINDOW_MS = 60 * 60 * 1000;

interface FreeLeadBody {
  email?: string;
  whatsapp?: string;
  businessName?: string;
  niche?: string;
  customNiche?: string;
  businessMode?: string;
  description?: string;
  address?: string;
  instagram?: string;
  colors?: string;
  logoCreate?: boolean;
  locale?: string;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "free-lead", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: FreeLeadBody;
  try {
    body = (await req.json()) as FreeLeadBody;
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Email invalido" }, { status: 400 });
  }

  const now = FieldValue.serverTimestamp();
  const sinceMs = Date.now() - DEDUP_WINDOW_MS;

  const formData = {
    businessName: body.businessName || "",
    niche: body.niche || "",
    customNiche: body.customNiche || "",
    businessMode: body.businessMode || "",
    description: body.description || "",
    address: body.address || "",
    instagram: body.instagram || "",
    colors: body.colors || "",
    logoCreate: !!body.logoCreate,
    locale: body.locale || "es",
  };

  // Dedup: mismo email + status demo_completed en los ultimos 60min
  const existing = await db
    .collection("hub_leads")
    .where("email", "==", email)
    .where("source", "==", "free-demo")
    .limit(5)
    .get();

  const recent = existing.docs.find((d) => {
    const ts = d.data().createdAt?.toMillis?.();
    return typeof ts === "number" && ts >= sinceMs;
  });

  if (recent) {
    await recent.ref.update({
      whatsapp: body.whatsapp || recent.data().whatsapp || "",
      formData,
      ip,
      updatedAt: now,
    });
    return NextResponse.json({ ok: true, leadId: recent.id, deduped: true });
  }

  const ref = await db.collection("hub_leads").add({
    email,
    whatsapp: body.whatsapp || "",
    businessName: formData.businessName,
    niche: formData.niche,
    source: "free-demo",
    status: "demo_completed",
    formData,
    ip,
    createdAt: now,
  });

  // Notificacion a Liam — best-effort. Si EMAIL_PROVIDER=disabled, no-op.
  // Si esta en "log" (default), aparece en stdout de Railway.
  const tpl = demoLeadNotification({
    email,
    whatsapp: body.whatsapp,
    businessName: formData.businessName,
    niche: formData.niche,
    previewUrl: `${SITE}/onboarding/preview`,
  });
  sendEmail({
    to: OWNER_EMAIL,
    subject: tpl.subject,
    text: tpl.text,
    tag: "demo_lead",
  }).catch((e) => console.error("[free/lead] email failed:", e));

  return NextResponse.json({ ok: true, leadId: ref.id });
}
