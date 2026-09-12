import { db } from "@/lib/firebase-admin";
import { buildAdminEnvVars } from "@/lib/client-env";
import { resolveOwnerNotificationEmail } from "@/lib/provisioning";
import { runVercelProvision, type VercelProvisionResult } from "@/lib/deploy-flow";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const TEMPLATE_REPO = process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template";

// VITE_FIREBASE_* → what the client template needs
// NEXT_PUBLIC_FIREBASE_* → what the hub already has in Railway
// Same values, different prefix. Fallback automatically.
const FIREBASE_VAR_MAP: Record<string, string> = {
  VITE_FIREBASE_API_KEY: "NEXT_PUBLIC_FIREBASE_API_KEY",
  VITE_FIREBASE_AUTH_DOMAIN: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  VITE_FIREBASE_PROJECT_ID: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  VITE_FIREBASE_STORAGE_BUCKET: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  VITE_FIREBASE_APP_ID: "NEXT_PUBLIC_FIREBASE_APP_ID",
  VITE_FIREBASE_DATABASE_ID: "FIREBASE_DATABASE_ID",
};

function getFirebaseVar(viteKey: string): string | undefined {
  return process.env[viteKey] || process.env[FIREBASE_VAR_MAP[viteKey]];
}

export function vercelFetch(path: string, options: RequestInit = {}) {
  const url = new URL(path, "https://api.vercel.com");
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

  return fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function vercelFetchWithRetry(path: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await vercelFetch(path, options);
    if (res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  return vercelFetch(path, options);
}

interface DeployParams {
  clientId: string;
  niche: string;
  hubDocId?: string;
  demoMode?: boolean;
}

const ALLOWED_UI_LANGUAGES = ["he", "en", "ru", "ar"] as const;
type UiLanguage = (typeof ALLOWED_UI_LANGUAGES)[number];

function resolveClientLanguage(value: unknown): UiLanguage {
  if (typeof value !== "string") return "he";
  const v = value.trim().toLowerCase();
  return (ALLOWED_UI_LANGUAGES as readonly string[]).includes(v) ? (v as UiLanguage) : "he";
}

type DeployResult = VercelProvisionResult;

export async function deployToVercel({ clientId, niche, hubDocId, demoMode = false }: DeployParams): Promise<DeployResult> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN not configured");
  }

  const requiredViteVars = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID"];
  const missingVite = requiredViteVars.filter((v) => !getFirebaseVar(v));
  if (missingVite.length > 0) {
    throw new Error(`Variables de entorno faltantes para deploy: ${missingVite.join(", ")}`);
  }

  const projectName = clientId;

  // 2. Set env vars
  // VITE_UI_LANGUAGE is build-time. Pull the client's language from Firestore
  // so the rendered site (and the ErrorBoundary fallback, which reads the same
  // locale before tenant config loads) matches the client's locale instead of
  // defaulting to Hebrew. Falls back to "he" when the field is missing so
  // older clients keep their original deploy behaviour.
  const configSnap = await db.collection("config").doc(clientId).get();
  const configData = configSnap.data() ?? {};
  const uiLanguage = resolveClientLanguage(configData.language);
  // N08 T1: el alta escribe adminEmail en config; los clientes anteriores sólo lo tienen en hub_clients.
  const hubData = hubDocId ? (await db.collection("hub_clients").doc(hubDocId).get()).data() ?? {} : {};
  const adminEmail = resolveOwnerNotificationEmail(configData, hubData);

  const envVars: Array<{ key: string; value: string; target: string[]; type: string }> = [
    { key: "VITE_CLIENT_ID", value: clientId, target: ["production", "preview"], type: "plain" },
    { key: "VITE_ACTIVE_NICHE", value: niche, target: ["production", "preview"], type: "plain" },
    { key: "VITE_DEMO_MODE", value: demoMode ? "true" : "false", target: ["production", "preview"], type: "plain" },
    { key: "VITE_UI_LANGUAGE", value: uiLanguage, target: ["production", "preview"], type: "plain" },
  ];

  for (const viteKey of Object.keys(FIREBASE_VAR_MAP)) {
    const val = getFirebaseVar(viteKey);
    if (val) {
      envVars.push({ key: viteKey, value: val, target: ["production", "preview"], type: "plain" });
    }
  }

  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  if (resendKey) {
    envVars.push({ key: "EMAIL_PROVIDER_API_KEY", value: resendKey, target: ["production", "preview"], type: "encrypted" });
  }
  const emailFrom = process.env.EMAIL_FROM_ADDRESS || "noreply@arzac.studio";
  envVars.push({ key: "EMAIL_FROM_ADDRESS", value: emailFrom, target: ["production", "preview"], type: "plain" });

  if (adminEmail) {
    envVars.push({ key: "BUSINESS_OWNER_EMAIL", value: adminEmail, target: ["production", "preview"], type: "plain" });
  }

  // R06-ENV: sin la credencial Admin el servidor del template responde 503 en toda su /api.
  envVars.push(...buildAdminEnvVars(process.env));

  // N08 T1b: crear proyecto → variables (v10 upsert) → dominio → deployment, con fallo cerrado
  // (deploy-flow.ts, con test): si Vercel rechaza variables o dominio, hub_clients queda en "error"
  // con deployError y NO se dispara el deployment; vercelProjectId se conserva para reprovision.
  const domain = `${clientId}.arzac.studio`;
  return runVercelProvision({
    clientId,
    projectName,
    templateRepo: TEMPLATE_REPO,
    domain,
    envVars,
    fetchVercel: vercelFetchWithRetry,
    updateHub: async (fields) => {
      if (hubDocId) await db.collection("hub_clients").doc(hubDocId).update(fields);
    },
    log: (msg) => console.error(msg),
  });
}
