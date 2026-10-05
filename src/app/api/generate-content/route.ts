import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withOwner } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { db } from "@/lib/firebase-admin";
import { escribirTextos } from "@/lib/textos-claude";
import { isValidClientLanguage } from "@/lib/client-language";

// ALTA-IDIOMAS-01 (D-241, D-242): el único generador de textos, para todos los nichos. Lee config/{id} y devuelve la propuesta en
// los cuatro idiomas con sus errores; no escribe: el dueño acepta campo por campo y la pestaña guarda por el PUT de siempre.
export const POST = withOwner(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "generate-content", 5, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }
  try {
    const { clientId, notas, base: pedido, niche: nichoFicha } = (await req.json()) as { clientId?: unknown; notas?: unknown; base?: unknown; niche?: unknown };
    if (typeof clientId !== "string" || !clientId) return NextResponse.json({ error: "Falta clientId" }, { status: 400 });
    const snap = await db.collection("config").doc(clientId).get();
    if (!snap.exists) return NextResponse.json({ error: "Cliente sin config" }, { status: 404 });
    const config = snap.data() ?? {};
    const niche = typeof config.business?.type === "string" ? config.business.type : typeof nichoFicha === "string" ? nichoFicha : "estetica";
    // El idioma base es el de la ficha (hub_clients.language), que la pestaña manda; sin él, el del config.
    const base = isValidClientLanguage(pedido) ? pedido : isValidClientLanguage(config.language) ? config.language : "he";
    const r = await escribirTextos(new Anthropic(), { config, niche, base, notas: typeof notas === "string" ? notas.slice(0, 4000) : "" });
    return NextResponse.json(r);
  } catch (err) {
    console.error("[generate-content] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "No se pudo generar la propuesta" }, { status: 500 });
  }
});
