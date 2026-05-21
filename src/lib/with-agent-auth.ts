// Middleware de autenticacion para endpoints del agente WhatsApp
// Valida header x-agent-secret contra AGENT_API_SECRET

import { NextRequest, NextResponse } from "next/server";

const AGENT_API_SECRET = process.env.AGENT_API_SECRET;

type RouteCtx = { params: Promise<Record<string, string>> };
type AgentHandler = (req: NextRequest, ctx?: RouteCtx) => Promise<NextResponse>;

export function withAgentAuth(handler: AgentHandler) {
  return async (req: NextRequest, ctx?: RouteCtx): Promise<NextResponse> => {
    if (!AGENT_API_SECRET) {
      console.error("[withAgentAuth] AGENT_API_SECRET no configurado");
      return NextResponse.json(
        { error: "Configuracion de seguridad faltante en el servidor" },
        { status: 500 }
      );
    }

    const secret = req.headers.get("x-agent-secret");
    if (!secret || secret !== AGENT_API_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return handler(req, ctx);
  };
}
