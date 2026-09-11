import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { vercelFetchWithRetry } from "@/lib/deploy";
import { reprovisionAndRedeploy, PROTECTED_PROJECT_IDS } from "@/lib/client-env";

/**
 * R06-ENV: reprovisiona la credencial Admin en el proyecto Vercel de un cliente
 * existente (upsert) y redespliega main. Solo owner. Nunca loggea valores.
 */
export const POST = withOwner(async (req) => {
  const { hubDocId } = await req.json();

  if (!hubDocId) {
    return NextResponse.json({ error: "hubDocId es requerido" }, { status: 400 });
  }

  const doc = await db.collection("hub_clients").doc(hubDocId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const d = doc.data()!;
  const vercelProjectId = d.vercelProjectId as string | undefined;
  if (!vercelProjectId) {
    return NextResponse.json({ error: "Este cliente no tiene un proyecto en Vercel" }, { status: 400 });
  }
  if (PROTECTED_PROJECT_IDS.includes(vercelProjectId)) {
    return NextResponse.json({ error: "Proyecto plantilla: no se reprovisiona desde el hub" }, { status: 403 });
  }

  try {
    const result = await reprovisionAndRedeploy({
      projectId: vercelProjectId,
      projectName: d.vercelProjectName || d.clientId,
      templateRepo: process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template",
      env: process.env,
      fetchVercel: vercelFetchWithRetry,
    });

    if (!result.ok) {
      console.error(`[reprovision] ${hubDocId}: Vercel ${result.status} en ${result.stage}`, result.failedKeys ?? []);
      if (result.stage === "upsert" && result.status === 404) {
        return NextResponse.json({ error: "El proyecto Vercel de este cliente no existe", stage: result.stage }, { status: 404 });
      }
      return NextResponse.json({ error: `Vercel respondio con ${result.status}`, stage: result.stage, failedKeys: result.failedKeys ?? [] }, { status: 502 });
    }

    await db.collection("hub_clients").doc(hubDocId).update({
      deployStatus: "building",
      deployError: null,
    });

    return NextResponse.json({ ok: true, status: "building", keys: result.keys, deploymentId: result.deploymentId ?? null });
  } catch (err) {
    console.error("[reprovision] Error:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "Error al reprovisionar el entorno" }, { status: 500 });
  }
});
