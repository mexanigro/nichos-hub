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
} from "lucide-react";
import { LoadingSpinner } from "@/components/loading";
import { StatCard } from "@/components/stat-card";
import type { ApiServiceCost, ApiServiceId } from "@/types";
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

const CATEGORY_COLORS: Record<string, string> = {
  ia: "bg-purple-500/20 text-purple-400",
  whatsapp: "bg-green-500/20 text-green-400",
  hosting: "bg-blue-500/20 text-blue-400",
  email: "bg-cyan-500/20 text-cyan-400",
  payments: "bg-orange-500/20 text-orange-400",
  database: "bg-yellow-500/20 text-yellow-400",
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
  return n === 0 ? "$0" : `$${n.toFixed(2)}`;
}

function formatIls(n: number) {
  return n === 0 ? "₪0" : `₪${n.toFixed(0)}`;
}

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

  // API keys state
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

  // Auto-fetch state
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
      // Only send non-empty fields
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
            : `${ok} servicios actualizados`
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

  // Count configured
  const configuredCount = Object.values(configuredKeys).filter(Boolean).length;

  // Stats
  const totalUsd = services.reduce((s, svc) => s + svc.monthlyCostUsd, 0);
  const totalIls = services.reduce((s, svc) => s + svc.monthlyCostIls, 0);
  const overBudget = services.filter(
    (s) => s.monthlyBudgetUsd > 0 && s.monthlyCostUsd > s.monthlyBudgetUsd,
  ).length;

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
            Costos mensuales de servicios del ecosistema
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

      {/* Fetch result message */}
      {fetchMsg && (
        <div className="mb-4 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-xs text-text-secondary">
          {fetchMsg}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Zap}
          label="Total USD/mes"
          value={formatUsd(totalUsd)}
          iconBg="bg-accent-muted"
          iconColor="text-accent"
        />
        <StatCard
          icon={Zap}
          label="Total ILS/mes"
          value={formatIls(totalIls)}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sobre budget"
          value={String(overBudget)}
          iconBg={overBudget > 0 ? "bg-danger-muted" : "bg-green-500/20"}
          iconColor={overBudget > 0 ? "text-danger" : "text-green-400"}
        />
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
              Ingresa las API keys de cada servicio para habilitar la consulta automatica de costos.
              Las keys se guardan encriptadas y nunca se exponen.
            </p>
            <div className="space-y-3">
              {/* Vercel — from env */}
              <KeyRow
                label="Vercel"
                icon={Triangle}
                configured={configuredKeys.vercel}
                envBased
              />

              {/* Anthropic */}
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

              {/* Twilio */}
              <div className="rounded-lg border border-border bg-bg-elevated p-3">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle size={14} className="text-green-400" />
                  <span className="text-xs font-semibold text-text">
                    Twilio
                  </span>
                  {configuredKeys.twilio ? (
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">
                      CONFIGURADO
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-[9px] font-bold text-text-muted">
                      SIN CONFIGURAR
                    </span>
                  )}
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

              {/* Railway */}
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

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((svc) => {
          const Icon = SERVICE_ICONS[svc.serviceId] || Zap;
          const isEditing = editingId === svc.serviceId;
          const isOverBudget =
            svc.monthlyBudgetUsd > 0 && svc.monthlyCostUsd > svc.monthlyBudgetUsd;
          const isAutoFetchable = svc.autoFetchable === true;
          const isConfigured =
            configuredKeys[svc.serviceId as keyof ConfiguredKeys] === true;

          return (
            <div
              key={svc.serviceId}
              className={`rounded-xl border bg-bg-card p-5 transition-colors ${
                isOverBudget
                  ? "border-red-500/40"
                  : "border-border"
              }`}
            >
              {/* Card header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      CATEGORY_COLORS[svc.category] || "bg-zinc-500/20 text-zinc-400"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text">
                        {svc.name}
                      </p>
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
                    </div>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        CATEGORY_COLORS[svc.category] || "bg-zinc-500/20 text-zinc-400"
                      }`}
                    >
                      {CATEGORY_LABELS[svc.category] || svc.category}
                    </span>
                  </div>
                </div>
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

              {isEditing ? (
                <EditForm
                  svc={svc}
                  rate={rate}
                  saving={saving}
                  onSave={(data) => handleSave(svc.serviceId, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <ViewMode
                  svc={svc}
                  isOverBudget={isOverBudget}
                  onEdit={() => setEditingId(svc.serviceId)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: tasa de cambio */}
      <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-border bg-bg-card px-5 py-3">
        <span className="text-xs text-text-muted">Tasa USD/ILS:</span>
        <input
          type="number"
          step="0.1"
          min="1"
          value={rate}
          onChange={(e) => handleRateChange(parseFloat(e.target.value) || DEFAULT_RATE)}
          className="w-20 rounded-lg border border-border bg-bg-elevated px-2 py-1 text-center text-xs font-mono text-text focus:border-accent focus:outline-none"
        />
        <span className="text-[11px] text-text-muted">
          (referencia para conversion manual)
        </span>
      </div>
    </div>
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
          {configured ? (
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[9px] font-bold text-green-400">
              CONFIGURADO
            </span>
          ) : (
            <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-[9px] font-bold text-text-muted">
              SIN CONFIGURAR
            </span>
          )}
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

/* ─── View Mode ─── */

function ViewMode({
  svc,
  isOverBudget,
  onEdit,
}: {
  svc: ApiServiceCost;
  isOverBudget: boolean;
  onEdit: () => void;
}) {
  const hasData = svc.monthlyCostUsd > 0 || svc.monthlyCostIls > 0;

  return (
    <>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-text-muted">Costo USD</p>
          <p className="text-lg font-bold tabular-nums text-text">
            {formatUsd(svc.monthlyCostUsd)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Costo ILS</p>
          <p className="text-lg font-bold tabular-nums text-text">
            {formatIls(svc.monthlyCostIls)}
          </p>
        </div>
      </div>

      {svc.usageMetric && (
        <p className="mb-1 text-xs text-text-secondary">
          <span className="font-medium">Uso:</span> {svc.usageMetric}
          {svc.usagePeriod && ` (${svc.usagePeriod})`}
        </p>
      )}

      {svc.monthlyBudgetUsd > 0 && (
        <p
          className={`mb-1 text-xs ${
            isOverBudget ? "font-semibold text-red-400" : "text-text-muted"
          }`}
        >
          Budget: {formatUsd(svc.monthlyBudgetUsd)}/mes
          {isOverBudget && " — excedido!"}
        </p>
      )}

      {svc.notes && (
        <p className="mb-2 text-xs text-text-muted">{svc.notes}</p>
      )}

      {(svc.lastUpdated || svc.lastAutoFetch) && (
        <p className="mb-3 text-[10px] text-text-muted">
          {svc.lastAutoFetch
            ? `Auto-fetch: ${new Date(svc.lastAutoFetch).toLocaleDateString("es")}`
            : `Actualizado: ${new Date(svc.lastUpdated).toLocaleDateString("es")}`}
        </p>
      )}

      <button
        onClick={onEdit}
        className="w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
      >
        {hasData ? "Editar" : "Cargar datos"}
      </button>
    </>
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
            placeholder="Ej: Mayo 2026"
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
