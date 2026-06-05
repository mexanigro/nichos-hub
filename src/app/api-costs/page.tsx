"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Brain,
  MessageCircle,
  Database,
  Triangle,
  Train,
  Mail,
  CreditCard,
  ExternalLink,
  Check,
  AlertTriangle,
  Zap,
  RefreshCw,
  Key,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Bot,
  Pencil,
  Loader2,
  TrendingUp,
  DollarSign,
  Settings2,
  CircleAlert,
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading";
import type { ApiServiceCost, ApiServiceId, UsageDetail } from "@/types";
import type { LucideIcon } from "lucide-react";

const SERVICE_ICONS: Record<ApiServiceId, LucideIcon> = {
  anthropic: Brain,
  twilio: MessageCircle,
  firebase: Database,
  vercel: Triangle,
  railway: Train,
  resend: Mail,
  cardcom: CreditCard,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  ia: { bg: "bg-purple-500/15", text: "text-purple-400", bar: "bg-purple-500" },
  whatsapp: { bg: "bg-green-500/15", text: "text-green-400", bar: "bg-green-500" },
  hosting: { bg: "bg-blue-500/15", text: "text-blue-400", bar: "bg-blue-500" },
  email: { bg: "bg-cyan-500/15", text: "text-cyan-400", bar: "bg-cyan-500" },
  payments: { bg: "bg-orange-500/15", text: "text-orange-400", bar: "bg-orange-500" },
  database: { bg: "bg-yellow-500/15", text: "text-yellow-400", bar: "bg-yellow-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  ia: "IA",
  whatsapp: "WhatsApp",
  hosting: "Hosting",
  email: "Email",
  payments: "Pagos",
  database: "Base de datos",
};

const DEFAULT_RATE = 3.6;

function formatUsd(n: number) {
  return n === 0 ? "$0.00" : `$${n.toFixed(2)}`;
}

function formatIls(n: number) {
  return n === 0 ? "₪0" : `₪${n.toFixed(0)}`;
}

function budgetHealth(cost: number, budget: number): "ok" | "warn" | "danger" | "none" {
  if (budget <= 0) return "none";
  const pct = cost / budget;
  if (pct >= 1) return "danger";
  if (pct >= 0.8) return "warn";
  return "ok";
}

const HEALTH_STYLES = {
  ok: "text-green-400",
  warn: "text-yellow-400",
  danger: "text-red-400",
  none: "text-text",
} as const;

interface ConfiguredKeys {
  anthropic: boolean;
  twilio: boolean;
  railway: boolean;
  vercel: boolean;
}

export default function ApiCostsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [services, setServices] = useState<ApiServiceCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<ApiServiceId | null>(null);
  const [saving, setSaving] = useState(false);
  const [rate, setRate] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("api-costs-rate");
      return saved ? parseFloat(saved) : DEFAULT_RATE;
    }
    return DEFAULT_RATE;
  });

  const [showKeysSection, setShowKeysSection] = useState(false);
  const [configuredKeys, setConfiguredKeys] = useState<ConfiguredKeys>({
    anthropic: false,
    twilio: false,
    railway: false,
    vercel: false,
  });
  const [keyInputs, setKeyInputs] = useState({
    anthropic_admin_key: "",
    twilio_account_sid: "",
    twilio_auth_token: "",
    railway_token: "",
  });
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysMsg, setKeysMsg] = useState("");

  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/api-costs");
    if (res.ok) {
      setServices(await res.json());
    }
    setLoading(false);
  }, []);

  const fetchKeysStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setConfiguredKeys(data.configured);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchServices();
    fetchKeysStatus();
  }, [session, router, fetchServices, fetchKeysStatus]);

  async function handleSave(serviceId: ApiServiceId, data: Partial<ApiServiceCost>) {
    setSaving(true);
    const res = await fetch(`/api/api-costs/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchServices();
      setEditingId(null);
    }
    setSaving(false);
  }

  function handleRateChange(newRate: number) {
    setRate(newRate);
    localStorage.setItem("api-costs-rate", String(newRate));
  }

  async function handleSaveKeys() {
    setSavingKeys(true);
    setKeysMsg("");
    try {
      const payload: Record<string, string> = {};
      for (const [k, v] of Object.entries(keyInputs)) {
        if (v.trim()) payload[k] = v.trim();
      }
      if (Object.keys(payload).length === 0) {
        setKeysMsg("No hay cambios");
        setSavingKeys(false);
        return;
      }
      const res = await fetch("/api/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setKeysMsg("Keys guardadas");
        setKeyInputs({
          anthropic_admin_key: "",
          twilio_account_sid: "",
          twilio_auth_token: "",
          railway_token: "",
        });
        await fetchKeysStatus();
      } else {
        setKeysMsg("Error al guardar");
      }
    } catch {
      setKeysMsg("Error de red");
    } finally {
      setSavingKeys(false);
    }
  }

  async function handleAutoFetch() {
    setFetching(true);
    setFetchMsg("");
    try {
      const res = await fetch("/api/api-costs/fetch", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const ok = data.results?.filter((r: { success: boolean }) => r.success).length ?? 0;
        const fail = data.results?.filter((r: { success: boolean }) => !r.success).length ?? 0;
        setFetchMsg(
          fail > 0
            ? `${ok} actualizados, ${fail} con error`
            : `${ok} servicios actualizados`,
        );
        await fetchServices();
      } else {
        setFetchMsg("Error al consultar APIs");
      }
    } catch {
      setFetchMsg("Error de red");
    } finally {
      setFetching(false);
    }
  }

  const configuredCount = Object.values(configuredKeys).filter(Boolean).length;

  const totalUsd = services.reduce((s, svc) => s + svc.monthlyCostUsd, 0);
  const totalIls = totalUsd * rate;
  const overBudget = services.filter(
    (s) => s.monthlyBudgetUsd > 0 && s.monthlyCostUsd > s.monthlyBudgetUsd,
  ).length;
  const autoCount = services.filter((s) => s.autoFetchable).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">
            Costos APIs
          </h1>
          <p className="text-xs text-text-muted">
            Costos mensuales de servicios — {services.length} servicios monitoreados
          </p>
        </div>
        <button
          onClick={handleAutoFetch}
          disabled={fetching || configuredCount === 0}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {fetching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {fetching ? "Consultando..." : "Actualizar costos"}
        </button>
      </div>

      {fetchMsg && (
        <div className="mb-4 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-xs text-text-secondary">
          {fetchMsg}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={DollarSign}
          label="Total USD/mes"
          value={formatUsd(totalUsd)}
          iconBg="bg-accent-muted"
          iconColor="text-accent"
          valueColor={totalUsd > 100 ? "text-yellow-400" : "text-text"}
        />
        <SummaryCard
          icon={TrendingUp}
          label="Total ILS/mes"
          value={formatIls(totalIls)}
          iconBg="bg-blue-500/15"
          iconColor="text-blue-400"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Sobre budget"
          value={String(overBudget)}
          iconBg={overBudget > 0 ? "bg-red-500/15" : "bg-green-500/15"}
          iconColor={overBudget > 0 ? "text-red-400" : "text-green-400"}
          valueColor={overBudget > 0 ? "text-red-400" : "text-green-400"}
        />
        <SummaryCard
          icon={Settings2}
          label="Auto-fetch"
          value={`${configuredCount}/${autoCount}`}
          iconBg="bg-purple-500/15"
          iconColor="text-purple-400"
        />
      </div>

      {/* Per-category cost breakdown mini bar */}
      <CostBreakdownBar services={services} />

      {/* Service Cards Grid */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {services.map((svc) => {
          const isEditing = editingId === svc.serviceId;
          return (
            <ServiceCard
              key={svc.serviceId}
              svc={svc}
              isEditing={isEditing}
              saving={saving}
              rate={rate}
              configuredKeys={configuredKeys}
              onEdit={() => setEditingId(svc.serviceId)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(data) => handleSave(svc.serviceId, data)}
            />
          );
        })}
      </div>

      {/* API Keys Section */}
      <div className="mb-6 rounded-xl border border-border bg-bg-card">
        <button
          onClick={() => setShowKeysSection(!showKeysSection)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-bg-hover"
        >
          <div className="flex items-center gap-2.5">
            <Key size={15} className="text-accent" />
            <span className="text-sm font-semibold text-text">
              Configurar API Keys
            </span>
            <span className="rounded-md bg-bg-elevated px-2 py-0.5 text-[10px] font-semibold text-text-muted">
              {configuredCount}/4 configurados
            </span>
          </div>
          {showKeysSection ? (
            <ChevronDown size={16} className="text-text-muted" />
          ) : (
            <ChevronRight size={16} className="text-text-muted" />
          )}
        </button>

        {showKeysSection && (
          <div className="border-t border-border px-5 py-4">
            <p className="mb-4 text-[11px] text-text-muted">
              Ingresa las API keys de cada servicio para habilitar la consulta
              automatica de costos. Las keys se guardan encriptadas.
            </p>
            <div className="space-y-3">
              <KeyRow
                label="Vercel"
                icon={Triangle}
                configured={configuredKeys.vercel}
                envBased
              />
              <KeyRow
                label="Anthropic (Admin Key)"
                icon={Brain}
                configured={configuredKeys.anthropic}
                value={keyInputs.anthropic_admin_key}
                onChange={(v) =>
                  setKeyInputs((p) => ({ ...p, anthropic_admin_key: v }))
                }
                placeholder="sk-ant-admin-..."
              />
              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle size={14} className="text-green-400" />
                  <span className="text-xs font-semibold text-text">Twilio</span>
                  <ConfigBadge configured={configuredKeys.twilio} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SecretInput
                    placeholder="Account SID"
                    value={keyInputs.twilio_account_sid}
                    onChange={(v) =>
                      setKeyInputs((p) => ({ ...p, twilio_account_sid: v }))
                    }
                  />
                  <SecretInput
                    placeholder="Auth Token"
                    value={keyInputs.twilio_auth_token}
                    onChange={(v) =>
                      setKeyInputs((p) => ({ ...p, twilio_auth_token: v }))
                    }
                  />
                </div>
              </div>
              <KeyRow
                label="Railway"
                icon={Train}
                configured={configuredKeys.railway}
                value={keyInputs.railway_token}
                onChange={(v) =>
                  setKeyInputs((p) => ({ ...p, railway_token: v }))
                }
                placeholder="railway-token-..."
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSaveKeys}
                disabled={savingKeys}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {savingKeys ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                {savingKeys ? "Guardando..." : "Guardar keys"}
              </button>
              {keysMsg && (
                <span className="text-xs text-text-muted">{keysMsg}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer: exchange rate */}
      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-bg-card px-5 py-3">
        <span className="text-xs text-text-muted">Tasa USD → ILS:</span>
        <input
          type="number"
          step="0.1"
          min="1"
          value={rate}
          onChange={(e) =>
            handleRateChange(parseFloat(e.target.value) || DEFAULT_RATE)
          }
          className="w-20 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-center text-xs font-mono text-text focus:border-accent focus:outline-none"
        />
        <span className="text-[11px] text-text-muted">
          (Total ILS se calcula como total USD × tasa)
        </span>
      </div>
    </div>
  );
}

/* ─── Summary Card ─── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  valueColor = "text-text",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon size={14} className={iconColor} />
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          {label}
        </p>
      </div>
      <p className={`text-xl font-bold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

/* ─── Cost Breakdown Bar ─── */

function CostBreakdownBar({ services }: { services: ApiServiceCost[] }) {
  const total = services.reduce((s, svc) => s + svc.monthlyCostUsd, 0);
  if (total === 0) return null;

  const byCategory = new Map<string, number>();
  for (const svc of services) {
    const prev = byCategory.get(svc.category) ?? 0;
    byCategory.set(svc.category, prev + svc.monthlyCostUsd);
  }

  const segments = [...byCategory.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-text-muted">
          Distribución de costos
        </p>
        <p className="text-[11px] font-semibold text-text">
          {formatUsd(total)} total
        </p>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-elevated">
        {segments.map(([cat, cost]) => {
          const pct = (cost / total) * 100;
          const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.hosting;
          return (
            <div
              key={cat}
              className={`${colors.bar} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${CATEGORY_LABELS[cat] ?? cat}: ${formatUsd(cost)} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {segments.map(([cat, cost]) => {
          const colors = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.hosting;
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${colors.bar}`} />
              <span className="text-[10px] text-text-muted">
                {CATEGORY_LABELS[cat] ?? cat}: {formatUsd(cost)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Service Card ─── */

function ServiceCard({
  svc,
  isEditing,
  saving,
  rate,
  configuredKeys,
  onEdit,
  onCancelEdit,
  onSave,
}: {
  svc: ApiServiceCost;
  isEditing: boolean;
  saving: boolean;
  rate: number;
  configuredKeys: ConfiguredKeys;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (data: Partial<ApiServiceCost>) => void;
}) {
  const Icon = SERVICE_ICONS[svc.serviceId] || Zap;
  const colors = CATEGORY_COLORS[svc.category] ?? CATEGORY_COLORS.hosting;
  const health = budgetHealth(svc.monthlyCostUsd, svc.monthlyBudgetUsd);
  const isAutoFetchable = svc.autoFetchable === true;
  const isConfigured =
    configuredKeys[svc.serviceId as keyof ConfiguredKeys] === true;
  const hasData = svc.monthlyCostUsd > 0 || (svc.details && svc.details.length > 0);

  return (
    <div
      className={`rounded-xl border bg-bg-card transition-colors ${
        health === "danger"
          ? "border-red-500/40"
          : health === "warn"
            ? "border-yellow-500/30"
            : "border-border"
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors.bg}`}
          >
            <Icon size={18} className={colors.text} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text">{svc.name}</p>
              {isAutoFetchable && isConfigured && (
                <span className="flex items-center gap-0.5 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                  <Bot size={9} />
                  AUTO
                </span>
              )}
              {isAutoFetchable && !isConfigured && (
                <span className="flex items-center gap-0.5 rounded-full bg-zinc-500/15 px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
                  <Pencil size={9} />
                  MANUAL
                </span>
              )}
              {!isAutoFetchable && (
                <span className="flex items-center gap-0.5 rounded-full bg-zinc-500/15 px-1.5 py-0.5 text-[9px] font-bold text-text-muted">
                  MANUAL
                </span>
              )}
            </div>
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${colors.bg} ${colors.text}`}
            >
              {CATEGORY_LABELS[svc.category] || svc.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={svc.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
            title="Abrir consola"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4">
        {isEditing ? (
          <EditForm
            svc={svc}
            rate={rate}
            saving={saving}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            {/* Cost display */}
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                  Costo mensual
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${HEALTH_STYLES[health]}`}
                >
                  {formatUsd(svc.monthlyCostUsd)}
                </p>
                {svc.monthlyCostIls > 0 && (
                  <p className="text-xs tabular-nums text-text-muted">
                    {formatIls(svc.monthlyCostIls)}
                  </p>
                )}
              </div>
              {svc.usagePeriod && (
                <span className="rounded-md bg-bg-elevated px-2 py-0.5 text-[10px] font-medium text-text-muted">
                  {svc.usagePeriod}
                </span>
              )}
            </div>

            {/* Budget progress bar */}
            {svc.monthlyBudgetUsd > 0 && (
              <BudgetBar
                cost={svc.monthlyCostUsd}
                budget={svc.monthlyBudgetUsd}
              />
            )}

            {/* Usage summary line */}
            {svc.usageMetric && (
              <p className="mb-3 text-xs text-text-secondary">
                {svc.usageMetric}
              </p>
            )}

            {/* Auto-fetch error */}
            {svc.autoFetchError && (
              <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-[11px] text-red-400">
                <CircleAlert size={12} />
                {svc.autoFetchError}
              </div>
            )}

            {/* Details breakdown */}
            {svc.details && svc.details.length > 0 && (
              <DetailsBreakdown details={svc.details} />
            )}

            {/* Notes */}
            {svc.notes && (
              <p className="mb-3 rounded-lg bg-bg-elevated px-3 py-2 text-[11px] text-text-muted">
                {svc.notes}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[10px] text-text-muted">
                {svc.lastAutoFetch
                  ? `Auto: ${new Date(svc.lastAutoFetch).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : svc.lastUpdated
                    ? `Manual: ${new Date(svc.lastUpdated).toLocaleDateString("es", { day: "numeric", month: "short" })}`
                    : "Sin datos"}
              </div>
              <button
                onClick={onEdit}
                className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
              >
                {hasData ? "Editar" : "Cargar datos"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Budget Bar ─── */

function BudgetBar({ cost, budget }: { cost: number; budget: number }) {
  const pct = Math.min((cost / budget) * 100, 100);
  const health = budgetHealth(cost, budget);

  const barColor =
    health === "danger"
      ? "bg-red-500"
      : health === "warn"
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[10px]">
        <span className="text-text-muted">
          Budget: {formatUsd(budget)}/mes
        </span>
        <span
          className={
            health === "danger"
              ? "font-semibold text-red-400"
              : health === "warn"
                ? "font-semibold text-yellow-400"
                : "text-green-400"
          }
        >
          {pct.toFixed(0)}%
          {health === "danger" && " — excedido!"}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Details Breakdown ─── */

function DetailsBreakdown({ details }: { details: UsageDetail[] }) {
  return (
    <div className="mb-3 rounded-lg border border-border bg-bg-elevated">
      {details.map((d, i) => (
        <div
          key={i}
          className={`flex items-center justify-between px-3 py-2 ${
            i < details.length - 1 ? "border-b border-border/50" : ""
          }`}
        >
          <span className="text-[11px] text-text-muted">{d.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-text">{d.value}</span>
            {d.costUsd !== undefined && d.costUsd > 0 && (
              <span className="rounded bg-bg-card px-1.5 py-0.5 text-[10px] tabular-nums text-text-muted">
                {formatUsd(d.costUsd)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Config Badge ─── */

function ConfigBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">
      CONFIGURADO
    </span>
  ) : (
    <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-[9px] font-bold text-text-muted">
      SIN CONFIGURAR
    </span>
  );
}

/* ─── Key Row ─── */

function KeyRow({
  label,
  icon: Icon,
  configured,
  envBased,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: LucideIcon;
  configured: boolean;
  envBased?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-text-muted" />
          <span className="text-xs font-semibold text-text">{label}</span>
          <ConfigBadge configured={configured} />
        </div>
      </div>
      {envBased ? (
        <p className="mt-1.5 text-[10px] text-text-muted">
          Configurado via variable de entorno (VERCEL_TOKEN)
        </p>
      ) : (
        <div className="mt-2">
          <SecretInput
            placeholder={placeholder || ""}
            value={value || ""}
            onChange={onChange || (() => {})}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Secret Input ─── */

function SecretInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg-input px-3 py-1.5 pr-8 font-mono text-xs text-text focus:border-accent focus:outline-none"
        autoComplete="off"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
      >
        {visible ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
}

/* ─── Edit Form ─── */

function EditForm({
  svc,
  rate,
  saving,
  onSave,
  onCancel,
}: {
  svc: ApiServiceCost;
  rate: number;
  saving: boolean;
  onSave: (data: Partial<ApiServiceCost>) => void;
  onCancel: () => void;
}) {
  const [costUsd, setCostUsd] = useState(String(svc.monthlyCostUsd || ""));
  const [costIls, setCostIls] = useState(String(svc.monthlyCostIls || ""));
  const [metric, setMetric] = useState(svc.usageMetric);
  const [period, setPeriod] = useState(svc.usagePeriod);
  const [notes, setNotes] = useState(svc.notes);
  const [budget, setBudget] = useState(String(svc.monthlyBudgetUsd || ""));

  function handleUsdChange(val: string) {
    setCostUsd(val);
    const num = parseFloat(val);
    if (!isNaN(num) && rate > 0) {
      setCostIls(String(Math.round(num * rate)));
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
            USD/mes
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={costUsd}
            onChange={(e) => handleUsdChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
            ILS/mes
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={costIls}
            onChange={(e) => setCostIls(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
            placeholder="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
            Uso
          </label>
          <input
            type="text"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
            placeholder="Ej: 2.3M tokens"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
            Periodo
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
            placeholder="Ej: Junio 2026"
          />
        </div>
      </div>

      <div>
        <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
          Budget USD/mes (0 = sin limite)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs font-mono text-text focus:border-accent focus:outline-none"
          placeholder="0"
        />
      </div>

      <div>
        <label className="mb-0.5 block text-[10px] font-medium text-text-muted">
          Notas
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
          placeholder="Opcional"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onSave({
              monthlyCostUsd: parseFloat(costUsd) || 0,
              monthlyCostIls: parseFloat(costIls) || 0,
              usageMetric: metric,
              usagePeriod: period,
              notes,
              monthlyBudgetUsd: parseFloat(budget) || 0,
            })
          }
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? (
            "Guardando..."
          ) : (
            <>
              <Check size={13} />
              Guardar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
