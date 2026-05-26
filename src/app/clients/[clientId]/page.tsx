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
  CreditCard,
  CalendarCheck,
  Users,
  TrendingUp,
  Loader2,
  Upload,
  Rocket,
  RefreshCw,
  Trash2,
  AlertCircle,
  RotateCcw,
  Phone,
} from "lucide-react";
import { HealthDot, ClientStatusBadge } from "@/components/status-badge";
import { LoadingSpinner } from "@/components/loading";
import { StatCard } from "@/components/stat-card";
import { PaymentStatusBadge, PaymentTypeBadge } from "@/components/payment-badges";
import { ClientConfigTab } from "@/components/client-config-tab";
import { ClientContentTab } from "@/components/client-content-tab";
import { WhatsAppConfigTab } from "@/components/whatsapp-config-tab";
import { ClientLeadsTab } from "@/components/client-leads-tab";
import { CrmImportModal } from "@/components/crm-import-modal";
import { ConfigHistoryPanel } from "@/components/config-history-panel";
import { MessagesPanel } from "@/components/messages-panel";
import { PendingReviewBanner } from "@/components/pending-review-banner";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import type { ClientWithHealth, Payment, PaymentStatus } from "@/types";
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

interface ConfigIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

type ClientReview = ClientWithHealth & {
  reviewRequestedAt?: string | null;
  changesRequestedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  lastChangesRequestMessage?: string | null;
  infoSubmitted?: boolean;
  resubmissionCount?: number;
  contactPhone?: string;
  contactWhatsapp?: string;
};

/**
 * Construye un link wa.me a partir de un número crudo. wa.me espera dígitos
 * solamente, sin "+" ni espacios. Devuelve null si no hay nada usable.
 */
function buildWaMeLink(...candidates: Array<string | undefined>): string | null {
  for (const raw of candidates) {
    if (typeof raw !== "string") continue;
    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 7) return `https://wa.me/${digits}`;
  }
  return null;
}

