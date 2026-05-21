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

  const fetchServices = useCallback(async () => {
    const res = await fetch("/api/api-costs");
    if (res.ok) {
      setServices(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchServices();
  }, [session, router, fetchServices]);

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
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text">
          Costos APIs
        </h1>
        <p className="text-xs text-text-muted">
          Costos mensuales de servicios del ecosistema
        </p>
      </div>

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

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {services.map((svc) => {
          const Icon = SERVICE_ICONS[svc.serviceId] || Zap;
          const isEditing = editingId === svc.serviceId;
          const isOverBudget =
            svc.monthlyBudgetUsd > 0 && svc.monthlyCostUsd > svc.monthlyBudgetUsd;

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
                    <p className="text-sm font-semibold text-text">
                      {svc.name}
                    </p>
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
          (referencia para conversión manual)
        </span>
      </div>
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
          {isOverBudget && " — ¡excedido!"}
        </p>
      )}

      {svc.notes && (
        <p className="mb-2 text-xs text-text-muted">{svc.notes}</p>
      )}

      {svc.lastUpdated && (
        <p className="mb-3 text-[10px] text-text-muted">
          Actualizado: {new Date(svc.lastUpdated).toLocaleDateString("es")}
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
            Período
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
          Budget USD/mes (0 = sin límite)
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
