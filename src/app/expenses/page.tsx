"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Plus,
  X,
  Trash2,
  Check,
  Pencil,
  Brain,
  Server,
  CreditCard,
  Wrench,
  TrendingUp,
  Users,
  Loader2,
  Database,
  Power,
  PowerOff,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { LoadingSpinner } from "@/components/loading";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import type {
  OperationalCost,
  OperationalCostCategory,
  OperationalCostType,
} from "@/types";
import type { LucideIcon } from "lucide-react";

/* ─── Constants ─── */

const DEFAULT_RATE = 3.6;
const REVENUE_PER_CLIENT_ILS = 770;

const CATEGORIES: {
  key: OperationalCostCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "ai", label: "IA", icon: Brain },
  { key: "infra", label: "Infraestructura", icon: Server },
  { key: "payments", label: "Pagos", icon: CreditCard },
  { key: "tools", label: "Herramientas", icon: Wrench },
];

const CATEGORY_STYLES: Record<
  OperationalCostCategory,
  { bg: string; text: string; bar: string; hex: string }
> = {
  ai: {
    bg: "bg-purple-500/15",
    text: "text-purple-400",
    bar: "bg-purple-500",
    hex: "#a855f7",
  },
  infra: {
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    bar: "bg-blue-500",
    hex: "#3b82f6",
  },
  payments: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    bar: "bg-orange-500",
    hex: "#f97316",
  },
  tools: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-400",
    bar: "bg-cyan-500",
    hex: "#06b6d4",
  },
};

/* ─── Helpers ─── */

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatIls(n: number) {
  return `₪${Math.round(n).toLocaleString()}`;
}

function toUsd(cost: OperationalCost, rate: number): number {
  return cost.moneda === "USD" ? cost.monto : cost.monto / rate;
}

function toIls(cost: OperationalCost, rate: number): number {
  return cost.moneda === "ILS" ? cost.monto : cost.monto * rate;
}

