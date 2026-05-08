"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  ShieldOff,
  MessageSquare,
  Power,
} from "lucide-react";
import { HealthDot, ClientStatusBadge } from "@/components/status-badge";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { ClientWithHealth } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface PgMetric {
  id: number;
  check_type: string;
  response_time_ms: number | null;
  status_code: number | null;
  success: boolean;
  error: string | null;
  checked_at: string;
}

interface PgIncident {
  id: number;
  severity: string;
  check_type: string;
  description: string;
  claude_diagnosis: string | null;
  action_taken: string | null;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

interface ClientDetail {
  client: ClientWithHealth;
  metrics: PgMetric[];
  incidents: PgIncident[];
  uptime: { last24h: number; last7d: number };
  messages: Array<{ id: string; message: string; createdAt: string; sender: string; status: string }>;
}

export default function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [killing, setKilling] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"suspend" | "kill" | null>(null);
  const [killError, setKillError] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [clientId]);

  async function toggleStatus() {
    if (!data) return;
    setToggling(true);
    const newStatus = data.client.status === "suspended" ? "active" : "suspended";
    await fetch("/api/clients", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: clientId, status: newStatus }),
    });
    setData((d) => d ? { ...d, client: { ...d.client, status: newStatus } } : d);
    setToggling(false);
    setConfirmAction(null);
  }

  async function killSwitch(paused: boolean) {
    if (!data) return;
    setKilling(true);
    setKillError("");
    try {
      const res = await fetch("/api/clients/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientDocId: clientId, paused }),
      });
      const result = await res.json();
      if (res.ok) {
        setData((d) =>
          d ? { ...d, client: { ...d.client, status: paused ? "suspended" : "active" } } : d
        );
        setConfirmAction(null);
      } else {
        setKillError(result.error || "Error al ejecutar kill switch");
      }
    } catch {
      setKillError("Error de conexión");
    }
    setKilling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!data) return null;

  const { client, metrics, incidents, uptime, messages } = data;
  const chartData = [...metrics]
    .reverse()
    .filter((m) => m.response_time_ms !== null)
    .map((m) => ({
      time: format(new Date(m.checked_at), "HH:mm"),
      ms: m.response_time_ms,
      success: m.success,
    }));

  const activeIncidents = incidents.filter((i) => !i.resolved);
  const resolvedIncidents = incidents.filter((i) => i.resolved);

  return (
    <div>
      {/* Back + Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <HealthDot status={client.healthStatus || "healthy"} />
            <div>
              <h1 className="text-lg font-semibold text-text">{client.businessName}</h1>
              <p className="text-xs text-text-muted">{client.niche} &middot; {client.clientId}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ClientStatusBadge status={client.status} />
            <a
              href={client.deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover"
            >
              <Globe size={12} />
              Abrir sitio
            </a>
            <button
              onClick={() => setConfirmAction("suspend")}
              disabled={toggling}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                client.status === "suspended"
                  ? "bg-success-muted text-success hover:bg-success/20"
                  : "bg-warning-muted text-warning hover:bg-warning/20"
              }`}
            >
              {client.status === "suspended" ? (
                <><Shield size={12} /> Activar</>
              ) : (
                <><ShieldOff size={12} /> Suspender</>
              )}
            </button>
            <button
              onClick={() => setConfirmAction("kill")}
              disabled={killing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Power size={12} />
              Kill Switch
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${uptime.last24h >= 99 ? "bg-success-muted" : uptime.last24h >= 95 ? "bg-warning-muted" : "bg-danger-muted"}`}>
              <Shield size={16} className={uptime.last24h >= 99 ? "text-success" : uptime.last24h >= 95 ? "text-warning" : "text-danger"} />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Uptime 24h</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${uptime.last24h >= 99 ? "text-success" : uptime.last24h >= 95 ? "text-warning" : "text-danger"}`}>
            {uptime.last24h}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${uptime.last7d >= 99 ? "bg-success-muted" : uptime.last7d >= 95 ? "bg-warning-muted" : "bg-danger-muted"}`}>
              <Shield size={16} className={uptime.last7d >= 99 ? "text-success" : uptime.last7d >= 95 ? "text-warning" : "text-danger"} />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Uptime 7d</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${uptime.last7d >= 99 ? "text-success" : uptime.last7d >= 95 ? "text-warning" : "text-danger"}`}>
            {uptime.last7d}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeIncidents.length > 0 ? "bg-danger-muted" : "bg-success-muted"}`}>
              <AlertTriangle size={16} className={activeIncidents.length > 0 ? "text-danger" : "text-success"} />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Incidentes</p>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${activeIncidents.length > 0 ? "text-danger" : "text-text"}`}>
            {activeIncidents.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted">
              <MessageSquare size={16} className="text-accent" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Mensajes</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-text">{messages.length}</p>
        </div>
      </div>

      {/* Response Time Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold text-text-muted">Tiempo de respuesta (ms)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#71717a" }} />
              <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
              <Tooltip
                contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Line type="monotone" dataKey="ms" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Incidents */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold text-text-muted">Incidentes</h3>
          {incidents.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">Sin incidentes registrados</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {incidents.map((inc) => (
                <div key={inc.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="mb-1 flex items-center gap-2">
                    {inc.resolved ? (
                      <CheckCircle size={12} className="text-success" />
                    ) : inc.severity === "critical" ? (
                      <AlertTriangle size={12} className="text-danger" />
                    ) : (
                      <Clock size={12} className="text-warning" />
                    )}
                    <span className="text-xs font-medium text-text">{inc.check_type}</span>
                    <span className={`text-[10px] font-semibold ${inc.severity === "critical" ? "text-danger" : "text-warning"}`}>
                      {inc.severity}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-muted">
            <MessageSquare size={12} />
            Mensajes del cliente
          </h3>
          {messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-muted">Sin mensajes</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-lg border border-border bg-bg-elevated p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`text-[10px] font-semibold ${msg.sender === "client" ? "text-accent" : "text-success"}`}>
                      {msg.sender === "client" ? "Cliente" : "Proveedor"}
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Details */}
      <div className="mt-6 rounded-xl border border-border bg-bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold text-text-muted">Datos del cliente</h3>
        <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-text-muted">Deploy URL</dt>
            <dd className="mt-0.5 font-mono text-text">
              <a href={client.deployUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all hover:text-accent">
                {client.deployUrl} <ExternalLink size={10} />
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-text-muted">Admin Email</dt>
            <dd className="mt-0.5 text-text">{client.adminEmail || "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Vercel Project</dt>
            <dd className="mt-0.5 font-mono text-text">{client.vercelProjectId || "—"}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Client ID</dt>
            <dd className="mt-0.5 font-mono text-text">{client.clientId}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Notas</dt>
            <dd className="mt-0.5 text-text">{client.notes || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6">
            {confirmAction === "suspend" ? (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <ShieldOff size={16} className="text-warning" />
                  <h2 className="text-sm font-semibold text-text">
                    {client.status === "suspended" ? "Activar cliente" : "Suspender cliente"}
                  </h2>
                </div>
                <p className="mb-4 text-xs text-text-muted">
                  {client.status === "suspended"
                    ? "Esto marca al cliente como activo en el sistema. No afecta el sitio en Vercel."
                    : "Esto marca al cliente como suspendido en el sistema. El sitio en Vercel sigue funcionando normalmente. Usá el Kill Switch si querés apagar el sitio."}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={toggleStatus}
                    disabled={toggling}
                    className={`rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${
                      client.status === "suspended"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-yellow-600 hover:bg-yellow-700"
                    }`}
                  >
                    {toggling
                      ? "Procesando..."
                      : client.status === "suspended"
                        ? "Sí, activar"
                        : "Sí, suspender"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <Power size={16} className="text-danger" />
                  <h2 className="text-sm font-semibold text-danger">
                    {client.status === "suspended" ? "Reactivar sitio en Vercel" : "Kill Switch"}
                  </h2>
                </div>
                <p className="mb-2 text-xs text-text-muted">
                  {client.status === "suspended"
                    ? "Esto reactiva el proyecto en Vercel. El sitio del cliente volverá a estar online."
                    : "Esto pausa el proyecto en Vercel. El sitio del cliente dejará de funcionar inmediatamente."}
                </p>
                {client.status !== "suspended" && (
                  <p className="mb-4 rounded-lg bg-danger-muted px-3 py-2 text-xs font-medium text-danger">
                    Esta acción apaga el sitio del cliente. Los usuarios no podrán acceder.
                  </p>
                )}
                {!client.vercelProjectId && (
                  <p className="mb-4 rounded-lg bg-warning-muted px-3 py-2 text-xs text-warning">
                    Este cliente no tiene un Vercel Project ID configurado.
                  </p>
                )}
                {killError && (
                  <p className="mb-4 rounded-lg bg-danger-muted px-3 py-2 text-xs text-danger">
                    {killError}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setConfirmAction(null); setKillError(""); }}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => killSwitch(client.status !== "suspended")}
                    disabled={killing || !client.vercelProjectId}
                    className={`rounded-lg px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${
                      client.status === "suspended"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {killing
                      ? "Ejecutando..."
                      : client.status === "suspended"
                        ? "Sí, reactivar en Vercel"
                        : "Sí, apagar sitio"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
