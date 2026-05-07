import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { pool } from "@/lib/postgres";
import type { ClientWithHealth, HealthStatus } from "@/types";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    const metricsResult = await pool.query(`
      SELECT DISTINCT ON (client_id)
        client_id, success, checked_at
      FROM metrics
      ORDER BY client_id, checked_at DESC
    `);

    const recentFailures = await pool.query(`
      SELECT client_id, COUNT(*) as fail_count
      FROM metrics
      WHERE checked_at > NOW() - INTERVAL '1 hour' AND success = false
      GROUP BY client_id
    `);

    const failMap: Record<string, number> = {};
    for (const row of recentFailures.rows) {
      failMap[row.client_id] = parseInt(row.fail_count);
    }

    const incidentsResult = await pool.query(`
      SELECT DISTINCT ON (client_id)
        id, client_id, severity, description, created_at
      FROM incidents
      ORDER BY client_id, created_at DESC
    `);

    const incidentMap: Record<string, unknown> = {};
    for (const row of incidentsResult.rows) {
      incidentMap[row.client_id] = {
        id: row.id,
        severity: row.severity,
        description: row.description,
        createdAt: row.created_at,
      };
    }

    for (const row of metricsResult.rows) {
      const fails = failMap[row.client_id] || 0;
      let status: HealthStatus = "healthy";
      if (!row.success) status = "down";
      else if (fails > 0) status = "degraded";

      healthMap[row.client_id] = {
        status,
        lastIncident: incidentMap[row.client_id] || null,
      };
    }
  } catch {
    // PG not available — all clients show as healthy
  }

  const enriched: ClientWithHealth[] = clients.map((c) => ({
    ...c,
    healthStatus: (healthMap[c.clientId]?.status as HealthStatus) || "healthy",
    lastIncident: healthMap[c.clientId]?.lastIncident as ClientWithHealth["lastIncident"],
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { businessName, niche, deployUrl, adminEmail, clientId, vercelProjectId, notes } = body;

  if (!businessName || !niche || !deployUrl || !clientId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing client id" }, { status: 400 });
  }

  await db.collection("hub_clients").doc(id).update(updates);
  return NextResponse.json({ ok: true });
}