interface ClientDetail {
  client: ClientReview;
  metrics: PgMetric[];
  incidents: PgIncident[];
  uptime: { last24h: number; last7d: number };
  healthSource?: "pg" | "unavailable";
  configIssues?: ConfigIssue[];
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [crmStats, setCrmStats] = useState<{
    totalBookings: number;
    bookingsThisWeek: number;
    totalCustomers: number;
    lastBookingAt: string | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "contenido" | "leads" | "whatsapp">("overview");
  const [showImport, setShowImport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [redeploying, setRedeploying] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    fetch(`/api/payments/${clientId}`)
      .then((r) => r.json())
      .then((data: Payment[]) =>
        setPayments(
          data.map((p) => ({
            ...p,
            billingDate: new Date(p.billingDate),
            nextBillingDate: new Date(p.nextBillingDate),
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        ),
      )
      .catch(() => {});
    fetch(`/api/crm-stats/${clientId}`)
      .then((r) => r.json())
      .then(setCrmStats)
      .catch(() => {});
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

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/clients");
      } else {
        const d = await res.json();
        setDeleteError(d.error || "Error al eliminar");
      }
    } catch {
      setDeleteError("Error de conexion");
    }
    setDeleting(false);
  }

  async function handleRedeploy() {
    if (!data) return;
    setRedeploying(true);
    try {
      const res = await fetch("/api/clients/redeploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubDocId: clientId }),
      });
      if (res.ok) {
        setData((d) => d ? {
          ...d,
          client: { ...d.client, deployStatus: "building", deployError: undefined },
        } : d);
      }
    } catch {
      // silently fail
    }
    setRedeploying(false);
  }

  if (loading) return <LoadingSpinner />;

  if (!data) return null;

  const { client, metrics, incidents, uptime, messages } = data;
  const configIssues = data.configIssues ?? [];
  const healthSource = data.healthSource ?? "pg";
  const blockingConfigIssues = configIssues.filter((i) => i.severity === "error");
  const warningConfigIssues = configIssues.filter((i) => i.severity === "warning");
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/20"
              title={client.deployUrl}
            >
              <Globe size={12} />
              <span>Ver sitio en vivo</span>
              <ExternalLink size={10} className="opacity-60" />
            </a>
            {client.vercelProjectId && (
              <a
                href={`https://vercel.com/dashboard/${client.vercelProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[10px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
                title={`Vercel dashboard · ${client.vercelProjectId}`}
              >
                <span>Vercel</span>
                <ExternalLink size={9} className="opacity-60" />
              </a>
            )}
            <button
              onClick={() => setConfirmAction("suspend")}
              disabled={toggling}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                client.status === "suspended"
                  ? "bg-success-muted text-success hover:bg-success/20"
                  : "bg-warning-muted text-warning hover:bg-warning/20"
              }`}
            >
              {client.status === "suspended" ? (
                <><Shield size={12} /> Activar</>
              ) : (
                <><ShieldOff size={12} /> <span className="hidden sm:inline">Suspender</span></>
              )}
            </button>
            {client.vercelProjectId && (
              <button
                onClick={handleRedeploy}
                disabled={redeploying}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-hover disabled:opacity-50"
              >
                {redeploying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                <span className="hidden sm:inline">Redeploy</span>
              </button>
            )}
            <button
              onClick={() => setConfirmAction("kill")}
              disabled={killing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Power size={12} />
              <span className="hidden sm:inline">Kill Switch</span>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          Config
        </button>
        <button
          onClick={() => setActiveTab("contenido")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "contenido"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          Contenido
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "leads"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          Leads
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "whatsapp"
              ? "border-accent text-accent"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          WhatsApp
        </button>
      </div>

      {/* Deploy status banner */}
      <DeployStatusBanner
        hubDocId={clientId}
        clientId={client.clientId}
        niche={client.niche}
        vercelProjectId={client.vercelProjectId}
        deployStatus={client.deployStatus}
        deployError={client.deployError}
        onDeployUpdate={(updates) => {
          setData((d) => d ? { ...d, client: { ...d.client, ...updates } } : d);
        }}
      />

      {/* Demo activation banner */}
      {client.status === "demo" && (
        <DemoActivationBanner
          hubDocId={clientId}
          vercelProjectId={client.vercelProjectId}
          deployStatus={client.deployStatus}
          onActivated={() => {
            setData((d) => d ? { ...d, client: { ...d.client, status: "active" as const } } : d);
          }}
        />
      )}

      {/* Excessive resubmissions warning — communicación por email no funciona,
          conviene destrabar por WhatsApp. */}
      {(client.resubmissionCount ?? 0) >= 3 && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-4 py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
              <RotateCcw size={14} className="text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text">
                Este cliente ya reenvió {client.resubmissionCount} veces
              </p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                La comunicación por email no está destrabando el ciclo. Llamalo
                por WhatsApp para alinear cara a cara qué falta.
              </p>
            </div>
            {(() => {
              const wa = buildWaMeLink(client.contactWhatsapp, client.contactPhone);
              if (!wa) {
                return (
                  <span className="text-[10px] text-text-muted">
                    Sin teléfono en config
                  </span>
                );
              }
              return (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
                >
                  <Phone size={12} />
                  Abrir WhatsApp
                </a>
              );
            })()}
          </div>
        </div>
      )}

      {/* Pending review banner — cliente completó el wizard y espera aprobación. */}
      {client.status === "pending_review" && (
        <PendingReviewBanner
          hubDocId={clientId}
          client={{
            businessName: client.businessName,
            niche: client.niche,
            clientId: client.clientId,
            deployUrl: client.deployUrl,
            adminEmail: client.adminEmail,
            vercelProjectId: client.vercelProjectId,
            deployStatus: client.deployStatus,
            reviewRequestedAt: client.reviewRequestedAt,
            resubmissionCount: client.resubmissionCount,
          }}
          onApproved={() => {
            setData((d) => d ? {
              ...d,
              client: {
                ...d.client,
                status: "active" as const,
                approvedAt: new Date().toISOString(),
                deployStatus: d.client.vercelProjectId ? d.client.deployStatus : "building",
              },
            } : d);
          }}
          onChangesRequested={() => {
            setData((d) => d ? {
              ...d,
              client: {
                ...d.client,
                status: "changes_requested" as const,
                changesRequestedAt: new Date().toISOString(),
              },
            } : d);
          }}
        />
      )}

      {/* Changes-requested banner — esperando que el cliente edite y vuelva a submitear. */}
      {client.status === "changes_requested" && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <Clock size={13} className="text-amber-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text">Cambios pedidos al cliente</p>
              <p className="mt-0.5 text-[10px] text-text-muted">
                Esperando que actualice la información desde el wizard.
                {client.changesRequestedAt && (
                  <> · {(() => { try { return formatDistanceToNow(new Date(client.changesRequestedAt!), { addSuffix: true, locale: es }); } catch { return ""; } })()}</>
                )}
              </p>
              {client.lastChangesRequestMessage && (
                <p className="mt-1 line-clamp-2 max-w-prose text-[11px] text-text-secondary">
                  “{client.lastChangesRequestMessage}”
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <ClientConfigTab clientId={client.clientId} niche={client.niche} />
      )}

      {activeTab === "contenido" && (
        <ClientContentTab clientId={client.clientId} niche={client.niche} />
      )}

      {activeTab === "leads" && (
        <ClientLeadsTab clientId={clientId} />
      )}

      {activeTab === "whatsapp" && (
        <WhatsAppConfigTab clientId={client.clientId} />
      )}

      {activeTab === "overview" && (<>
      {/* Config Healthcheck Banner */}
      {blockingConfigIssues.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-red-400">
            <AlertTriangle size={14} />
            {blockingConfigIssues.length} {blockingConfigIssues.length === 1 ? "problema" : "problemas"} de configuracion bloquean al cliente
          </div>
          <ul className="space-y-1 pl-1 text-[11px] text-red-300">
            {blockingConfigIssues.slice(0, 5).map((iss, i) => (
              <li key={`${iss.path}-${i}`}>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[10px]">{iss.path || "config"}</code>{" "}
                {iss.message}
              </li>
            ))}
            {blockingConfigIssues.length > 5 && (
              <li className="text-red-400/70">… y {blockingConfigIssues.length - 5} mas</li>
            )}
          </ul>
          <button
            onClick={() => setActiveTab("config")}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-[11px] font-medium text-red-400 hover:bg-red-500/10"
          >
            Ir a Config
          </button>
        </div>
      )}
      {warningConfigIssues.length > 0 && blockingConfigIssues.length === 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle size={14} />
            {warningConfigIssues.length} {warningConfigIssues.length === 1 ? "aviso" : "avisos"} sobre la configuracion
          </div>
          <ul className="space-y-1 pl-1 text-[11px] text-amber-300/80">
            {warningConfigIssues.slice(0, 5).map((iss, i) => (
              <li key={`${iss.path}-${i}`}>
                <code className="rounded bg-black/20 px-1 py-0.5 text-[10px]">{iss.path || "config"}</code>{" "}
                {iss.message}
              </li>
            ))}
            {warningConfigIssues.length > 5 && (
              <li className="text-amber-300/60">… y {warningConfigIssues.length - 5} mas</li>
            )}
          </ul>
        </div>
      )}

      {/* PG Down Notice */}
      {healthSource === "unavailable" && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Metricas de salud no disponibles</p>
            <p className="text-amber-300/70">
              La base de PostgreSQL no responde. Los valores de uptime e incidentes mostrados a continuacion pueden no reflejar la realidad.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Shield} label="Uptime 24h" value={healthSource === "unavailable" ? "—" : `${uptime.last24h}%`} iconBg={healthSource === "unavailable" ? "bg-bg-elevated" : uptime.last24h >= 99 ? "bg-success-muted" : uptime.last24h >= 95 ? "bg-warning-muted" : "bg-danger-muted"} iconColor={healthSource === "unavailable" ? "text-text-muted" : uptime.last24h >= 99 ? "text-success" : uptime.last24h >= 95 ? "text-warning" : "text-danger"} valueColor={healthSource === "unavailable" ? "text-text-muted" : uptime.last24h >= 99 ? "text-success" : uptime.last24h >= 95 ? "text-warning" : "text-danger"} />
        <StatCard icon={Shield} label="Uptime 7d" value={healthSource === "unavailable" ? "—" : `${uptime.last7d}%`} iconBg={healthSource === "unavailable" ? "bg-bg-elevated" : uptime.last7d >= 99 ? "bg-success-muted" : uptime.last7d >= 95 ? "bg-warning-muted" : "bg-danger-muted"} iconColor={healthSource === "unavailable" ? "text-text-muted" : uptime.last7d >= 99 ? "text-success" : uptime.last7d >= 95 ? "text-warning" : "text-danger"} valueColor={healthSource === "unavailable" ? "text-text-muted" : uptime.last7d >= 99 ? "text-success" : uptime.last7d >= 95 ? "text-warning" : "text-danger"} />
        <StatCard icon={AlertTriangle} label="Incidentes" value={activeIncidents.length} iconBg={activeIncidents.length > 0 ? "bg-danger-muted" : "bg-success-muted"} iconColor={activeIncidents.length > 0 ? "text-danger" : "text-success"} valueColor={activeIncidents.length > 0 ? "text-danger" : "text-text"} />
        <StatCard icon={MessageSquare} label="Mensajes" value={messages.length} iconBg="bg-accent-muted" iconColor="text-accent" />
      </div>

      {/* CRM Stats */}
      {crmStats && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={CalendarCheck} label="Bookings total" value={crmStats.totalBookings} iconBg="bg-accent-muted" iconColor="text-accent" />
          <StatCard icon={TrendingUp} label="Bookings 7d" value={crmStats.bookingsThisWeek} iconBg={crmStats.bookingsThisWeek > 0 ? "bg-success-muted" : "bg-warning-muted"} iconColor={crmStats.bookingsThisWeek > 0 ? "text-success" : "text-warning"} valueColor={crmStats.bookingsThisWeek > 0 ? "text-success" : "text-warning"} />
          <StatCard icon={Users} label="Customers" value={crmStats.totalCustomers} iconBg="bg-accent-muted" iconColor="text-accent" />
          <StatCard
            icon={CalendarCheck}
            label="Último booking"
            value={crmStats.lastBookingAt ? formatDistanceToNow(new Date(crmStats.lastBookingAt), { addSuffix: true, locale: es }) : "—"}
            iconBg="bg-bg-elevated"
            iconColor="text-text-muted"
          />
        </div>
      )}

      {/* CRM Import Button */}
      {crmStats && (
        <div className="mb-6">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
          >
            <Upload size={14} />
            Importar datos al CRM
          </button>
        </div>
      )}

      {/* CRM Import Modal */}
      {showImport && (
        <CrmImportModal clientId={clientId} onClose={() => setShowImport(false)} />
      )}

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
                <div key={inc.id} className="rounded-lg border border-border bg-bg-elevated p-4">
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

        {/* Messages thread + reply */}
        <MessagesPanel
          clientId={client.clientId}
          businessName={client.businessName}
          messages={messages.map((m) => ({
            id: m.id,
            message: m.message,
            createdAt: typeof m.createdAt === "string"
              ? m.createdAt
              : new Date(m.createdAt as unknown as string | number | Date).toISOString(),
            sender: m.sender,
            status: m.status,
          }))}
        />
      </div>

      {/* Config history (audit log) */}
      <div className="mt-6">
        <ConfigHistoryPanel clientId={client.clientId} />
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

      {/* Payments */}
      <div className="mt-6 rounded-xl border border-border bg-bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <CreditCard size={12} />
            Pagos
          </h3>
          <Link
            href={`/payments`}
            className="text-[10px] font-medium text-accent hover:underline"
          >
            Ver todos
          </Link>
        </div>
        {payments.length === 0 ? (
          <p className="py-4 text-center text-xs text-text-muted">Sin registros de pago</p>
        ) : (
          <>
            {(() => {
              const initial = payments.find((p) => p.type === "initial");
              const paidRecurring = payments.filter((p) => p.type === "recurring" && p.status === "paid").length;
              return (
                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-text-muted">Setup:</span>
                    {initial ? <PaymentStatusBadge status={initial.status} /> : <span className="text-[11px] text-text-muted">Sin registro</span>}
                  </span>
                  <span className="text-text-secondary">
                    {paidRecurring} mensualidad{paidRecurring !== 1 ? "es" : ""} pagada{paidRecurring !== 1 ? "s" : ""}
                  </span>
                  <span className="text-text-muted">
                    Próximo cobro: {format(payments[0].nextBillingDate, "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              );
            })()}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 5).map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 text-text-muted">
                        {format(p.billingDate, "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-3 py-2 font-medium tabular-nums text-text">
                        ₪{p.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        <PaymentTypeBadge type={p.type} />
                      </td>
                      <td className="px-3 py-2">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      </>)}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-1 flex items-center gap-2">
              <Trash2 size={16} className="text-danger" />
              <h2 className="text-sm font-semibold text-danger">Eliminar cliente</h2>
            </div>
            <p className="mb-2 text-xs text-text-muted">
              Esto eliminara permanentemente al cliente de Firebase{client.vercelProjectId ? " y su proyecto en Vercel" : ""}.
              Esta accion no se puede deshacer.
            </p>
            <p className="mb-3 text-xs text-text-muted">
              Escribi <code className="rounded bg-bg-elevated px-1 py-0.5 text-red-400">eliminar</code> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="eliminar"
              className="mb-3 w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-red-500 focus:outline-none"
            />
            {deleteError && (
              <p className="mb-3 rounded-lg bg-danger-muted px-3 py-2 text-xs text-danger">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setConfirmDelete(false); setDeleteConfirmText(""); setDeleteError(""); }}
                className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== "eliminar"}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}

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

function DeployStatusBanner({
  hubDocId,
  clientId,
  niche,
  vercelProjectId,
  deployStatus,
  deployError,
  onDeployUpdate,
}: {
  hubDocId: string;
  clientId: string;
  niche: string;
  vercelProjectId?: string;
  deployStatus?: string;
  deployError?: string;
  onDeployUpdate: (updates: Partial<{ vercelProjectId: string; deployStatus: string; deployError: string | undefined }>) => void;
}) {
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState("");

  // Poll deploy status when building
  useEffect(() => {
    if (deployStatus !== "building" || !clientId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/onboarding/status/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status !== "building") {
            onDeployUpdate({ deployStatus: data.status, deployError: undefined });
          }
        }
      } catch { /* ignore */ }
    }, 8000);
    return () => clearInterval(interval);
  }, [deployStatus, clientId, onDeployUpdate]);

  if (deployStatus === "ready" && vercelProjectId) return null;

  async function handleDeploy() {
    setDeploying(true);
    setError("");
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, niche, hubDocId }),
      });
      const data = await res.json();
      if (res.ok) {
        onDeployUpdate({
          vercelProjectId: data.projectId,
          deployStatus: "building",
          deployError: undefined,
        });
      } else {
        setError(data.error || "Error al deployar");
      }
    } catch {
      setError("Error de conexion");
    }
    setDeploying(false);
  }