/* ─── Page ─── */

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [costs, setCosts] = useState<OperationalCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [rate, setRate] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("operational-costs-rate");
      return saved ? parseFloat(saved) : DEFAULT_RATE;
    }
    return DEFAULT_RATE;
  });

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchCosts();
  }, [session, router]);

  async function fetchCosts() {
    const res = await fetch("/api/operational-costs");
    if (res.ok) {
      const data = await res.json();
      setCosts(
        data.map((c: OperationalCost) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        })),
      );
    }
    setLoading(false);
  }

  async function handleSeed() {
    setSeeding(true);
    const res = await fetch("/api/operational-costs/seed", { method: "POST" });
    if (res.ok) await fetchCosts();
    setSeeding(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const data = {
      nombre: form.get("nombre") as string,
      monto: Number(form.get("monto")),
      moneda: form.get("moneda") as "USD" | "ILS",
      tipo: form.get("tipo") as OperationalCostType,
      categoria: form.get("categoria") as OperationalCostCategory,
      notas: form.get("notas") as string,
    };

    try {
      const method = editingCost ? "PATCH" : "POST";
      const body = editingCost ? { id: editingCost.id, ...data } : data;

      const res = await fetch("/api/operational-costs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingCost(null);
        await fetchCosts();
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "Error al guardar");
      }
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(cost: OperationalCost) {
    setTogglingId(cost.id);
    await fetch("/api/operational-costs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cost.id, activo: !cost.activo }),
    });
    setCosts((prev) =>
      prev.map((c) => (c.id === cost.id ? { ...c, activo: !c.activo } : c)),
    );
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch("/api/operational-costs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCosts((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  }

  function handleRateChange(newRate: number) {
    setRate(newRate);
    localStorage.setItem("operational-costs-rate", String(newRate));
  }

  /* ─── Calculations ─── */

  const activeCosts = costs.filter((c) => c.activo);
  const fixedCosts = activeCosts.filter((c) => c.tipo === "fijo");
  const variableCosts = activeCosts.filter((c) => c.tipo === "variable");

  const totalFixedUsd = fixedCosts.reduce((s, c) => s + toUsd(c, rate), 0);
  const totalFixedIls = fixedCosts.reduce((s, c) => s + toIls(c, rate), 0);
  const totalVarPerClientUsd = variableCosts.reduce(
    (s, c) => s + toUsd(c, rate),
    0,
  );
  const totalVarPerClientIls = variableCosts.reduce(
    (s, c) => s + toIls(c, rate),
    0,
  );
  const marginPerClientIls = REVENUE_PER_CLIENT_ILS - totalVarPerClientIls;

  const byCategory = CATEGORIES.map((cat) => {
    const catCosts = activeCosts.filter((c) => c.categoria === cat.key);
    const totalUsd = catCosts.reduce((s, c) => s + toUsd(c, rate), 0);
    return { name: cat.label, key: cat.key, value: Math.round(totalUsd * 100) / 100 };
  }).filter((d) => d.value > 0);

  const projections = [3, 5, 10, 15, 20, 30].map((n) => {
    const revenue = REVENUE_PER_CLIENT_ILS * n;
    const totalCost = totalFixedIls + totalVarPerClientIls * n;
    const margin = revenue - totalCost;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
    return {
      clients: n,
      revenue,
      fixedCost: totalFixedIls,
      variableCost: totalVarPerClientIls * n,
      totalCost,
      margin,
      marginPct,
    };
  });

  const breakeven = totalVarPerClientIls < REVENUE_PER_CLIENT_ILS
    ? Math.ceil(totalFixedIls / (REVENUE_PER_CLIENT_ILS - totalVarPerClientIls))
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">
            Costos Operativos
          </h1>
          <p className="text-xs text-text-muted">
            {costs.length} costos registrados — {activeCosts.length} activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {costs.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
            >
              {seeding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              {seeding ? "Cargando..." : "Cargar datos iniciales"}
            </button>
          )}
          <button
            onClick={() => {
              setEditingCost(null);
              setShowForm(true);
              setFormError("");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={14} />
            Nuevo costo
          </button>
        </div>
      </div>

      {costs.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Sin costos operativos"
          description="Cargá los datos iniciales o agregá tu primer costo operativo"
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="Fijos USD/mes"
              value={formatUsd(totalFixedUsd)}
              iconBg="bg-accent-muted"
              iconColor="text-accent"
            />
            <StatCard
              icon={DollarSign}
              label="Fijos ILS/mes"
              value={formatIls(totalFixedIls)}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-400"
            />
            <StatCard
              icon={Users}
              label="Variable/cliente"
              value={formatUsd(totalVarPerClientUsd)}
              iconBg="bg-orange-500/15"
              iconColor="text-orange-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Margen/cliente"
              value={formatIls(marginPerClientIls)}
              iconBg="bg-green-500/15"
              iconColor="text-green-400"
              valueColor={
                marginPerClientIls >= 0 ? "text-green-400" : "text-red-400"
              }
            />
          </div>

          {/* Breakeven callout */}
          {breakeven !== null && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/15">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-green-400">
                  Punto de equilibrio: {breakeven} cliente
                  {breakeven !== 1 ? "s" : ""}
                </span>{" "}
                — a partir de ahí, cada cliente nuevo aporta{" "}
                <span className="font-mono font-semibold text-text">
                  {formatIls(REVENUE_PER_CLIENT_ILS - totalVarPerClientIls)}
                </span>{" "}
                de margen neto.
              </p>
            </div>
          )}

          {/* Chart + Projections */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            {/* Donut Chart */}
            <div className="rounded-xl border border-border bg-bg-card p-5 lg:col-span-2">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Distribución por categoría
              </p>
              {byCategory.length > 0 ? (
                <>
                  <div className="mx-auto" style={{ maxWidth: 220, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byCategory}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {byCategory.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={
                                CATEGORY_STYLES[
                                  entry.key as OperationalCostCategory
                                ]?.hex || "#666"
                              }
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "#111113",
                            border: "1px solid #27272a",
                            borderRadius: "0.5rem",
                            fontSize: "12px",
                            color: "#fafafa",
                          }}
                          formatter={(value) => [
                            formatUsd(Number(value)),
                            "USD/mes",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Center label */}
                  <p className="mb-3 text-center text-lg font-bold tabular-nums text-text">
                    {formatUsd(
                      byCategory.reduce((s, d) => s + d.value, 0),
                    )}
                    <span className="block text-[10px] font-normal text-text-muted">
                      total USD/mes
                    </span>
                  </p>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                    {byCategory.map((d) => {
                      const s =
                        CATEGORY_STYLES[d.key as OperationalCostCategory];
                      return (
                        <div key={d.key} className="flex items-center gap-1.5">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${s?.bar || "bg-zinc-500"}`}
                          />
                          <span className="text-[10px] text-text-muted">
                            {d.name}: {formatUsd(d.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="py-10 text-center text-xs text-text-muted">
                  Sin datos
                </p>
              )}
            </div>

            {/* Margin Projections */}
            <div className="rounded-xl border border-border bg-bg-card p-5 lg:col-span-3">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Proyección de márgenes (₪{REVENUE_PER_CLIENT_ILS}/cliente/mes)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      <th className="whitespace-nowrap px-3 py-2 text-left">
                        Clientes
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">
                        Ingreso
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">
                        Fijos
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">
                        Variables
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">
                        Margen
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((p) => (
                      <tr
                        key={p.clients}
                        className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg-hover"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-text">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-bg-elevated text-[11px]">
                            {p.clients}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-text-secondary">
                          {formatIls(p.revenue)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-red-400/70">
                          -{formatIls(p.fixedCost)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-orange-400/70">
                          -{formatIls(p.variableCost)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums font-semibold ${
                            p.margin >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {formatIls(p.margin)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${
                              p.marginPct >= 60
                                ? "bg-green-500/15 text-green-400"
                                : p.marginPct >= 30
                                  ? "bg-yellow-500/15 text-yellow-400"
                                  : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {p.marginPct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Cost Tables */}
          <div className="mb-6 space-y-4">
            <CostGroup
              title="Fijos mensuales"
              badge={formatUsd(totalFixedUsd)}
              costs={costs.filter((c) => c.tipo === "fijo")}
              rate={rate}
              togglingId={togglingId}
              deletingId={deletingId}
              onToggle={handleToggleActive}
              onEdit={(c) => {
                setEditingCost(c);
                setShowForm(true);
                setFormError("");
              }}
              onDelete={handleDelete}
            />
            <CostGroup
              title="Variables por cliente"
              badge={`${formatUsd(totalVarPerClientUsd)}/cliente`}
              costs={costs.filter((c) => c.tipo === "variable")}
              rate={rate}
              togglingId={togglingId}
              deletingId={deletingId}
              onToggle={handleToggleActive}
              onEdit={(c) => {
                setEditingCost(c);
                setShowForm(true);
                setFormError("");
              }}
              onDelete={handleDelete}
            />
          </div>

          {/* Exchange Rate Footer */}
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
            <span className="text-[10px] text-text-muted">
              Precio cliente: ₪{REVENUE_PER_CLIENT_ILS}/mes
            </span>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <CostFormModal
          cost={editingCost}
          saving={saving}
          error={formError}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingCost(null);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

function CostGroup({
  title,
  badge,
  costs,
  rate,
  togglingId,
  deletingId,
  onToggle,
  onEdit,
  onDelete,
}: {
  title: string;
  badge: string;
  costs: OperationalCost[];
  rate: number;
  togglingId: string | null;
  deletingId: string | null;
  onToggle: (c: OperationalCost) => void;
  onEdit: (c: OperationalCost) => void;
  onDelete: (id: string) => void;
}) {
  if (costs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between bg-bg-card px-5 py-3">
        <p className="text-xs font-semibold text-text">{title}</p>
        <span className="rounded-md bg-bg-elevated px-2.5 py-1 font-mono text-[10px] font-semibold text-text-muted">
          {badge}
        </span>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-t border-border bg-bg-card/50 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <th className="whitespace-nowrap px-5 py-2.5">Nombre</th>
            <th className="whitespace-nowrap px-4 py-2.5">Categoría</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-right">Monto</th>
            <th className="hidden whitespace-nowrap px-4 py-2.5 text-right md:table-cell">
              USD equiv.
            </th>
            <th className="whitespace-nowrap px-4 py-2.5 text-center">
              Activo
            </th>
            <th className="w-20 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {costs.map((c) => {
            const catStyle = CATEGORY_STYLES[c.categoria];
            const CatIcon =
              CATEGORIES.find((cat) => cat.key === c.categoria)?.icon || Wrench;
            const usdEquiv = toUsd(c, rate);

            return (
              <tr
                key={c.id}
                className={`border-b border-border transition-colors last:border-0 hover:bg-bg-hover ${
                  !c.activo ? "opacity-50" : ""
                }`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${catStyle.bg}`}
                    >
                      <CatIcon size={14} className={catStyle.text} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text">{c.nombre}</p>
                      {c.notas && (
                        <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-text-muted">
                          {c.notas}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${catStyle.bg} ${catStyle.text}`}
                  >
                    {CATEGORIES.find((cat) => cat.key === c.categoria)?.label ||
                      c.categoria}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-text">
                  {c.moneda === "USD" ? "$" : "₪"}
                  {c.monto.toLocaleString()}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-text-muted md:table-cell">
                  {formatUsd(usdEquiv)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onToggle(c)}
                    disabled={togglingId === c.id}
                    className="mx-auto text-text-muted transition-colors hover:text-text disabled:opacity-50"
                    title={c.activo ? "Desactivar" : "Activar"}
                  >
                    {togglingId === c.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : c.activo ? (
                      <Power size={16} className="text-green-400" />
                    ) : (
                      <PowerOff size={16} className="text-text-muted" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(c)}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-danger-muted hover:text-danger disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === c.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CostFormModal({
  cost,
  saving,
  error,
  onSubmit,
  onClose,
}: {
  cost: OperationalCost | null;
  saving: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const isEdit = cost !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">
            {isEdit ? "Editar costo" : "Nuevo costo operativo"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              Nombre *
            </label>
            <input
              name="nombre"
              required
              defaultValue={cost?.nombre || ""}
              placeholder="Ej: Claude, Vercel Pro"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Monto *
              </label>
              <input
                name="monto"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={cost?.monto || ""}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Moneda *
              </label>
              <select
                name="moneda"
                required
                defaultValue={cost?.moneda || "USD"}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="ILS">ILS (₪)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Tipo *
              </label>
              <select
                name="tipo"
                required
                defaultValue={cost?.tipo || "fijo"}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="fijo">Fijo mensual</option>
                <option value="variable">Variable por cliente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-text-muted">
                Categoría *
              </label>
              <select
                name="categoria"
                required
                defaultValue={cost?.categoria || "ai"}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-text-muted">
              Notas
            </label>
            <input
              name="notas"
              defaultValue={cost?.notas || ""}
              placeholder="Opcional — contexto o rango estimado"
              className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear costo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
