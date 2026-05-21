import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deployToVercel } from "@/lib/deploy";

const DEPLOY_SECRET = process.env.DEPLOY_SECRET;

export async function POST(req: NextRequest) {
  const internalSecret = req.headers.get("x-deploy-secret");
  const isInternalCall = DEPLOY_SECRET && internalSecret === DEPLOY_SECRET;

  if (!isInternalCall) {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "owner") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const { clientId, niche, hubDocId, demoMode = false } = await req.json();

    if (!clientId || !niche) {
      return NextResponse.json({ error: "Missing clientId or niche" }, { status: 400 });
    }

    const result = await deployToVercel({ clientId, niche, hubDocId, demoMode });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Deploy error:", error);
    const message = error instanceof Error ? error.message : "Deploy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
