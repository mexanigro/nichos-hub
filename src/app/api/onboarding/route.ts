import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveBranding } from "@/lib/branding-resolver";
import { buildFeatures, getDefaultTheme, getDefaultSplash } from "@/lib/niche-defaults";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const VALID_NICHES = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones", "otro"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (isRateLimited(ip, "onboarding", 5, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = await req.json();

    const niche = (body.niche as string || "").trim();
    const customNiche = (body.customNiche as string || "").trim();
    const businessMode = (body.businessMode as string || "team") as "solo" | "team";
    const businessName = (body.businessName as string || "").trim();
    const tagline = (body.tagline as string || "").trim();
    const description = (body.description as string || "").trim();
    const contact = body.contact ?? {};
    const whatsapp = (contact.whatsapp as string || "").trim();
    const email = (contact.email as string || "").trim();
    const address = contact.address ?? {};
    const instagram = (contact.instagram as string || "").trim();
    const facebook = (contact.facebook as string || "").trim();
    const phone = (contact.phone as string || "").trim();

    const hasBranding = body.hasBranding ?? null;
    const wantsLiamBranding = body.wantsLiamBranding ?? null;
    const colors = (body.colors as string || "").trim();
    const accentColor = (body.accentColor as string || "").trim();
    const logoDataUrl = (body.logo as string | null) ?? null;
    const logoDarkDataUrl = (body.logoDark as string | null) ?? null;
    const logoBlackWhiteDataUrl = (body.logoBlackWhite as string | null) ?? null;
    const ownerPhotoDataUrl = (body.ownerPhoto as string | null) ?? null;
    const heroImageDataUrl = (body.heroImage as string | null) ?? null;
    const galleryImages = (body.galleryImages as string[] | null) ?? [];

    const services = body.services ?? [];
    const hours = body.hours ?? {};
    const ownerName = (body.ownerName as string || "").trim();
    const ownerRole = (body.ownerRole as string || "").trim();
    const ownerBio = (body.ownerBio as string || "").trim();
    const locale = (body.locale as string || "en").trim();

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
      businessName,
      niche,
      customNiche: niche === "otro" ? customNiche : "",
      businessMode,
      tagline,
      status: "demo",
      domain: `${slug}.arzac.studio`,
      createdAt: new Date(),
      contact: { whatsapp, email, phone, address, instagram, facebook },
      description,
      hasBranding,
      wantsLiamBranding,
      colors,
      accentColor,
      logoDataUrl,
      logoDarkDataUrl,
      logoBlackWhiteDataUrl,
      ownerName,
      ownerRole,
      ownerBio,
      ownerPhotoDataUrl,
      heroImageDataUrl,
      galleryImages,
      services,
      hours,
      language: locale,
      variant: body.variant || "free",
    });

    await db.collection("clients").doc(slug).set({
      status: "active",
    });

    const branding = resolveBranding({ niche: deployNiche, colors });

    await db.collection("config").doc(slug).set({
      business: { type: deployNiche, mode: businessMode, name: businessName, tagline },
      brand: {
        name: businessName,
        tagline: tagline || description,
        ...(logoDataUrl ? { logo: logoDataUrl } : {}),
        ...(logoDarkDataUrl ? { logoDark: logoDarkDataUrl } : {}),
        ...(logoBlackWhiteDataUrl ? { logoBW: logoBlackWhiteDataUrl } : {}),
        ...(accentColor ? { accentColor } : {}),
      },
      contact: {
        phone: phone || whatsapp,
        email,
        address,
        instagram,
        facebook,
        whatsapp,
      },
      features,
      activeTheme: getDefaultTheme(deployNiche),
      ...(Object.keys(branding.themeOverrides).length > 0
        ? { themeOverrides: branding.themeOverrides }
        : {}),
      splash: { enabled: true, variant: getDefaultSplash(deployNiche) },
      brandingInput: { colors, accentColor, hasBranding, wantsLiamBranding, instagram },
      ...(services.length > 0 ? { services } : {}),
      ...(Object.keys(hours).length > 0 ? { hours } : {}),
      ...(ownerName ? { owner: { name: ownerName, role: ownerRole, bio: ownerBio, photo: ownerPhotoDataUrl } } : {}),
      ...(heroImageDataUrl ? { heroImage: heroImageDataUrl } : {}),
      ...(galleryImages.length > 0 ? { galleryImages } : {}),
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
