import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveBranding } from "@/lib/branding-resolver";
import { generateLogoSvg } from "@/lib/logo-generator";
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
    const locale = (formData.get("locale") as string || "en").trim();

    // Read logo file if uploaded (< 500KB → base64 data URL)
    let logoDataUrl: string | null = null;
    const logoFile = formData.get("logo");
    if (logoFile && logoFile instanceof Blob && logoFile.size > 0 && logoFile.size < 350_000) {
      try {
        const buffer = Buffer.from(await logoFile.arrayBuffer());
        const mimeType = logoFile.type || "image/png";
        logoDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } catch {
        // Non-critical — continue without logo
      }
    }

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
      status: "demo",
      domain: `${slug}.arzac.studio`,
      createdAt: new Date(),
      contact: { whatsapp, email, address, instagram },
      description,
      colors,
      logoCreate,
      logoDataUrl,
      language: locale,
      leadEmail,
    });

    await db.collection("clients").doc(slug).set({
      status: "active",
    });

    // Resolve user color preferences into theme overrides
    const branding = resolveBranding({ niche: deployNiche, colors });

    await db.collection("config").doc(slug).set({
      business: { type: deployNiche, mode: businessMode, name: businessName },
      brand: {
        name: businessName,
        tagline: description,
        ...(logoDataUrl ? { logo: logoDataUrl } : {}),
      },
      contact: { phone: whatsapp, email, address: { street: address }, instagram },
      features,
      activeTheme: getDefaultTheme(deployNiche),
      ...(Object.keys(branding.themeOverrides).length > 0
        ? { themeOverrides: branding.themeOverrides }
        : {}),
      splash: { enabled: true, variant: getDefaultSplash(deployNiche) },
      brandingInput: { colors, logoCreate, instagram },
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

    // Async logo generation — fire and forget, doesn't block the user
    if (logoCreate && !logoDataUrl) {
      generateAndStoreLogo({ slug, niche: deployNiche, businessName, colors, description })
        .catch((err) => console.error("[onboarding] logo gen failed:", err));
    }

    return NextResponse.json({ clientId: slug, hubDocId: hubRef.id });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// buildFeatures, getDefaultTheme, getDefaultSplash importados de @/lib/niche-defaults

/**
 * Generate a logo SVG via Claude Haiku and store it in Firestore.
 * Runs asynchronously — called fire-and-forget from the main flow.
 * The deploy takes ~2min on Vercel, logo generates in ~5sec.
 */
async function generateAndStoreLogo(params: {
  slug: string;
  niche: string;
  businessName: string;
  colors: string;
  description: string;
}) {
  const { slug, niche, businessName, colors, description } = params;

  // Generate SVG via Claude with detailed niche-specific design brief
  const svgDataUrl = await generateLogoSvg({
    businessName,
    niche,
    colors,
    description,
  });

  // Step 3: Store in Firestore
  await db.collection("config").doc(slug).update({
    "brand.logo": svgDataUrl,
  });

  // Also update hub_clients
  const hubSnap = await db
    .collection("hub_clients")
    .where("clientId", "==", slug)
    .limit(1)
    .get();
  if (!hubSnap.empty) {
    await hubSnap.docs[0].ref.update({ logoDataUrl: svgDataUrl });
  }

  console.log(`[logo-gen] Logo generated and stored for ${slug}`);
}
