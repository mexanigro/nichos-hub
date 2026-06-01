import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

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

  const agentUrl = process.env.WHATSAPP_AGENT_URL;
  if (!agentUrl) {
    return NextResponse.json({
      ...firestoreStatus,
      agent: {
        online: false,
        status: "not_configured" as const,
        label: "No configurado",
        description: "WHATSAPP_AGENT_URL no esta definida en el servidor. El agente no puede ser contactado.",
      },
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
        agent: {
          online: true,
          status: "online" as const,
          label: "En linea",
          ...agentData,
        },
      });
    }

    return NextResponse.json({
      ...firestoreStatus,
      agent: {
        online: false,
        status: "error" as const,
        label: "Error",
        description: `El agente respondio con status ${res.status}`,
        httpStatus: res.status,
      },
    });
  } catch {
    return NextResponse.json({
      ...firestoreStatus,
      agent: {
        online: false,
        status: "down" as const,
        label: "Caido",
        description: "No se pudo conectar con el agente. Puede estar apagado o reiniciandose.",
      },
    });
  }
});
