import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * GET /api/whatsapp-config/:clientId/status
 * Consulta el estado del agente WhatsApp en tiempo real.
 *
 * 1. Lee la config de Firestore (whatsapp_config/{clientId})
 * 2. Si WHATSAPP_AGENT_URL está configurado, consulta al agente
 *    su estado actual (online/offline, pausa, etc.)
 * 3. Retorna un objeto unificado con ambas fuentes.
 */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  // 1. Leer config de Firestore
  const configSnap = await db.collection("whatsapp_config").doc(clientId).get();
  const config = configSnap.exists ? configSnap.data() : null;

  const firestoreStatus = {
    configured: !!config,
    enabled: config?.enabled ?? false,
    paused: config?.pauseState?.paused ?? false,
    resumeAt: config?.pauseState?.resumeAt ?? null,
    adminPhones: config?.adminPhones?.length ?? 0,
    hasSystemPrompt: !!config?.systemPrompt,
  };

  // 2. Consultar agente remoto si hay URL configurada
  const agentUrl = process.env.WHATSAPP_AGENT_URL;
  if (!agentUrl) {
    return NextResponse.json({
      ...firestoreStatus,
      agent: { online: false, reason: "not_configured" },
    });
  }

  try {
    const res = await fetch(`${agentUrl}/status?clientId=${clientId}`, {
      signal: AbortSignal.timeout(5000),
      headers: {
        ...(process.env.AGENT_API_SECRET
          ? { "x-api-secret": process.env.AGENT_API_SECRET }
          : {}),
      },
    });

    if (res.ok) {
      const agentData = await res.json();
      return NextResponse.json({
        ...firestoreStatus,
        agent: { online: true, ...agentData },
      });
    }

    return NextResponse.json({
      ...firestoreStatus,
      agent: { online: false, reason: "agent_error", status: res.status },
    });
  } catch {
    return NextResponse.json({
      ...firestoreStatus,
      agent: { online: false, reason: "unreachable" },
    });
  }
});
