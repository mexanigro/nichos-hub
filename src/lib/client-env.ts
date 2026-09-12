/**
 * R06-ENV: la credencial Admin de barbertemplate-madre (la que ya usa el hub)
 * viaja a cada proyecto Vercel de cliente. El template la lee en
 * `loadAdminFirestore()` (FIREBASE_ADMIN_*) y en `logStartupStatus()`
 * (FIREBASE_PROJECT_ID); sin ella toda su /api responde 503.
 *
 * Modulo puro: sin firebase, sin `@/`, fetch inyectado — testeable sin red.
 * Nunca devuelve ni loggea valores; solo nombres y estados.
 */

export type VercelEnvVar = { key: string; value: string; target: string[]; type: "plain" | "sensitive" };
export type VercelFetch = (path: string, options?: RequestInit) => Promise<Response>;

const TARGETS = ["production", "preview"];

/** Proyectos que nunca se reprovisionan desde el hub (plantilla madre). */
export const PROTECTED_PROJECT_IDS: readonly string[] = ["prj_WPbUEboAIbVn9Z9Wazukaa9oV0pA"];

function required(env: Record<string, string | undefined>, key: string): string {
  const v = env[key]?.trim();
  if (!v) throw new Error(`Falta ${key} en el entorno del hub; no se puede propagar la credencial Admin`);
  return v;
}

/**
 * Misma normalizacion que src/lib/firebase-admin.ts: el template solo hace
 * `replace(/\\n/g, "\n")`, asi que comillas envolventes o escapes dobles que el
 * hub tolera romperian `cert()` alla. Viaja ya limpia (saltos reales).
 */
export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (/^["'`]/.test(key) && key[0] === key[key.length - 1]) key = key.slice(1, -1);
  key = key.replace(/\\n/g, "\n");
  key = key.replace(/\\\n/g, "\n");
  return key.trim();
}

/** Las variables que el servidor del template exige para arrancar con Admin SDK. */
export function buildAdminEnvVars(env: Record<string, string | undefined>): VercelEnvVar[] {
  const projectId = required(env, "FIREBASE_PROJECT_ID");
  const clientEmail = required(env, "FIREBASE_CLIENT_EMAIL");
  const privateKey = normalizePrivateKey(required(env, "FIREBASE_PRIVATE_KEY"));
  const vars: VercelEnvVar[] = [
    { key: "FIREBASE_PROJECT_ID", value: projectId, target: TARGETS, type: "plain" },
    { key: "FIREBASE_ADMIN_PROJECT_ID", value: projectId, target: TARGETS, type: "plain" },
    { key: "FIREBASE_ADMIN_CLIENT_EMAIL", value: clientEmail, target: TARGETS, type: "plain" },
    { key: "FIREBASE_ADMIN_PRIVATE_KEY", value: privateKey, target: TARGETS, type: "sensitive" },
    // N08 T1c (NC-12): el REST del template (api/index.ts getFirestoreAccessToken: admin_users,
    // /api/contact, sitemap, /api/services...) lee SOLO estas dos; mismos valores que las Admin.
    { key: "FIREBASE_SERVICE_ACCOUNT_EMAIL", value: clientEmail, target: TARGETS, type: "plain" },
    { key: "FIREBASE_SERVICE_ACCOUNT_KEY", value: privateKey, target: TARGETS, type: "sensitive" },
  ];
  const databaseId = env.FIREBASE_DATABASE_ID?.trim();
  if (databaseId) vars.push({ key: "FIREBASE_DATABASE_ID", value: databaseId, target: TARGETS, type: "plain" });
  return vars;
}

export type ReprovisionResult =
  | { ok: true; stage: "done"; keys: string[]; deploymentId?: string }
  | { ok: false; stage: "upsert" | "redeploy"; status: number; keys: string[]; failedKeys?: string[] };

interface ReprovisionParams {
  projectId: string;
  projectName: string;
  templateRepo: string;
  env: Record<string, string | undefined>;
  fetchVercel: VercelFetch;
  /** N08 T1c: variables adicionales del mismo lote (p. ej. BUSINESS_OWNER_EMAIL resuelta por la ruta). */
  extraVars?: VercelEnvVar[];
}

/** Upsert de las variables (v10, `upsert=true`) y, solo si TODAS entraron, redeploy de main. */
export async function reprovisionAndRedeploy({ projectId, projectName, templateRepo, env, fetchVercel, extraVars = [] }: ReprovisionParams): Promise<ReprovisionResult> {
  const vars = [...buildAdminEnvVars(env), ...extraVars];
  const keys = vars.map((v) => v.key);

  const upsertRes = await fetchVercel(`/v10/projects/${projectId}/env?upsert=true`, {
    method: "POST",
    body: JSON.stringify(vars),
  });
  const upsertBody = (await upsertRes.json().catch(() => ({}))) as { failed?: Array<{ error?: { key?: string } }> };
  const failedKeys = (upsertBody.failed ?? []).map((f) => f.error?.key ?? "?");
  if (!upsertRes.ok || failedKeys.length > 0) {
    return { ok: false, stage: "upsert", status: upsertRes.status, keys, failedKeys };
  }

  const [repoOwner, repoName] = templateRepo.split("/");
  const deployRes = await fetchVercel("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: projectName,
      project: projectId,
      target: "production",
      gitSource: { type: "github", org: repoOwner, repo: repoName, ref: "main" },
    }),
  });
  if (!deployRes.ok) {
    return { ok: false, stage: "redeploy", status: deployRes.status, keys };
  }
  const deployBody = (await deployRes.json().catch(() => ({}))) as { id?: string };
  return { ok: true, stage: "done", keys, deploymentId: deployBody.id };
}
