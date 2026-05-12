import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { getHealthMap } from "@/lib/repos/health";
import type { ClientWithHealth, HealthStatus } from "@/types";

export const GET = withOwner(async () => {
  const clientsSnap = await db.collection("hub_clients").orderBy("businessName").get();

  const clients = clientsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      businessName: d.businessName,
      niche: d.niche,
      deployUrl: d.deployUrl,
      activationDate: d.activationDate?.toDate(),
      status: d.status,
      adminEmail: d.adminEmail,
      clientId: d.clientId,
      vercelProjectId: d.vercelProjectId,
      notes: d.notes,
    };
  });

  let healthMap: Record<string, { status: HealthStatus; lastIncident: unknown }> = {};
  try {
    healthMap = await getHealthMap();
  } catch {
    // PG not available — all clients show as healthy
  }

  const enriched: ClientWithHealth[] = clients.map((c) => ({
    ...c,
    healthStatus: (healthMap[c.clientId]?.status as HealthStatus) || "healthy",
    lastIncident: healthMap[c.clientId]?.lastIncident as ClientWithHealth["lastIncident"],
  }));

  return NextResponse.json(enriched);
});

export const POST = withOwner(async (req) => {
  const body = await req.json();
  const { businessName, niche, deployUrl, adminEmail, clientId, vercelProjectId, notes } = body;

  if (!businessName || !niche || !deployUrl || !clientId) {
    return NextResponse.json({ error: "Campos requeridos: businessName, niche, deployUrl, clientId" }, { status: 400 });
  }

  try {
    const docRef = await db.collection("hub_clients").add({
      businessName,
      niche,
      deployUrl,
      adminEmail: adminEmail || "",
      clientId,
      vercelProjectId: vercelProjectId || "",
      notes: notes || "",
      status: "active",
      activationDate: new Date(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("[api/clients POST] Firestore write failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

export const PUT = withOwner(async (req) => {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  await db.collection("hub_clients").doc(id).update(updates);
  return NextResponse.json({ ok: true });
});
