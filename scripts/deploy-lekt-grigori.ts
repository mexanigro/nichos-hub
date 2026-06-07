/**
 * Deploy-only: Lekt Grigori (Firestore docs ya existen)
 * Usa el clientId y hubDocId generados por provision-lekt-grigori.ts
 *
 * Run: npx tsx scripts/deploy-lekt-grigori.ts
 * Requires: VERCEL_TOKEN en .env.local o en el entorno
 */

import { readFileSync } from "fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// --- Load .env.local ---------------------------------------------------------
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
} catch { /* rely on env vars already set */ }

// --- Firebase Admin ----------------------------------------------------------
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
try { db.settings({ preferRest: true }); } catch { /* already set */ }

// --- Datos del cliente ya provisionado ---------------------------------------
const CLIENT_ID = "demo-lekt-grigori-mpyhjweg";
const HUB_DOC_ID = "tPYTCnw9wnrJx4hrOKrW";
const NICHE = "estetica";
const LANGUAGE = "he";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const TEMPLATE_REPO = process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template";

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

async function main() {
  if (!VERCEL_TOKEN) {
    console.error("❌ VERCEL_TOKEN no configurado. Agregalo en .env.local y re-ejecutá.");
    process.exit(1);
  }

  const domain = `${CLIENT_ID}.arzac.studio`;
  console.log(`\n=== Deploy Lekt Grigori ===`);
  console.log(`  clientId : ${CLIENT_ID}`);
  console.log(`  domain   : https://${domain}`);
  console.log("");

  // 1. Crear proyecto Vercel
  console.log("1. Creando proyecto Vercel...");
  const createRes = await vercelFetch("/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: CLIENT_ID,
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
  console.log(`   ✓ projectId: ${projectId}`);

  // 2. Env vars
  console.log("2. Configurando env vars...");
  const envVars: Array<{ key: string; value: string; target: string[]; type: string }> = [
    { key: "VITE_CLIENT_ID", value: CLIENT_ID, target: ["production", "preview"], type: "plain" },
    { key: "VITE_ACTIVE_NICHE", value: NICHE, target: ["production", "preview"], type: "plain" },
    { key: "VITE_DEMO_MODE", value: "false", target: ["production", "preview"], type: "plain" },
    { key: "VITE_UI_LANGUAGE", value: LANGUAGE, target: ["production", "preview"], type: "plain" },
  ];

  for (const viteKey of Object.keys(FIREBASE_VAR_MAP)) {
    const val = getFirebaseVar(viteKey);
    if (val) envVars.push({ key: viteKey, value: val, target: ["production", "preview"], type: "plain" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) envVars.push({ key: "EMAIL_PROVIDER_API_KEY", value: resendKey, target: ["production", "preview"], type: "encrypted" });
  envVars.push({ key: "EMAIL_FROM_ADDRESS", value: "noreply@arzac.studio", target: ["production", "preview"], type: "plain" });

  const envRes = await vercelFetch(`/v3/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify(envVars),
  });
  if (envRes.ok) {
    console.log(`   ✓ ${envVars.length} vars configuradas`);
  } else {
    console.warn(`   ⚠ env vars: ${await envRes.text()}`);
  }

  // 3. Custom domain
  console.log("3. Agregando dominio...");
  const domainRes = await vercelFetch(`/v9/projects/${projectId}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
  if (domainRes.ok) {
    console.log(`   ✓ ${domain}`);
  } else {
    console.warn(`   ⚠ ${await domainRes.text()}`);
  }

  // 4. Trigger deploy
  console.log("4. Triggering deploy...");
  const [repoOwner, repoName] = TEMPLATE_REPO.split("/");
  const deployRes = await vercelFetch("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: CLIENT_ID,
      project: projectId,
      target: "production",
      gitSource: { type: "github", org: repoOwner, repo: repoName, ref: "main" },
    }),
  });

  let deployId = "";
  if (deployRes.ok) {
    const data = await deployRes.json() as { id?: string };
    deployId = data.id ?? "";
    console.log(`   ✓ deploy: ${deployId}`);
  } else {
    console.warn(`   ⚠ deploy trigger: ${await deployRes.text()}`);
  }

  // 5. Actualizar hub_clients
  console.log("5. Actualizando hub_clients...");
  await db.collection("hub_clients").doc(HUB_DOC_ID).update({
    vercelProjectId: projectId,
    vercelProjectName: CLIENT_ID,
    domain,
    deployStatus: "building",
    deployError: null,
  });
  console.log(`   ✓ hub_clients/${HUB_DOC_ID} actualizado`);

  console.log(`\n✅ Deploy iniciado!`);
  console.log(`   clientId      : ${CLIENT_ID}`);
  console.log(`   vercelProject : ${projectId}`);
  console.log(`   URL           : https://${domain}`);
  console.log(`   (building — verificar en https://vercel.com/dashboard)`);
}

main().catch((err) => {
  console.error("\nDeploy fallido:", err);
  process.exit(1);
});
