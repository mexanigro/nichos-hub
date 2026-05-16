import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const VALID_NICHES = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones", "otro"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  if (isRateLimited(ip, "onboarding", 5, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const session = await auth();
  const leadEmail = session?.user?.email || "";

  try {
    const formData = await req.formData();
    const niche = (formData.get("niche") as string || "").trim();
    const customNiche = (formData.get("customNiche") as string || "").trim();
    const businessMode = (formData.get("businessMode") as string || "team") as "solo" | "team";
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

    const deployNiche = niche === "otro" ? "estetica" : niche;
    const slug = `demo-${slugify(businessName)}-${Date.now().toString(36)}`;

    const features = buildFeatures(deployNiche, businessMode);

    const hubRef = db.collection("hub_clients").doc();
    await hubRef.set({
      clientId: slug,
      name: businessName,
      niche,
      customNiche: niche === "otro" ? customNiche : "",
      businessMode,
      status: "demo",
      domain: `${slug}.arzac.studio`,
      createdAt: new Date(),
      contact: { whatsapp, email, address, instagram },
      description,
      colors,
      logoCreate,
      leadEmail,
    });

    await db.collection("clients").doc(slug).set({
      status: "active",
    });

    await db.collection("config").doc(slug).set({
      business: { type: deployNiche, mode: businessMode, name: businessName },
      brand: { name: businessName, tagline: description },
      contact: { phone: whatsapp, email, address: { street: address } },
      features,
      activeTheme: getDefaultTheme(deployNiche),
      splash: { enabled: true, variant: getDefaultSplash(deployNiche) },
    });

    const deployUrl = `${req.nextUrl.origin}/api/deploy`;
    const deployHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.DEPLOY_SECRET) {
      deployHeaders["x-deploy-secret"] = process.env.DEPLOY_SECRET;
    }
    const deployRes = await fetch(deployUrl, {
      method: "POST",
      headers: deployHeaders,
      body: JSON.stringify({ clientId: slug, niche: deployNiche, hubDocId: hubRef.id }),
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

function buildFeatures(niche: string, mode: "solo" | "team"): Record<string, boolean> {
  const base: Record<string, boolean> = {
    showHero: true,
    showServices: true,
    showBooking: true,
    showGallery: true,
    showTeam: mode === "team",
    enableStaffPages: mode === "team",
    showAbout: mode === "solo",
    enableAboutPage: mode === "solo",
    showLocation: true,
    showBusinessHours: true,
    showWhatsAppInChat: true,
  };

  if (niche === "cafeteria") {
    base.showBooking = false;
    base.showPhilosophy = true;
    base.showProcess = true;
    base.showAmbience = true;
  } else if (niche === "remodelaciones") {
    base.showBooking = false;
    base.showPortfolio = true;
    base.showProcess = true;
  }

  return base;
}

function getDefaultTheme(niche: string): string {
  const map: Record<string, string> = {
    barberia: "classic-dark",
    estetica: "elegance-light",
    tattoo: "ink-dark",
    nails: "pastel-soft",
    cafeteria: "warm-cream",
    remodelaciones: "pro-slate",
  };
  return map[niche] || "classic-dark";
}

function getDefaultSplash(niche: string): number {
  const map: Record<string, number> = {
    barberia: 1,
    tattoo: 5,
    nails: 3,
    estetica: 4,
    cafeteria: 3,
    remodelaciones: 1,
  };
  return map[niche] || 1;
}
