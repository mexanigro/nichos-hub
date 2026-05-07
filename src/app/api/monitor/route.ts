import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/postgres";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [activeIncidents, recentIncidents, uptimeStats] = await Promise.all([
      pool.query(`
        SELECT id, client_id, severity, check_type, description, claude_diagnosis, action_taken, created_at
        FROM incidents
        WHERE resolved = false
        ORDER BY created_at DESC
      `),
      pool.query(`
        SELECT id, client_id, severity, check_type, description, claude_diagnosis, action_taken, resolved, created_at, resolved_at
        FROM incidents
        WHERE resolved = true
        ORDER BY resolved_at DESC
        LIMIT 50
      `),
      pool.query(`
        SELECT
          client_id,
          COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours') as total_24h,
          COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours' AND success = true) as success_24h,
          COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days') as total_7d,
          COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days' AND success = true) as success_7d
        FROM metrics
        GROUP BY client_id
        ORDER BY client_id
      `),
    ]);

    const uptime = uptimeStats.rows.map((r) => ({
      clientId: r.client_id,
      last24h: r.total_24h > 0 ? Math.round((r.success_24h / r.total_24h) * 100) : 100,
      last7d: r.total_7d > 0 ? Math.round((r.success_7d / r.total_7d) * 100) : 100,
      totalChecks24h: parseInt(r.total_24h),
      totalChecks7d: parseInt(r.total_7d),
    }));

    return NextResponse.json({
      activeIncidents: activeIncidents.rows,
      recentIncidents: recentIncidents.rows,
      uptime,
    });
  } catch (error) {
    return NextResponse.json({
      activeIncidents: [],
      recentIncidents: [],
      uptime: [],
      error: "PostgreSQL not available",
    });
  }
}
