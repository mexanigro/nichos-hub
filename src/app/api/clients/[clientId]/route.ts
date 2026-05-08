import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/firebase-admin";
import { pool } from "@/lib/postgres";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await params;
  const db = getDb();
  const doc = await db.collection("hub_clients").doc(clientId).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const client = { id: doc.id, ...doc.data() };
  const internalClientId = doc.data()?.clientId;

  let metrics: unknown[] = [];
  let incidents: unknown[] = [];
  let uptime = { last24h: 100, last7d: 100 };

  try {
    const metricsRes = await pool.query(
      `SELECT id, check_type, response_time_ms, status_code, success, error, checked_at
       FROM metrics WHERE client_id = $1 ORDER BY checked_at DESC LIMIT 50`,
      [internalClientId]
    );
    metrics = metricsRes.rows;

    const incidentsRes = await pool.query(
      `SELECT id, severity, check_type, description, claude_diagnosis, action_taken, resolved, created_at, resolved_at
       FROM incidents WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [internalClientId]
    );
    incidents = incidentsRes.rows;

    const uptimeRes = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours') as total_24h,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours' AND success = true) as success_24h,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days') as total_7d,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days' AND success = true) as success_7d
       FROM metrics WHERE client_id = $1`,
      [internalClientId]
    );

    const r = uptimeRes.rows[0];
    if (r.total_24h > 0) uptime.last24h = Math.round((r.success_24h / r.total_24h) * 100);
    if (r.total_7d > 0) uptime.last7d = Math.round((r.success_7d / r.total_7d) * 100);
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

  return NextResponse.json({ client, metrics, incidents, uptime, messages });
}