  if (deployStatus === "building") {
    return (
      <div className="mb-6 flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Loader2 size={16} className="animate-spin text-accent" />
          <div>
            <p className="text-xs font-medium text-text">Deploy en progreso</p>
            <p className="text-[10px] text-text-muted">Vercel esta construyendo el proyecto. Se actualiza automaticamente.</p>
          </div>
        </div>
      </div>
    );
  }

  if (deployStatus === "error" || (!vercelProjectId && deployStatus !== "building")) {
    return (
      <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-red-400" />
            <div>
              <p className="text-xs font-medium text-red-400">
                {!vercelProjectId ? "Sin deploy" : "Error en deploy"}
              </p>
              {deployError && (
                <p className="mt-0.5 text-[10px] text-red-400/70">{deployError}</p>
              )}
              {error && (
                <p className="mt-0.5 text-[10px] text-red-400/70">{error}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {deploying ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
            {!vercelProjectId ? "Deployar" : "Reintentar deploy"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function DemoActivationBanner({
  hubDocId,
  vercelProjectId,
  deployStatus,
  onActivated,
}: {
  hubDocId: string;
  vercelProjectId?: string;
  deployStatus?: string;
  onActivated: (status: "active") => void;
}) {
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");

  const canActivate = !!vercelProjectId && deployStatus !== "building" && deployStatus !== "error";

  async function handleActivate() {
    setActivating(true);
    setError("");
    try {
      const res = await fetch("/api/clients/provision", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubDocId, status: "active" }),
      });
      if (res.ok) {
        onActivated("active");
      } else {
        const data = await res.json();
        setError(data.error || "Error al activar");
      }
    } catch {
      setError("Error de conexion");
    }
    setActivating(false);
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
          <Clock size={14} className="text-yellow-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-text">Este cliente esta en modo demo</p>
          <p className="text-[10px] text-text-muted">
            {canActivate
              ? "Activalo cuando la configuracion y el contenido esten listos para produccion."
              : !vercelProjectId
                ? "Necesitas deployar el proyecto primero."
                : deployStatus === "building"
                  ? "Esperando que termine el deploy..."
                  : "Necesitas un deploy exitoso antes de activar."}
          </p>
          {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleActivate}
        disabled={activating || !canActivate}
        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {activating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Activar cliente
      </button>
    </div>
  );
}
