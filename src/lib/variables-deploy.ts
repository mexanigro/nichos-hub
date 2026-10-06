// VENTA-01 (D-264..D-268): el link de una web (lo que WhatsApp muestra al pegar la url) lo arma en el BUILD el plugin de SEO de T
// (`scripts/vite-plugin-seo.ts`) con VITE_BRAND_NAME, VITE_BRAND_TAGLINE, VITE_BRAND_DESCRIPTION y VITE_OG_IMAGE; lo que falta cae al
// default del nicho («Studio Noa … ברמת גן» en peluquería). Este módulo arma esas variables desde el config de la clienta y las sube
// antes de pedir el deployment. Puro (sin firebase-admin ni `@/`): fetch de Vercel inyectado, testeable sin red.
import type { VercelEnvVar } from "./client-env.ts";
import { describeFailure, type VercelFetch } from "./deploy-flow.ts";

type Datos = Record<string, any>;

/** Lo que escribe la clienta es dato (D-266): sin saltos de línea ni caracteres de control (\s cubre U+2028/U+2029), y cada `$`
 *  doblado, porque T arma el HTML con `String.replace` y un `$` seguido de ` ' o & es un patrón de reemplazo («$`» repetía el HTML
 *  entero: 24 <head>). ponytail: atado al `replace` de T; si T pasa a reemplazo por función, el `$` saldría doble. */
function limpiar(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\x00-\x1F\x7F-\x9F]/g, " ").replace(/\s+/g, " ").trim().replace(/\$/g, "$$$$");
}

/** Las variables del link para Vercel. Sólo peluquería (D-267: la flota no cambia). Un campo que falta no manda nada: nunca un texto
 *  vacío que pise el default de T. */
export function variablesDeDeploy(config: Datos, hub: Datos): VercelEnvVar[] {
  if (hub?.niche !== "peluqueria") return [];
  const brand = config?.brand ?? {};
  const og = limpiar(brand.ogImage);
  const pares: Array<[string, string]> = [
    ["VITE_BRAND_NAME", limpiar(brand.name) || limpiar(config?.business?.name) || limpiar(hub.businessName)],
    ["VITE_BRAND_TAGLINE", limpiar(brand.tagline)],
    ["VITE_BRAND_DESCRIPTION", limpiar(brand.description)],
    ["VITE_OG_IMAGE", og.startsWith("https://") ? og : ""], // D-268: la casilla «OG Image» sube a Storage
  ];
  return pares.filter(([, value]) => value).map(([key, value]) => ({ key, value, target: ["production", "preview"], type: "plain" }));
}

export type Redespliegue =
  | { ok: true; deploymentId?: string; keys: string[] }
  | { ok: false; stage: "env" | "deployment"; status: number; detalle: string };

/** El «Redeploy» de la ficha (D-265): sube con upsert las variables del link y recién después pide el deployment de main. Si Vercel
 *  rechaza una variable, no hay deployment (falla cerrado, como el alta). Sin variables (la flota), sólo el deployment, como antes. */
export async function redesplegar(p: { hub: Datos; config: Datos; templateRepo: string; fetchVercel: VercelFetch }): Promise<Redespliegue> {
  const vars = variablesDeDeploy(p.config, p.hub);
  if (vars.length) {
    const res = await p.fetchVercel(`/v10/projects/${p.hub.vercelProjectId}/env?upsert=true`, { method: "POST", body: JSON.stringify(vars) });
    const body = (await res.clone().json().catch(() => ({}))) as { failed?: Array<{ error?: { key?: string } }> };
    const failed = (body.failed ?? []).map((f) => f.error?.key ?? "?");
    if (!res.ok || failed.length) return { ok: false, stage: "env", status: res.status, detalle: await describeFailure(res, failed) };
  }
  const [org, repo] = p.templateRepo.split("/");
  const res = await p.fetchVercel("/v13/deployments", {
    method: "POST",
    body: JSON.stringify({
      name: p.hub.vercelProjectName || p.hub.clientId,
      project: p.hub.vercelProjectId,
      target: "production",
      gitSource: { type: "github", org, repo, ref: "main" },
    }),
  });
  if (!res.ok) return { ok: false, stage: "deployment", status: res.status, detalle: await describeFailure(res) };
  const deploymentId = ((await res.json().catch(() => ({}))) as { id?: string }).id;
  return { ok: true, deploymentId, keys: vars.map((v) => v.key) };
}
