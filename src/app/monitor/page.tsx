"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { UptimeStats } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface IncidentRow {
  id: number;
  client_id: string;
  severity: string;
  check_type: string;
  description: string;
  claude_diagnosis: string | null;
  action_taken: string | null;
  resolved?: boolean;
  created_at: string;
  resolved_at?: string;
}

interface MonitorData {
  activeIncidents: IncidentRow[];
  recentIncidents: IncidentRow[];
  uptime: UptimeStats[];
  error?: string;
}

export default function MonitorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetch("/api/monitor")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!data) return null;

  const uptimeChartData = data.uptime.map((u) => ({
    name: u.clientId,
    "24h": u.last24h,
    "7d": u.last7d,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text">Monitor</h1>
        <p className="text-xs text-text-muted">
          {data.activeIncidents.length} incidentes activos &middot; {data.uptime.length} clientes monitoreados
        </p>
        {data.error && (
          <p className="mt-1 text-xs text-warning">{data.error}</p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-muted">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Activos</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${data.activeIncidents.length > 0 ? "text-danger" : "text-text"}`}>
            {data.activeIncidents.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-muted">
              <CheckCircle size={16} className="text-success" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Resueltos</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-success">{data.recentIncidents.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted">
              <Activity size={16} className="text-accent" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Clientes</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-text">{data.uptime.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-muted">
              <ShieldCheck size={16} className="text-success" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Uptime prom.</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-text">
            {data.uptime.length > 0
              ? Math.round(data.uptime.reduce((s, u) => s + u.last24h, 0) / data.uptime.length)
              : 100}
            %
          </p>
        </div>
      </div>

      {/* Uptime Chart */}
      {uptimeChartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold text-text-muted">Uptime por cliente</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={uptimeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="24h" fill="#3b82f6" radius={[4, 4, 0, 0]} name="24h">
                {uptimeChartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry["24h"] >= 99 ? "#22c55e" : entry["24h"] >= 95 ? "#f59e0b" : "#ef4444"}
                  />
                ))}
              </Bar>
              <Bar dataKey="7d" fill="#3b82f680" radius={[4, 4, 0, 0]} name="7d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Incidents */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-muted">
            <AlertTriangle size={12} className="text-danger" />
            Incidentes activos
          </h3>
          {data.activeIncidents.length === 0 ? (
            <div className="py-8 text-center">
              <Shield size={24} className="mx-auto mb-2 text-success/30" />
              <p className="text-xs text-text-muted">Sin incidentes activos</p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {data.activeIncidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase ${inc.severity === "critical" ? "text-danger" : "text-warning"}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-medium text-text">{inc.client_id}</span>
                    <span className="rounded bg-bg-active px-1 py-0.5 text-[9px] font-medium text-text-muted">
                      {inc.check_type}
                    </span>
                    <span className="ml-auto text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(inc.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{inc.description}</p>
                  {inc.claude_diagnosis && (
                    <p className="mt-1 text-[11px] text-text-muted">
                      <span className="font-medium text-accent">Claude:</span> {inc.claude_diagnosis}
                    </p>
                  )}
                  {inc.action_taken && (
                    <p className="mt-1 text-[11px] text-success">{inc.action_taken}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved History */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-muted">
            <CheckCircle size={12} className="text-success" />
            Historial resuelto
          </h3>
          {data.recentIncidents.length === 0 ? (
            <p className="py-8 text-center text-xs text-text-muted">Sin historial</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {data.recentIncidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <CheckCircle size={10} className="text-success" />
                    <span className="text-xs font-medium text-text">{inc.client_id}</span>
                    <span className="rounded bg-bg-active px-1 py-0.5 text-[9px] font-medium text-text-muted">
                      {inc.check_type}
                    </span>
                    <span className="ml-auto text-[10px] text-text-muted">
                      {inc.resolved_at
                        ? formatDistanceToNow(new Date(inc.resolved_at), { addSuffix: true, locale: es })
                        : "—"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{inc.description}</p>
                  {inc.claude_diagnosis && (
                    <p className="mt-1 text-[11px] text-text-muted">
                      <span className="font-medium text-accent">Claude:</span> {inc.claude_diagnosis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Uptime Table */}
      {data.uptime.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Uptime 24h</th>
                <th className="hidden px-4 py-3 sm:table-cell">Uptime 7d</th>
                <th className="hidden px-4 py-3 md:table-cell">Checks 24h</th>
                <th className="hidden px-4 py-3 md:table-cell">Checks 7d</th>
              </tr>
            </thead>
            <tbody>
              {data.uptime.map((u) => (
                <tr key={u.clientId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-text">{u.clientId}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${u.last24h >= 99 ? "text-success" : u.last24h >= 95 ? "text-warning" : "text-danger"}`}>
                      {u.last24h}%
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className={`text-xs font-bold ${u.last7d >= 99 ? "text-success" : u.last7d >= 95 ? "text-warning" : "text-danger"}`}>
                      {u.last7d}%
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-text-muted md:table-cell">{u.totalChecks24h}</td>
                  <td className="hidden px-4 py-3 text-xs text-text-muted md:table-cell">{u.totalChecks7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
