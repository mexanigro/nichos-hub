import { db } from "@/lib/firebase-admin";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const TEMPLATE_REPO = process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template";

const SHARED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

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

interface DeployResult {
  projectId: string;
  domain: string;
  status: string;
}

export async function deployToVercel({ clientId, niche, hubDocId, demoMode = false }: DeployParams): Promise<DeployResult> {
  if (!VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN not configured");
  }

  const requiredViteVars = ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID"];
  const missingVite = requiredViteVars.filter((v) => !process.env[v]);
  if (missingVite.length > 0) {
    throw new Error(`Variables de entorno faltantes para deploy: ${missingVite.join(", ")}`);
  }

  const projectName = clientId;

  // 1. Create project from repo
  const createRes = await vercelFetchWithRetry("/v1/projects", {
    method: "POST",
    body: JSON.stringify({
      name: projectName,
      gitRepository: { repo: TEMPLATE_REPO, type: "github" },
      framework: "vite",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create project: ${err}`);
  }

  const project = await createRes.json();
  const projectId = project.id;

  // 2. Set env vars
  const envVars: Array<{ key: string; value: string; target: string[]; type: string }> = [
    { key: "VITE_CLIENT_ID", value: clientId, target: ["production", "preview"], type: "plain" },
    { key: "VITE_ACTIVE_NICHE", value: niche, target: ["production", "preview"], type: "plain" },
    { key: "VITE_DEMO_MODE", value: demoMode ? "true" : "false", target: ["production", "preview"], type: "plain" },
    { key: "VITE_UI_LANGUAGE", value: "he", target: ["production", "preview"], type: "plain" },
  ];

  for (const key of SHARED_ENV_VARS) {
    const val = process.env[key];
    if (val) {
      envVars.push({ key, value: val, target: ["production", "preview"], type: "plain" });
    }
  }

  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  if (resendKey) {
    envVars.push({ key: "EMAIL_PROVIDER_API_KEY", value: resendKey, target: ["production", "preview"], type: "encrypted" });
  }
  const emailFrom = process.env.EMAIL_FROM_ADDRESS || "noreply@arzac.studio";
  envVars.push({ key: "EMAIL_FROM_ADDRESS", value: emailFrom, target: ["production", "preview"], type: "plain" });

  const configSnap = await db.collection("config").doc(clientId).get();
  const adminEmail = configSnap.data()?.adminEmail as string | undefined;
  if (adminEmail) {
    envVars.push({ key: "BUSINESS_OWNER_EMAIL", value: adminEmail, target: ["production", "preview"], type: "plain" });
  }

  await vercelFetchWithRetry(`/v3/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify(envVars),
  });

  // 3. Add custom domain
  const domain = `${clientId}.arzac.studio`;
  await vercelFetchWithRetry(`/v9/projects/${projectId}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });

  // 4. Update hub_clients with vercel info
  if (hubDocId) {
    await db.collection("hub_clients").doc(hubDocId).update({
      vercelProjectId: projectId,
      vercelProjectName: projectName,
      domain,
      deployStatus: "building",
      deployError: null,
    });
  }

  return { projectId, domain, status: "building" };
}
