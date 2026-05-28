/**
 * Provisiona un cliente demo "Velvet Muse Salon" end-to-end:
 *   1) hub_clients/{docId}
 *   2) clients/{clientId}
 *   3) config/{clientId}  ← config completa con 3D Impact + theme + content
 *   4) (opcional) Dispara deploy Vercel si VERCEL_TOKEN está en env
 *
 * Usage:
 *   node scripts/provision-velvet-muse.mjs            # write firestore + (intentar deploy)
 *   node scripts/provision-velvet-muse.mjs --no-deploy
 *
 * Requiere FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// ── env ────────────────────────────────────────────────────────────────────
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx < 0) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  let val = trimmed.slice(eqIdx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

let cleanKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (/^["'`]/.test(cleanKey) && cleanKey[0] === cleanKey[cleanKey.length - 1]) {
  cleanKey = cleanKey.slice(1, -1);
}
cleanKey = cleanKey.replace(/\\n/g, "\n").replace(/\\\n/g, "\n");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: cleanKey,
    }),
  });
}
const databaseId = process.env.FIREBASE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
try { db.settings({ preferRest: true }); } catch {}

// ── constants ──────────────────────────────────────────────────────────────
const CLIENT_ID = "demo-velvet-muse";
const DOMAIN = `${CLIENT_ID}.arzac.studio`;

// Hero objects desde el manifest 3d-assets
const HERO_PRIMARY = "https://firebasestorage.googleapis.com/v0/b/barbertemplate-madre.firebasestorage.app/o/3d-assets%2Fvelvet-muse%2Fhero-primary.png?alt=media&token=b1b86c8f-8fe6-491f-b1a8-e005b7bae8af";
const HERO_SECONDARY = "https://firebasestorage.googleapis.com/v0/b/barbertemplate-madre.firebasestorage.app/o/3d-assets%2Fvelvet-muse%2Fhero-secondary.png?alt=media&token=c03fdebf-d6f8-48e5-8c41-54d3bab8f653";
const ACCENT_BOTTLE = "https://firebasestorage.googleapis.com/v0/b/barbertemplate-madre.firebasestorage.app/o/3d-assets%2Fvelvet-muse%2Faccent-bottle.png?alt=media&token=0b23f8fb-388a-4ef8-822e-9f15a5988dbe";

// Editorial portraits (Unsplash) — hair / salon styling
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554519515-242161756769?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601907818292-acb892dbd71d?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1620331311520-246422fd82f9?w=1200&q=80&auto=format&fit=crop",
];

// ── config payload ─────────────────────────────────────────────────────────
function buildConfig() {
  return {
    business: {
      type: "estetica",
      mode: "team",
      name: "Velvet Muse Salon",
      legalName: "Velvet Muse Salon LLC",
      address: "123 Rosewood Ave, Suite 5A, New York, NY 10012",
      cancellationPolicy:
        "We kindly ask for 24-hour notice on cancellations to avoid a charge. Life happens — just let us know.",
    },

    brand: {
      name: "Velvet Muse",
      tagline: "Hair that feels like you",
      description:
        "Full-service hair salon offering thoughtful cuts, dimensional color, effortless smoothness, and extensions that blend seamlessly.",
      faviconEmoji: "💇‍♀️",
      aiPersona:
        "You are the virtual assistant of Velvet Muse Salon. Answer questions about hair services (cuts, color, extensions, smoothing/keratin), availability, location and hours. Warm, professional tone. Do not reveal private salon information.",
    },

    // Tema Velvet Muse — burgundy + rose dust
    theme: {
      accent: "#8b3a4b",
      accentLight: "#d4a0a8",
      surfaceDark: "#1a0f12",
    },
    activeTheme: "velvet-muse",

    language: "en",

    // ── 3D Impact: hero objects ──────────────────────────────────────────
    heroObjects: {
      primary: {
        src: HERO_PRIMARY,
        particles: "pearls",
        intensity: "medium",
        shadowColor: "auto",
      },
      secondary: {
        src: HERO_SECONDARY,
        particles: "none",
        intensity: "subtle",
      },
      accent: {
        src: ACCENT_BOTTLE,
        particles: "none",
        intensity: "subtle",
      },
    },

    // ── Splash (3D Impact) ──────────────────────────────────────────────
    splash: {
      enabled: true,
      variant: "impact-reveal-3d",
      durationMs: 2000,
      ambientParticles: "pearls",
    },

    // ── hero ─────────────────────────────────────────────────────────────
    // SiteConfig.hero contract (see master-template src/types.ts):
    //   titlePrefix / titleHighlight / titleSuffix : string  (NOT a single `title`)
    //   subtitle                                    : string  (NOT `tagline`)
    //   ctaPrimary  / ctaSecondary                  : string  (label)
    //   ctaPrimaryHref / ctaSecondaryHref           : string  (separate from label)
    //   heroVariant                                 : "hero-3d-object" (nested HERE)
    hero: {
      eyebrow: "FULL-SERVICE HAIR SALON",
      titlePrefix: "Hair that",
      titleHighlight: "feels like",
      titleSuffix: "you",
      subtitle:
        "Thoughtful cut. Dimensional color. Effortless smoothness. Extensions that blend seamlessly. Beauty that's all you.",
      description:
        "A salon built around the way you want to feel — calm, cared for, and finally seen.",
      ctaPrimary: "Book a consultation",
      ctaPrimaryHref: "/booking",
      ctaSecondary: "Explore services",
      ctaSecondaryHref: "#services",
      backgroundImage: GALLERY_IMAGES[0],
      heroVariant: "hero-3d-object",
      stats: [
        { value: "350+", label: "Transformations" },
        { value: "10+", label: "Years of experience" },
      ],
    },

    // ── features ─────────────────────────────────────────────────────────
    features: {
      showHero: true,
      showServices: true,
      showWhyChooseUs: true,
      showBooking: true,
      showGallery: true,
      showTeam: true,
      enableStaffPages: true,
      showAbout: false,
      enableAboutPage: false,
      showTestimonials: true,
      showInquiry: true,
      showLocation: true,
      showBusinessHours: true,
      showInstagram: true,
      showWhatsAppInChat: true,
      showFaq: true,
    },

    // ── services (custom mode) ───────────────────────────────────────────
    services: [
      {
        id: "cut-styling",
        name: "Cut & Styling",
        description: "Precision cuts. Effortless styling.",
        price: 80,
        duration: 60,
        category: "Cut",
      },
      {
        id: "dimensional-color",
        name: "Dimensional Color",
        description: "Rich, multi-tonal color that brings depth and radiance.",
        price: 180,
        duration: 120,
        category: "Color",
        popular: true,
      },
      {
        id: "smoothing-keratin",
        name: "Smoothing / Keratin",
        description: "Sleek, frizz-free, and beautifully manageable hair.",
        price: 220,
        duration: 180,
        category: "Smoothing",
      },
      {
        id: "extensions",
        name: "Extensions",
        description: "Length, volume, confidence.",
        price: 350,
        duration: 180,
        category: "Extensions",
        popular: true,
      },
      {
        id: "bridal-event",
        name: "Bridal / Event Styling",
        description: "Timeless looks for life's most special moments.",
        price: 150,
        duration: 90,
        category: "Styling",
      },
      {
        id: "treatments",
        name: "Treatments",
        description: "Nourish, repair, restore healthy, beautiful hair.",
        price: 70,
        duration: 45,
        category: "Treatments",
      },
    ],

    // ── sections ─────────────────────────────────────────────────────────
    // Each section owns its own variant key (e.g. sections.services.servicesVariant).
    // The template reads `sections.<section>.<sectionVariant>` — NOT a top-level field.
    sections: {
      whyChooseUs: {
        whyChooseUsVariant: "icon-grid-3d",
        eyebrow: "WHY CHOOSE US",
        title: "Why women choose Velvet Muse",
        subtitle: "Beauty that feels personal to you",
        description:
          "At Velvet Muse Salon, every detail is designed around you — your hair, your style, your confidence.",
        heroObjectSlot: "secondary",
        show3DObject: true,
        benefits: [
          {
            title: "Expert Stylists",
            desc: "Highly trained professionals with years of experience and a passion for detail.",
            iconName: "Award",
          },
          {
            title: "Tailored Consultations",
            desc: "We listen first — then design a look that's uniquely you.",
            iconName: "Heart",
          },
          {
            title: "Premium Products",
            desc: "We use salon-grade, luxury products that deliver beautiful, lasting results.",
            iconName: "Sparkles",
          },
          {
            title: "Healthy-Hair Approach",
            desc: "We prioritize the health of your hair — today and for the long run.",
            iconName: "Leaf",
          },
          {
            title: "Comfort & Atmosphere",
            desc: "A calm, modern space where you can relax, unwind, and feel pampered.",
            iconName: "Coffee",
          },
          {
            title: "Reliable & Easy Booking",
            desc: "Simple online booking, flexible scheduling, and friendly customer service — always.",
            iconName: "Calendar",
          },
        ],
      },

      gallery: {
        galleryVariant: "portrait-bento-3d-cameo",
        eyebrow: "GALLERY",
        title: "Recent transformations",
        subtitle: "Real results, real confidence",
        description: "Crafted with artistry, tailored for you.",
        heroObjectSlot: "accent",
        show3DObject: true,
        stats: [
          { value: "350+", label: "Transformations" },
          { value: "98%", label: "Satisfied Clients" },
          { value: "10+", label: "Years of Experience" },
          { value: "5★", label: "Avg Rating" },
        ],
        ctaLabel: "View full gallery",
      },

      services: {
        servicesVariant: "card-stack-tabs",
        eyebrow: "SERVICES",
        title: "Crafted services, tailored to you",
        subtitle: "Every visit designed around your goals",
        description:
          "From precision cuts to dimensional color and seamless extensions — every service is built around your hair, your style, and how you want to feel walking out the door.",
        heroObjectSlot: "accent",
        show3DObject: true,
        filters: ["All", "Cut", "Color", "Smoothing", "Extensions", "Styling"],
        images: GALLERY_IMAGES.slice(0, 6),
        ctaLabel: "View full menu",
        ctaSecondaryLabel: "Book a consultation",
      },

      // BookingVariant lives under sections.contact, not sections.booking.
      contact: {
        bookingVariant: "form-map-hours-3d",
        eyebrow: "BOOK YOUR VISIT",
        title: "BOOK YOUR VISIT",
        subtitle: "Ready for your appointment?",
        description: "Thoughtful care. Beautiful results. Your time.",
        showMap: true,
        showHours: true,
        heroObjectSlot: "accent",
      },

      faq: {
        eyebrow: "FAQ",
        title: "Frequently asked questions",
        items: [
          {
            q: "How long does color last?",
            a: "Most color treatments last 4-6 weeks before needing a refresh. We'll customize a maintenance plan based on your hair.",
          },
          {
            q: "Do you sell professional products?",
            a: "Yes — we carry the same salon-grade products we use in services. Ask your stylist for personalized recommendations.",
          },
          {
            q: "Can I bring my own inspiration photos?",
            a: "Absolutely. We love when clients arrive with references — it helps us understand exactly what you're looking for.",
          },
          {
            q: "How early should I book for events?",
            a: "We recommend 2-3 weeks in advance for bridal and special events. Same-day appointments depend on stylist availability.",
          },
          {
            q: "What's your cancellation policy?",
            a: "We ask for 24 hours notice on cancellations to avoid a charge. We understand life happens — just let us know.",
          },
        ],
      },

      instagram: {
        handle: "velvetmuse",
        url: "https://instagram.com/velvetmuse",
        title: "Follow our latest looks",
      },
    },

    // gallery flat para template legacy
    gallery: GALLERY_IMAGES,

    // ── testimonials ─────────────────────────────────────────────────────
    testimonials: [
      {
        name: "Sarah K.",
        title: "Client since 2022",
        text: "The team at Velvet Muse made me feel beautiful and heard. The color is exactly what I dreamed.",
        rating: 5,
      },
      {
        name: "Maria L.",
        title: "Bridal client",
        text: "Best decision I made for my wedding. Patience, expertise, and zero stress.",
        rating: 5,
      },
      {
        name: "Jessica T.",
        title: "Extension client",
        text: "I get compliments every single day. So natural, so good.",
        rating: 5,
      },
    ],

    // ── contact ──────────────────────────────────────────────────────────
    contact: {
      phone: "+1 555 0100",
      email: "hello@velvet-muse.test",
      address: {
        street: "123 Rosewood Ave, Suite 5A",
        cityStateZip: "New York, NY 10012",
        city: "New York",
        region: "NY",
        postalCode: "10012",
        country: "USA",
      },
      social: {
        instagram: "@velvetmuse",
      },
    },

    hours: {
      monday: { start: "10:00", end: "20:00" },
      tuesday: { start: "10:00", end: "20:00" },
      wednesday: { start: "10:00", end: "20:00" },
      thursday: { start: "10:00", end: "20:00" },
      friday: { start: "10:00", end: "20:00" },
      saturday: { start: "09:00", end: "19:00" },
      sunday: null,
    },

    businessRules: {
      minAdvanceBookingHours: 2,
      maxAdvanceBookingDays: 60,
      autoConfirm: true,
      bufferMinutes: 10,
    },

    payment: {
      enabled: true,
      mode: "full",
      provider: "cardcom",
      acceptCash: true,
      currency: "USD",
    },

    notifications: {
      enabled: true,
      bookingAlerts: true,
      contactInquiries: true,
    },

    adminEmail: "demo@velvet-muse.test",
  };
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n[velvet-muse] Provisioning clientId="${CLIENT_ID}"`);
  console.log(`[velvet-muse] Domain target: ${DOMAIN}\n`);

  // 1) hub_clients/{docId} — clientId === slug
  const hubRef = db.collection("hub_clients").doc(CLIENT_ID);
  await hubRef.set(
    {
      businessName: "Velvet Muse Salon",
      niche: "estetica",
      businessMode: "team",
      clientId: CLIENT_ID,
      email: "demo@velvet-muse.test",
      adminEmail: "demo@velvet-muse.test",
      status: "active",
      paymentStatus: "active",
      infoSubmitted: true,
      language: "en",
      domain: DOMAIN,
      deployUrl: `https://${DOMAIN}`,
      source: "demo-velvet-muse",
      description:
        "Full-service hair salon offering thoughtful cuts, dimensional color, smoothing and extensions.",
      contact: {
        phone: "+1 555 0100",
        email: "hello@velvet-muse.test",
        address: "123 Rosewood Ave, Suite 5A, New York, NY",
        instagram: "@velvetmuse",
      },
      createdAt: FieldValue.serverTimestamp(),
      activationDate: FieldValue.serverTimestamp(),
      notes: "Demo prueba de fuego — Velvet Muse 3D Impact full stack.",
    },
    { merge: true },
  );
  console.log(`  ✓ hub_clients/${CLIENT_ID} written`);

  // 2) clients/{clientId} — espejo para rules del template
  await db.collection("clients").doc(CLIENT_ID).set(
    {
      clientId: CLIENT_ID,
      status: "active",
      niche: "estetica",
      businessName: "Velvet Muse",
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ✓ clients/${CLIENT_ID} written`);

  // 3) config/{clientId} — full Velvet Muse spec
  const config = buildConfig();
  await db.collection("config").doc(CLIENT_ID).set(config, { merge: false });
  console.log(`  ✓ config/${CLIENT_ID} written (${Object.keys(config).length} top-level keys)`);

  // 4) Read back + summarize
  const snap = await db.collection("config").doc(CLIENT_ID).get();
  const data = snap.data();
  const heroSlots = Object.keys(data?.heroObjects ?? {});
  console.log("\n[velvet-muse] Post-write summary:");
  console.log(`  brand.name        = ${data?.brand?.name}`);
  console.log(`  language          = ${data?.language}`);
  console.log(`  splash.variant    = ${data?.splash?.variant}`);
  console.log(`  hero.heroVariant  = ${data?.hero?.heroVariant}`);
  console.log(`  hero.titlePrefix  = ${data?.hero?.titlePrefix}`);
  console.log(`  hero.titleHighlight = ${data?.hero?.titleHighlight}`);
  console.log(`  hero.ctaPrimary   = ${typeof data?.hero?.ctaPrimary === "string" ? data.hero.ctaPrimary : "[wrong type]"}`);
  console.log(`  sections.whyChooseUs.whyChooseUsVariant = ${data?.sections?.whyChooseUs?.whyChooseUsVariant}`);
  console.log(`  sections.services.servicesVariant       = ${data?.sections?.services?.servicesVariant}`);
  console.log(`  sections.gallery.galleryVariant         = ${data?.sections?.gallery?.galleryVariant}`);
  console.log(`  sections.contact.bookingVariant         = ${data?.sections?.contact?.bookingVariant}`);
  console.log(`  heroObjects slots = ${heroSlots.join(", ")}`);
  console.log(`  services          = ${data?.services?.length ?? 0}`);
  console.log(`  testimonials      = ${data?.testimonials?.length ?? 0}`);
  console.log(`  gallery           = ${data?.gallery?.length ?? 0} images`);
  console.log(`  benefits          = ${data?.sections?.whyChooseUs?.benefits?.length ?? 0}`);
  console.log(`  faq items         = ${data?.sections?.faq?.items?.length ?? 0}`);
  console.log(`  theme             = ${JSON.stringify(data?.theme)}`);

  // 5) Deploy intent
  const skipDeploy = process.argv.includes("--no-deploy");
  if (skipDeploy) {
    console.log("\n[velvet-muse] --no-deploy flag set, skipping deploy.");
  } else if (!process.env.VERCEL_TOKEN) {
    console.log("\n[velvet-muse] VERCEL_TOKEN not set locally — Firestore docs are ready.");
    console.log("[velvet-muse] To trigger deploy, hit the deployed hub endpoint:");
    console.log(`   POST https://<nichos-hub-host>/api/deploy`);
    console.log(`   body: { "clientId": "${CLIENT_ID}", "niche": "estetica", "hubDocId": "${CLIENT_ID}" }`);
    console.log(`   header: x-deploy-secret: <DEPLOY_SECRET>`);
  } else {
    console.log("\n[velvet-muse] VERCEL_TOKEN set — but deployToVercel is a TS module; skip for now.");
    console.log("[velvet-muse] Hit /api/deploy on the hub if you want to provision Vercel.");
  }

  console.log(`\n[velvet-muse] DONE. clientId=${CLIENT_ID}`);
  console.log(`[velvet-muse] Expected URL once deployed: https://${DOMAIN}\n`);
}

main().catch((err) => {
  console.error("[velvet-muse] FAILED:", err);
  process.exit(1);
});
