/**
 * One-time provisioning: Lekt Grigori employment demo
 *
 * "employment" no existe como nicho en el sistema → se mapea a "estetica"
 * (política CLAUDE.md: nicho "otro" → estetica para deploy).
 *
 * Run: npx tsx scripts/provision-lekt-grigori.ts
 * Requires: .env.local en el directorio raíz del proyecto
 */

import { readFileSync } from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Load .env.local ----------------------------------------------------------
try {
  const content = readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on env vars already set in shell
}

// --- Firebase Admin init -----------------------------------------------------
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const databaseId = process.env.FIREBASE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
try {
  db.settings({ preferRest: true });
} catch { /* already set */ }

// --- Client config -----------------------------------------------------------
const BUSINESS_NAME_HE = "לכט גריגורי";
const NICHE = "estetica"; // employment → estetica (no existe plantilla employment)
const MODE = "team" as const;
const LANGUAGE = "he";
const ADDRESS = "ביאליק 44, אשקלון";
const PHONE = "";
const EMAIL = "";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const TEMPLATE_REPO = process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template";

// --- Helpers -----------------------------------------------------------------
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildFeatures(mode: "solo" | "team"): Record<string, boolean> {
  return {
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
}

const THEMES: Record<string, string> = {
  barberia: "classic-dark",
  estetica: "elegance-light",
  tattoo: "ink-dark",
  nails: "pastel-soft",
  cafeteria: "warm-cream",
  remodelaciones: "pro-slate",
};

const SPLASHES: Record<string, number> = {
  barberia: 1,
  estetica: 4,
  tattoo: 5,
  nails: 3,
  cafeteria: 6,
  remodelaciones: 7,
};

const FIREBASE_VAR_MAP: Record<string, string> = {
  VITE_FIREBASE_API_KEY: "NEXT_PUBLIC_FIREBASE_API_KEY",
  VITE_FIREBASE_AUTH_DOMAIN: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  VITE_FIREBASE_PROJECT_ID: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  VITE_FIREBASE_STORAGE_BUCKET: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  VITE_FIREBASE_APP_ID: "NEXT_PUBLIC_FIREBASE_APP_ID",
};

function getFirebaseVar(viteKey: string): string | undefined {
  return process.env[viteKey] || process.env[FIREBASE_VAR_MAP[viteKey]];
}

async function vercelFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = new URL(path, "https://api.vercel.com");
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);
  return fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

