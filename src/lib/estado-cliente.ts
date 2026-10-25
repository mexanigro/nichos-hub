// CRM-05 (D-361): «suspendida» es la web y el CRM apagados (contrato v9.0, 2.4). El PUT de clientes pausa el proyecto de Vercel al
// suspender o archivar y lo despausa al volver a "active", como el kill switch (`api/clients/kill/route.ts`).

export type AccionVercel = "pausar" | "despausar";

const APAGADO = new Set(["suspended", "archived"]);

/** Qué hacer en Vercel al pasar de `antes` a `despues`; null si nada. */
export function accionDeEstado(antes: string | undefined, despues: string): AccionVercel | null {
  const estabaApagado = APAGADO.has(antes ?? "");
  if (APAGADO.has(despues)) return estabaApagado ? null : "pausar";
  if (despues === "active" && estabaApagado) return "despausar";
  return null;
}

export async function aplicarAccionEnVercel(
  accion: AccionVercel,
  { vercelProjectId, token, teamId, fetch: fetchFn = fetch }: { vercelProjectId: string; token: string; teamId?: string; fetch?: typeof fetch },
): Promise<{ ok: boolean; status: number }> {
  const ruta = accion === "pausar" ? "pause" : "unpause";
  const url = `https://api.vercel.com/v1/projects/${encodeURIComponent(vercelProjectId)}/${ruta}${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""}`;
  const res = await fetchFn(url, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  return { ok: res.ok, status: res.status };
}
