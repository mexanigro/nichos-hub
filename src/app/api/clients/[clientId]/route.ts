import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { getClientHealth } from "@/lib/repos/health";

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
