import { pool } from "@/lib/postgres";
import type { HealthStatus } from "@/types";

interface ClientHealth {
  status: HealthStatus;
  lastIncident: {
    id: number;
    severity: string;
    description: string;
    createdAt: Date;
  } | null;
}

export async function getHealthMap(): Promise<Record<string, ClientHealth>> {
  const [metricsResult, recentFailures, incidentsResult] = await Promise.all([
    pool.query(`
      SELECT DISTINCT ON (client_id) client_id, success, checked_at
      FROM metrics ORDER BY client_id, checked_at DESC
    `),
    pool.query(`
      SELECT client_id, COUNT(*) as fail_count
      FROM metrics
      WHERE checked_at > NOW() - INTERVAL '1 hour' AND success = false
      GROUP BY client_id
    `),
    pool.query(`
      SELECT DISTINCT ON (client_id) id, client_id, severity, description, created_at
      FROM incidents ORDER BY client_id, created_at DESC
    `),
  ]);

  const failMap: Record<string, number> = {};
  for (const row of recentFailures.rows) {
    failMap[row.client_id] = parseInt(row.fail_count);
  }

  const incidentMap: Record<string, ClientHealth["lastIncident"]> = {};
  for (const row of incidentsResult.rows) {
    incidentMap[row.client_id] = {
      id: row.id,
      severity: row.severity,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  const healthMap: Record<string, ClientHealth> = {};
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

  return healthMap;
}

export async function getClientHealth(clientId: string) {
  const [metricsRes, incidentsRes, uptimeRes] = await Promise.all([
    pool.query(
      `SELECT id, check_type, response_time_ms, status_code, success, error, checked_at
       FROM metrics WHERE client_id = $1 ORDER BY checked_at DESC LIMIT 50`,
      [clientId]
    ),
    pool.query(
      `SELECT id, severity, check_type, description, claude_diagnosis, action_taken, resolved, created_at, resolved_at
       FROM incidents WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [clientId]
    ),
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours') as total_24h,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours' AND success = true) as success_24h,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days') as total_7d,
         COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days' AND success = true) as success_7d
       FROM metrics WHERE client_id = $1`,
      [clientId]
    ),
  ]);

  const r = uptimeRes.rows[0];
  const uptime = {
    last24h: r?.total_24h > 0 ? Math.round((r.success_24h / r.total_24h) * 100) : 100,
    last7d: r?.total_7d > 0 ? Math.round((r.success_7d / r.total_7d) * 100) : 100,
  };

  return {
    metrics: metricsRes.rows,
    incidents: incidentsRes.rows,
    uptime,
  };
}

export async function getMonitorData() {
  const [activeIncidents, recentIncidents, uptimeStats] = await Promise.all([
    pool.query(`
      SELECT id, client_id, severity, check_type, description, claude_diagnosis, action_taken, created_at
      FROM incidents WHERE resolved = false ORDER BY created_at DESC
    `),
    pool.query(`
      SELECT id, client_id, severity, check_type, description, claude_diagnosis, action_taken, resolved, created_at, resolved_at
      FROM incidents WHERE resolved = true ORDER BY resolved_at DESC LIMIT 50
    `),
    pool.query(`
      SELECT
        client_id,
        COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours') as total_24h,
        COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '24 hours' AND success = true) as success_24h,
        COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days') as total_7d,
        COUNT(*) FILTER (WHERE checked_at > NOW() - INTERVAL '7 days' AND success = true) as success_7d
      FROM metrics GROUP BY client_id ORDER BY client_id
    `),
  ]);

  const uptime = uptimeStats.rows.map((r) => ({
    clientId: r.client_id,
    last24h: r.total_24h > 0 ? Math.round((r.success_24h / r.total_24h) * 100) : 100,
    last7d: r.total_7d > 0 ? Math.round((r.success_7d / r.total_7d) * 100) : 100,
    totalChecks24h: parseInt(r.total_24h),
    totalChecks7d: parseInt(r.total_7d),
  }));

  return {
    activeIncidents: activeIncidents.rows,
    recentIncidents: recentIncidents.rows,
    uptime,
  };
}
