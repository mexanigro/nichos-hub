import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { vercelFetchWithRetry } from "@/lib/deploy";
import { redesplegar } from "@/lib/variables-deploy";

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
    // VENTA-01 (D-265): sube las variables del link (nombre, línea, descripción e imagen de config/{id}) y recién después pide el
    // deployment; si Vercel rechaza una variable, no se construye y se dice por qué.
    const config = (await db.collection("config").doc(d.clientId || hubDocId).get()).data() ?? {};
    const r = await redesplegar({
      hub: d,
      config,
      templateRepo: process.env.VERCEL_TEMPLATE_REPO || "mexanigro/Barber-shop-template",
      fetchVercel: vercelFetchWithRetry,
    });
    if (!r.ok) {
      console.error(`[redeploy] Vercel ${r.stage}: ${r.detalle}`);
      const que = r.stage === "env" ? "rechazó las variables del link" : "rechazó el deployment";
      return NextResponse.json({ error: `Vercel ${que} (${r.detalle}); no se construyó`, stage: r.stage }, { status: 502 });
    }

    await db.collection("hub_clients").doc(hubDocId).update({
      deployStatus: "building",
      deployError: null,
    });

    return NextResponse.json({ ok: true, status: "building", keys: r.keys });
  } catch (err) {
    console.error("[redeploy] Error:", err);
    return NextResponse.json({ error: "Error al hacer redeploy" }, { status: 500 });
  }
});
