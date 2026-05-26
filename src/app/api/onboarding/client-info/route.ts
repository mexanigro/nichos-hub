import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { resolveBranding } from "@/lib/branding-resolver";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (isRateLimited(ip, "client-info", 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid clientId" },
        { status: 400 },
      );
    }

    // Verify client exists
    const clientDoc = await db.collection("clients").doc(clientId).get();
    if (!clientDoc.exists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Build config update from submitted data
    const niche =
      body.niche === "otro" ? "estetica" : body.niche || "estetica";

    const branding = body.colors
      ? resolveBranding({ niche, colors: body.colors })
      : { themeOverrides: {} };

    const configUpdate: Record<string, unknown> = {
      "business.type": niche,
      "business.mode": body.businessMode || "team",
      "business.name": body.businessName || "",
    };

    // Brand
    if (body.businessName)
      configUpdate["brand.name"] = body.businessName;
    if (body.tagline) configUpdate["brand.tagline"] = body.tagline;
    if (body.description)
      configUpdate["brand.description"] = body.description;

    // Contact (flatten for dot-notation merge)
    if (body.contact) {
      if (body.contact.phone)
        configUpdate["contact.phone"] = body.contact.phone;
      if (body.contact.email)
        configUpdate["contact.email"] = body.contact.email;
      if (body.contact.instagram)
        configUpdate["contact.instagram"] = body.contact.instagram;
      if (body.contact.facebook)
        configUpdate["contact.facebook"] = body.contact.facebook;
      if (body.contact.whatsapp)
        configUpdate["contact.whatsapp"] = body.contact.whatsapp;
      if (body.contact.address) {
        if (body.contact.address.street)
          configUpdate["contact.address.street"] = body.contact.address.street;
        if (body.contact.address.district)
          configUpdate["contact.address.district"] =
            body.contact.address.district;
        if (body.contact.address.city)
          configUpdate["contact.address.city"] = body.contact.address.city;
      }
    }

    // Services
    if (Array.isArray(body.services) && body.services.length > 0) {
      configUpdate["services"] = body.services.map(
        (s: { id: string; label: string; price?: string; duration?: string }) => ({
          id: s.id,
          label: s.label,
          price: s.price ? Number(s.price) || 0 : 0,
          duration: s.duration ? Number(s.duration) || 30 : 30,
        }),
      );
    }

    // Hours
    if (body.hours && typeof body.hours === "object") {
      configUpdate["hours"] = body.hours;
    }

    // Owner
    if (body.ownerName) configUpdate["owner.name"] = body.ownerName;
    if (body.ownerRole) configUpdate["owner.role"] = body.ownerRole;
    if (body.ownerBio) configUpdate["owner.bio"] = body.ownerBio;

    // Accent color / branding
    if (body.accentColor) {
      configUpdate["themeOverrides.accentColor"] = body.accentColor;
    }
    if (Object.keys(branding.themeOverrides).length > 0) {
      for (const [k, v] of Object.entries(branding.themeOverrides)) {
        configUpdate[`themeOverrides.${k}`] = v;
      }
    }

    // Branding input (raw user input for re-resolution)
    configUpdate["brandingInput.colors"] = body.colors || "";

    // Image uploads (URLs from /api/onboarding/upload)
    if (typeof body.logoUrl === "string" && body.logoUrl) {
      configUpdate["brand.logo"] = body.logoUrl;
    }
    if (typeof body.logoDarkUrl === "string" && body.logoDarkUrl) {
      configUpdate["brand.logoDark"] = body.logoDarkUrl;
    }
    if (typeof body.ownerPhotoUrl === "string" && body.ownerPhotoUrl) {
      configUpdate["owner.photo"] = body.ownerPhotoUrl;
    }
    if (typeof body.heroImageUrl === "string" && body.heroImageUrl) {
      configUpdate["hero.backgroundImage"] = body.heroImageUrl;
    }
    if (Array.isArray(body.staffPhotoUrls) && body.staffPhotoUrls.length > 0) {
      // Stub: array de URLs. Liam mapea a staff[].photo en config-tab cuando
      // tiene el contexto de quien es cada uno (nombre/role).
      configUpdate["staffPhotos"] = body.staffPhotoUrls;
    }
    if (Array.isArray(body.galleryImageUrls) && body.galleryImageUrls.length > 0) {
      configUpdate["gallery"] = body.galleryImageUrls.map((url: string) => ({ url }));
    }

    // Write to Firestore config
    await db.collection("config").doc(clientId).update(configUpdate);

    // Also update hub_clients with basic info
    const hubSnap = await db
      .collection("hub_clients")
      .where("clientId", "==", clientId)
      .limit(1)
      .get();

    if (!hubSnap.empty) {
      const hubUpdate: Record<string, unknown> = {
        infoSubmitted: true,
        infoSubmittedAt: new Date(),
      };
      if (body.businessName) hubUpdate.businessName = body.businessName;
      if (body.niche) hubUpdate.niche = body.niche;
      if (body.contact?.email) hubUpdate["contact.email"] = body.contact.email;
      if (body.contact?.whatsapp)
        hubUpdate["contact.whatsapp"] = body.contact.whatsapp;
      await hubSnap.docs[0].ref.update(hubUpdate);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Client info submission error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}
