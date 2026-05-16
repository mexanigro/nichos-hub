import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const VALID_NICHES = ["barberia", "estetica", "tattoo", "nails"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  if (isRateLimited(ip, "onboarding", 5, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const niche = (formData.get("niche") as string || "").trim();
    const businessName = (formData.get("businessName") as string || "").trim();
    const description = (formData.get("description") as string || "").trim();
    const whatsapp = (formData.get("whatsapp") as string || "").trim();
    const email = (formData.get("email") as string || "").trim();
    const address = (formData.get("address") as string || "").trim();
    const instagram = (formData.get("instagram") as string || "").trim();
    const logoCreate = formData.get("logoCreate") === "true";
    const colors = (formData.get("colors") as string || "").trim();

    if (!businessName || businessName.length < 2) {
      return NextResponse.json({ error: "Business name is required (min 2 chars)" }, { status: 400 });
    }
    if (!niche || !VALID_NICHES.includes(niche)) {
      return NextResponse.json({ error: "Invalid niche selection" }, { status: 400 });
    }
    if (email && !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const slug = `demo-${slugify(businessName)}-${Date.now().toString(36)}`;

    // Create hub_clients doc
    const hubRef = db.collection("hub_clients").doc();
    await hubRef.set({
      clientId: slug,
      name: businessName,
      niche,
      status: "demo",
      domain: `${slug}.arzac.studio`,
      createdAt: new Date(),
      contact: { whatsapp, email, address, instagram },
      description,
      colors,
      logoCreate,
    });

    // Create clients/{clientId} for Firestore rules
    await db.collection("clients").doc(slug).set({
      status: "active",
    });

    // Create config/{clientId} with builder overrides
    await db.collection("config").doc(slug).set({
      business: { type: niche, name: businessName },
      brand: { name: businessName, tagline: description },
      contact: { phone: whatsapp, email, address: { street: address } },
      features: {
        showHero: true,
        showServices: true,
        showBooking: true,
        showGallery: true,
        showTeam: true,
        showLocation: true,
        showBusinessHours: true,
        showWhatsAppInChat: true,
      },
      activeTheme: getDefaultTheme(niche),
      splash: { enabled: true, variant: getDefaultSplash(niche) },
    });

    // Trigger Vercel deploy
    const deployUrl = `${req.nextUrl.origin}/api/deploy`;
    const deployRes = await fetch(deployUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: slug, niche, hubDocId: hubRef.id }),
    });

    if (!deployRes.ok) {
      const err = await deployRes.text();
      console.error("Deploy trigger failed:", err);
      await hubRef.update({ deployStatus: "error", deployError: err.slice(0, 200) });
    }

    return NextResponse.json({ clientId: slug, hubDocId: hubRef.id });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function getDefaultTheme(niche: string): string {
  const map: Record<string, string> = {
    barberia: "classic-dark",
    estetica: "elegance-light",
    tattoo: "ink-dark",
    nails: "pastel-soft",
  };
  return map[niche] || "classic-dark";
}

function getDefaultSplash(niche: string): number {
  const map: Record<string, number> = {
    barberia: 1,
    tattoo: 5,
    nails: 3,
    estetica: 4,
  };
  return map[niche] || 1;
}
