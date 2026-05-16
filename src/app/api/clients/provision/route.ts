import { NextRequest, NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails" | "cafeteria" | "remodelaciones";

const VALID_NICHES: BusinessNiche[] = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildFeatures(niche: BusinessNiche, mode: "solo" | "team"): Record<string, boolean> {
  const base: Record<string, boolean> = {
    showHero: true,
    showServices: true,
    showWhyChooseUs: true,
    showBooking: true,
    showGallery: true,
    showTeam: mode === "team",
    enableStaffPages: mode === "team",
    showAbout: mode === "solo",
    enableAboutPage: mode === "solo",
    showTestimonials: true,
    showInquiry: true,
    showLocation: true,
    showBusinessHours: true,
    showInstagram: true,
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

function getDefaultTheme(niche: BusinessNiche): string {
  const map: Record<BusinessNiche, string> = {
    barberia: "classic-dark",
    estetica: "elegance-light",
    tattoo: "ink-dark",
    nails: "pastel-soft",
    cafeteria: "warm-cream",
    remodelaciones: "pro-slate",
  };
  return map[niche];
}

function getDefaultSplash(niche: BusinessNiche): number {
  const map: Record<BusinessNiche, number> = {
    barberia: 1,
    estetica: 4,
    tattoo: 5,
    nails: 3,
    cafeteria: 3,
    remodelaciones: 1,
  };
  return map[niche];
}

export const POST = withOwner(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      businessName,
      niche,
      businessMode = "team",
      phone,
      email,
      address,
      instagram,
      description,
      language = "he",
      adminEmail,
    } = body;

    if (!businessName || businessName.trim().length < 2) {
      return NextResponse.json({ error: "Nombre del negocio requerido (min 2 caracteres)" }, { status: 400 });
    }
    if (!niche || !VALID_NICHES.includes(niche)) {
      return NextResponse.json({ error: "Nicho invalido" }, { status: 400 });
    }

    const nicheKey = niche as BusinessNiche;
    const mode = businessMode === "solo" ? "solo" : "team";
    const slug = `demo-${slugify(businessName.trim())}-${Date.now().toString(36)}`;
    const domain = `${slug}.arzac.studio`;
    const features = buildFeatures(nicheKey, mode);

    // 1. Create hub_clients doc
    const hubRef = db.collection("hub_clients").doc();
    await hubRef.set({
      businessName: businessName.trim(),
      niche: nicheKey,
      businessMode: mode,
      clientId: slug,
      status: "demo",
      deployUrl: `https://${domain}`,
      domain,
      adminEmail: adminEmail || email || "",
      createdAt: new Date(),
      activationDate: new Date(),
      contact: {
        phone: phone || "",
        email: email || "",
        address: address || "",
        instagram: instagram || "",
      },
      description: description || "",
      language,
      notes: "",
    });

    // 2. Create clients/{clientId} — template depends on this for Firestore rules
    await db.collection("clients").doc(slug).set({
      status: "active",
    });

    // 3. Create config/{clientId} — remote config for the landing page
    await db.collection("config").doc(slug).set({
      business: { type: nicheKey, mode, name: businessName.trim() },
      brand: { name: businessName.trim(), tagline: description || "" },
      contact: {
        phone: phone || "",
        email: email || "",
        address: { street: address || "" },
      },
      features,
      activeTheme: getDefaultTheme(nicheKey),
      splash: { enabled: true, variant: getDefaultSplash(nicheKey) },
    });

    // 4. Trigger Vercel deploy
    let deployResult: { projectId?: string; domain?: string; error?: string } = {};
    const deployUrl = `${req.nextUrl.origin}/api/deploy`;
    const deployHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.DEPLOY_SECRET) {
      deployHeaders["x-deploy-secret"] = process.env.DEPLOY_SECRET;
    }

    try {
      const deployRes = await fetch(deployUrl, {
        method: "POST",
        headers: deployHeaders,
        body: JSON.stringify({ clientId: slug, niche: nicheKey, hubDocId: hubRef.id }),
      });

      if (deployRes.ok) {
        deployResult = await deployRes.json();
      } else {
        const errText = await deployRes.text();
        console.error("[provision] Deploy failed:", errText);
        await hubRef.update({ deployStatus: "error", deployError: errText.slice(0, 200) });
        deployResult = { error: errText.slice(0, 200) };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deploy fetch failed";
      console.error("[provision] Deploy error:", msg);
      await hubRef.update({ deployStatus: "error", deployError: msg });
      deployResult = { error: msg };
    }

    return NextResponse.json({
      hubDocId: hubRef.id,
      clientId: slug,
      domain,
      deployStatus: deployResult.error ? "error" : "building",
      deployError: deployResult.error || null,
      vercelProjectId: deployResult.projectId || null,
    }, { status: 201 });
  } catch (error) {
    console.error("[provision] Error:", error);
    return NextResponse.json({ error: "Error interno al provisionar cliente" }, { status: 500 });
  }
});

export const PUT = withOwner(async (req: NextRequest) => {
  try {
    const { hubDocId, status } = await req.json();

    if (!hubDocId || !status) {
      return NextResponse.json({ error: "hubDocId y status son requeridos" }, { status: 400 });
    }

    if (!["active", "demo", "trial"].includes(status)) {
      return NextResponse.json({ error: "Status invalido" }, { status: 400 });
    }

    const hubDoc = await db.collection("hub_clients").doc(hubDocId).get();
    if (!hubDoc.exists) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const data = hubDoc.data()!;
    const updates: Record<string, unknown> = { status };
    if (status === "active" && data.status === "demo") {
      updates.activatedAt = new Date();
    }

    await db.collection("hub_clients").doc(hubDocId).update(updates);

    // Sync to clients/{clientId}
    if (data.clientId) {
      await db.collection("clients").doc(data.clientId).set(
        { status: status === "demo" ? "active" : status },
        { merge: true },
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[provision PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
});
