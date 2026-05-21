import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { getHealthMap } from "@/lib/repos/health";
import type { ClientWithHealth, HealthStatus } from "@/types";

export const GET = withOwner(async () => {
  // No usar orderBy — docs sin el campo quedan excluidos silenciosamente.
  // Ordenamos en JS para garantizar que TODOS los docs aparezcan.
  const clientsSnap = await db.collection("hub_clients").get();

  const clients = clientsSnap.docs.map((doc) => {
    const d = doc.data();
    // Firestore Timestamps tienen .toDate(), pero el campo puede no existir
    // o ser un tipo inesperado. Usar fallback robusto.
    const rawDate = d.activationDate?.toDate?.() ?? d.createdAt?.toDate?.() ?? null;
    return {
      id: doc.id,
      businessName: d.businessName || "",
      niche: d.niche || "",
      deployUrl: d.deployUrl || "",
      activationDate: rawDate?.toISOString() ?? null,
      status: d.status || "active",
      adminEmail: d.adminEmail || "",
      clientId: d.clientId || doc.id,
      vercelProjectId: d.vercelProjectId || "",
      deployStatus: d.deployStatus || null,
      deployError: d.deployError || null,
      notes: d.notes || "",
    };
  });

  // Ordenar por fecha desc — docs sin fecha van al final
  clients.sort((a, b) => {
    if (!a.activationDate) return 1;
    if (!b.activationDate) return -1;
    return b.activationDate.localeCompare(a.activationDate);
  });

  let healthMap: Record<string, { status: HealthStatus; lastIncident: unknown }> = {};
  try {
    healthMap = await getHealthMap();
  } catch (err) {
    console.error("[api/clients] PostgreSQL health check failed — clients will show as healthy:", err instanceof Error ? err.message : err);
  }

  const enriched: ClientWithHealth[] = clients.map((c) => ({
    ...c,
    activationDate: c.activationDate ? new Date(c.activationDate) : new Date(),
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

  const existing = await db.collection("hub_clients").where("clientId", "==", clientId).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json({ error: "clientId ya existe" }, { status: 409 });
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
      createdAt: new Date(),
    });

    // Sync to clients/{clientId} — the template's Firestore rules depend on this
    // document existing with an allowed status for bookings to work.
    await db.collection("clients").doc(clientId).set(
      { status: "active" },
      { merge: true },
    );

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    console.error("[api/clients POST] Firestore write failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});

const ALLOWED_CLIENT_FIELDS = new Set([
  "businessName", "niche", "deployUrl", "adminEmail",
  "vercelProjectId", "deployStatus", "deployError",
  "notes", "status", "language",
  "monitorChecks", "paymentStatus",
]);

export const PUT = withOwner(async (req) => {
  const body = await req.json();
  const { id, ...raw } = body;

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (ALLOWED_CLIENT_FIELDS.has(key)) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No hay campos válidos para actualizar" }, { status: 400 });
  }

  try {
    await db.collection("hub_clients").doc(id).update(updates);

    // If status changed, sync to clients/{clientId} for template Firestore rules.
    if (updates.status) {
      const snap = await db.collection("hub_clients").doc(id).get();
      const clientId = snap.data()?.clientId;
      if (clientId) {
        await db.collection("clients").doc(clientId).set(
          { status: updates.status },
          { merge: true },
        );
      }
    }
  } catch (err) {
    console.error("[api/clients PUT]", err);
    return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
