// N08 T1b — orquestación del alta en Vercel con puertos inyectados (fetch de Vercel y escritura en
// hub_clients). Contrato (deploy-flow.test.ts): crear proyecto → variables (v10, upsert) → dominio →
// deployment, en ese orden; si Vercel rechaza las variables (no 2xx o failedKeys) o el dominio, el alta
// FALLA CERRADO: hub_clients.deployStatus "error" + deployError (sin valores), vercelProjectId conservado
// para que reprovision pueda reparar, y NO se dispara el deployment. Medido el 2026-09-12: la versión
// anterior (v3 sin comprobar la respuesta) dejó un proyecto sin variables con deployment READY y API 503.
import type { VercelEnvVar } from "./client-env.ts";

export type VercelFetch = (path: string, init?: RequestInit) => Promise<Response>;

export type VercelProvisionParams = {
  clientId: string;
  projectName: string;
  templateRepo: string;
  domain: string;
  envVars: Array<VercelEnvVar | { key: string; value: string; target: string[]; type: string }>;
  fetchVercel: VercelFetch;
  /** Persiste campos en hub_clients (no-op si el alta no tiene doc). */
  updateHub: (fields: Record<string, unknown>) => Promise<void>;
  log?: (msg: string) => void;
};

export type VercelProvisionResult =
  | { projectId: string; domain: string; status: "building"; deploymentId?: string }
  | { projectId: string; domain: string; status: "error"; stage: "env" | "domain" | "deployment"; deployError: string };

/** Cuerpo de error de Vercel acotado y sin valores de variables (sólo código/mensaje/claves). */
async function describeFailure(res: Response, failedKeys: string[] = []): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string; key?: string } };
  const parts = [`HTTP ${res.status}`];
  if (body.error?.code) parts.push(body.error.code);
  if (body.error?.message) parts.push(body.error.message);
  if (body.error?.key) parts.push(`key=${body.error.key}`);
  if (failedKeys.length) parts.push(`failedKeys=${failedKeys.join(",")}`);
  return parts.join(" · ").slice(0, 400);
}

export async function runVercelProvision(p: VercelProvisionParams): Promise<VercelProvisionResult> {
  const log = p.log ?? (() => {});

  // 1. Create project from repo
  const createRes = await p.fetchVercel("/v1/projects", {
    method: "POST",
    body: JSON.stringify({ name: p.projectName, gitRepository: { repo: p.templateRepo, type: "github" }, framework: "vite" }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create project: ${err}`);
  }
  const project = (await createRes.json()) as { id: string };
  const projectId = project.id;
  // El proyecto ya existe: se persiste enseguida para que un fallo posterior sea reparable (reprovision).
  await p.updateHub({ vercelProjectId: projectId, vercelProjectName: p.projectName, domain: p.domain });

  const fail = async (stage: "env" | "domain" | "deployment", deployError: string): Promise<VercelProvisionResult> => {
    log(`[deploy] ${stage} failed: ${deployError}`);
    await p.updateHub({ vercelProjectId: projectId, vercelProjectName: p.projectName, domain: p.domain, deployStatus: "error", deployError: `${stage}: ${deployError}` });
    return { projectId, domain: p.domain, status: "error", stage, deployError };
  };

  // 2. Env vars — v10 con upsert (el tipo "sensitive" de la credencial Admin no existe en v3; reprovision ya usa v10).
  const envRes = await p.fetchVercel(`/v10/projects/${projectId}/env?upsert=true`, { method: "POST", body: JSON.stringify(p.envVars) });
  const envBody = (await envRes.clone().json().catch(() => ({}))) as { failed?: Array<{ error?: { key?: string } }> };
  const failedKeys = (envBody.failed ?? []).map((f) => f.error?.key ?? "?");
  if (!envRes.ok || failedKeys.length > 0) {
    return fail("env", await describeFailure(envRes, failedKeys));
  }

  // 3. Custom domain
  const domainRes = await p.fetchVercel(`/v9/projects/${projectId}/domains`, { method: "POST", body: JSON.stringify({ name: p.domain }) });
  if (!domainRes.ok) {
    return fail("domain", await describeFailure(domainRes));
  }

  // 4. Explicit deployment (project creation via API doesn't always auto-build)
  const [repoOwner, repoName] = p.templateRepo.split("/");
  const deployRes = await p.fetchVercel("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: p.projectName,
      project: projectId,
      target: "production",
      gitSource: { type: "github", org: repoOwner, repo: repoName, ref: "main" },
    }),
  });
  if (!deployRes.ok) {
    return fail("deployment", await describeFailure(deployRes));
  }
  const deploymentId = ((await deployRes.json().catch(() => ({}))) as { id?: string }).id;

  // 5. hub_clients: building (la ficha sondea /api/onboarding/status hasta ready/error)
  await p.updateHub({ vercelProjectId: projectId, vercelProjectName: p.projectName, domain: p.domain, deployStatus: "building", deployError: null, ...(deploymentId ? { vercelDeploymentId: deploymentId } : {}) });

  return { projectId, domain: p.domain, status: "building", deploymentId };
}
