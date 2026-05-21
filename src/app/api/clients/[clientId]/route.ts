import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { getClientHealth } from "@/lib/repos/health";
import { vercelFetch } from "@/lib/deploy";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const doc = await db.collection("hub_clients").doc(clientId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const d = doc.data()!;
  const rawDate = d.activationDate?.toDate?.() ?? d.createdAt?.toDate?.() ?? null;
  const client = {
    id: doc.id,
    businessName: d.businessName || "",
    niche: d.niche || "",
    deployUrl: d.deployUrl || "",
    activationDate: rawDate?.toISOString() ?? new Date().toISOString(),
    status: d.status || "active",
    adminEmail: d.adminEmail || "",
    clientId: d.clientId || doc.id,
    vercelProjectId: d.vercelProjectId || "",
    deployStatus: d.deployStatus || null,
    deployError: d.deployError || null,
    notes: d.notes || "",
    healthStatus: "healthy",
  };
  const internalClientId = d.clientId;
  const clientStatus = d.status || "active";

  // Auto-heal: ensure clients/{clientId} exists (template Firestore rules depend on it).
  if (internalClientId) {
    const clientsDoc = await db.collection("clients").doc(internalClientId).get();
    if (!clientsDoc.exists) {
      await db.collection("clients").doc(internalClientId).set(
        { status: clientStatus },
        { merge: true },
      );
    }
  }

  let healthData = { metrics: [] as unknown[], incidents: [] as unknown[], uptime: { last24h: 100, last7d: 100 } };
  try {
    healthData = await getClientHealth(internalClientId);
  } catch {
    // PG not available
  }

  const messagesSnap = await db
    .collection("provider_messages")
    .where("clientId", "==", internalClientId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const messages = messagesSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  }));

  return NextResponse.json({ client, ...healthData, messages });
});

export const DELETE = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const doc = await db.collection("hub_clients").doc(clientId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const d = doc.data()!;
  const internalClientId = d.clientId;
  const vercelProjectId = d.vercelProjectId;

  // 1. Delete Vercel project if exists
  if (vercelProjectId) {
    try {
      const res = await vercelFetch(`/v9/projects/${vercelProjectId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        const err = await res.text();
        console.error("[delete] Vercel delete failed:", err);
        return NextResponse.json({ error: `Error al eliminar proyecto en Vercel: ${res.status}` }, { status: 502 });
      }
    } catch (err) {
      console.error("[delete] Vercel delete error:", err);
      return NextResponse.json({ error: "Error de conexion con Vercel" }, { status: 502 });
    }
  }

  // 2. Delete Firestore docs
  const batch = db.batch();
  batch.delete(db.collection("hub_clients").doc(clientId));
  if (internalClientId) {
    batch.delete(db.collection("clients").doc(internalClientId));
    batch.delete(db.collection("config").doc(internalClientId));
  }
  await batch.commit();

  return NextResponse.json({ ok: true });
});
