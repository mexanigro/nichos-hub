import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { vercelFetchWithRetry } from "@/lib/deploy";

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
  const vercelProjectId = d.vercelProjectId;

  if (!vercelProjectId) {
    return NextResponse.json({ error: "Este cliente no tiene un proyecto en Vercel" }, { status: 400 });
  }

  try {
    // Trigger a new deployment by creating a deployment hook
    const res = await vercelFetchWithRetry(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify({
        name: d.vercelProjectName || d.clientId,
        project: vercelProjectId,
        target: "production",
        gitSource: {
          type: "github",
          repoId: vercelProjectId,
          ref: "main",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[redeploy] Vercel error:", err);
      return NextResponse.json({ error: `Vercel respondio con ${res.status}` }, { status: 502 });
    }

    await db.collection("hub_clients").doc(hubDocId).update({
      deployStatus: "building",
      deployError: null,
    });

    return NextResponse.json({ ok: true, status: "building" });
  } catch (err) {
    console.error("[redeploy] Error:", err);
    return NextResponse.json({ error: "Error al hacer redeploy" }, { status: 500 });
  }
});