// --- Main --------------------------------------------------------------------
async function main() {
  // "lekt-grigori" como base latina para URL-safe slug
  const slug = `demo-${slugify("lekt-grigori")}-${Date.now().toString(36)}`;
  const domain = `${slug}.arzac.studio`;

  console.log("\n=== Provisioning Lekt Grigori ===");
  console.log(`  businessName : ${BUSINESS_NAME_HE}`);
  console.log(`  clientId     : ${slug}`);
  console.log(`  domain       : https://${domain}`);
  console.log(`  niche        : ${NICHE} (employment → estetica, no existe plantilla employment)`);
  console.log(`  language     : ${LANGUAGE}`);
  console.log("");

  // 1. hub_clients
  console.log("1. Creando hub_clients...");
  const hubRef = db.collection("hub_clients").doc();
  await hubRef.set({
    businessName: BUSINESS_NAME_HE,
    niche: NICHE,
    businessMode: MODE,
    clientId: slug,
    status: "demo",
    deployUrl: `https://${domain}`,
    domain,
    adminEmail: "",
    createdAt: new Date(),
    activationDate: new Date(),
    contact: {
      phone: PHONE,
      email: EMAIL,
      address: ADDRESS,
      instagram: "",
    },
    description: "",
    language: LANGUAGE,
    notes: "employment → estetica (nicho original: employment)",
  });
  console.log(`   ✓ hub_clients/${hubRef.id}`);

  // 2. clients/{clientId} — requerido por Firestore rules del template
  console.log("2. Creando clients doc...");
  await db.collection("clients").doc(slug).set({ status: "active" });
  console.log(`   ✓ clients/${slug}`);

  // 3. config/{clientId} — remote config para la landing page
  console.log("3. Creando config doc...");
  await db.collection("config").doc(slug).set({
    business: { type: NICHE, mode: MODE, name: BUSINESS_NAME_HE },
    brand: {
      name: BUSINESS_NAME_HE,
      tagline: "",
      description: "",
    },
    contact: {
      phone: PHONE,
      email: EMAIL,
      address: { street: ADDRESS },
    },
    features: buildFeatures(MODE),
    activeTheme: THEMES[NICHE] || "classic-dark",
    splash: { enabled: true, variant: SPLASHES[NICHE] ?? 1 },
    language: LANGUAGE,
  });
  console.log(`   ✓ config/${slug}`);

  // 4. Vercel deploy
  if (!VERCEL_TOKEN) {
    console.log("\n⚠️  VERCEL_TOKEN no encontrado — saltando deploy Vercel.");
    console.log("   Para deployar, agregá en .env.local:");
    console.log("   VERCEL_TOKEN=<tu-token>");
    console.log("   VERCEL_TEAM_ID=<tu-team-id>  (si usás Vercel Teams)");
    console.log("   Luego re-ejecutá: npx tsx scripts/provision-lekt-grigori.ts");
    console.log("\n✅ Docs Firestore creados correctamente.");
    console.log(`   clientId : ${slug}`);
    console.log(`   hubDocId : ${hubRef.id}`);
    return;
  }

  console.log("\n4. Deployando a Vercel...");

  // 4a. Crear proyecto
  const createRes = await vercelFetch("/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: slug,
      gitRepository: { repo: TEMPLATE_REPO, type: "github" },
      framework: "vite",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Fallo al crear proyecto Vercel: ${err}`);
  }

  const project = await createRes.json() as { id: string };
  const projectId = project.id;
  console.log(`   ✓ Proyecto Vercel: ${projectId}`);

  // 4b. Env vars
  const envVars: Array<{ key: string; value: string; target: string[]; type: string }> = [
    { key: "VITE_CLIENT_ID", value: slug, target: ["production", "preview"], type: "plain" },
    { key: "VITE_ACTIVE_NICHE", value: NICHE, target: ["production", "preview"], type: "plain" },
    { key: "VITE_DEMO_MODE", value: "false", target: ["production", "preview"], type: "plain" },
    { key: "VITE_UI_LANGUAGE", value: LANGUAGE, target: ["production", "preview"], type: "plain" },
  ];

  for (const viteKey of Object.keys(FIREBASE_VAR_MAP)) {
    const val = getFirebaseVar(viteKey);
    if (val) {
      envVars.push({ key: viteKey, value: val, target: ["production", "preview"], type: "plain" });
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    envVars.push({ key: "EMAIL_PROVIDER_API_KEY", value: resendKey, target: ["production", "preview"], type: "encrypted" });
  }
  envVars.push({ key: "EMAIL_FROM_ADDRESS", value: "noreply@arzac.studio", target: ["production", "preview"], type: "plain" });

  await vercelFetch(`/v3/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify(envVars),
  });
  console.log(`   ✓ Env vars configuradas`);

  // 4c. Custom domain
  const domainRes = await vercelFetch(`/v9/projects/${projectId}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
  if (domainRes.ok) {
    console.log(`   ✓ Dominio agregado: ${domain}`);
  } else {
    const err = await domainRes.text();
    console.warn(`   ⚠ Dominio: ${err}`);
  }

  // 4d. Trigger deploy
  const [repoOwner, repoName] = TEMPLATE_REPO.split("/");
  const deployRes = await vercelFetch("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: slug,
      project: projectId,
      target: "production",
      gitSource: { type: "github", org: repoOwner, repo: repoName, ref: "main" },
    }),
  });

  if (deployRes.ok) {
    const deployData = await deployRes.json() as { id?: string };
    console.log(`   ✓ Deploy iniciado: ${deployData.id ?? "ok"}`);
  } else {
    const err = await deployRes.text();
    console.warn(`   ⚠ Deploy trigger: ${err}`);
  }

  // 4e. Update hub_clients
  await hubRef.update({
    vercelProjectId: projectId,
    vercelProjectName: slug,
    domain,
    deployStatus: "building",
    deployError: null,
  });
  console.log(`   ✓ hub_clients actualizado con info Vercel`);

  console.log("\n✅ Listo!");
  console.log(`   clientId    : ${slug}`);
  console.log(`   hubDocId    : ${hubRef.id}`);
  console.log(`   deploy URL  : https://${domain}`);
  console.log(`   (building — verificar estado en Vercel dashboard)`);
}

main().catch((err) => {
  console.error("\nProvisioning fallido:", err);
  process.exit(1);
});
