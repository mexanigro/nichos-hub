"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Download,
  Upload,
  Trash2,
  DollarSign,
  TrendingDown,
  Calendar,
  Filter,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingSpinner } from "@/components/loading";
import { StatCard } from "@/components/stat-card";
import type { Expense, ExpenseCategory } from "@/types";

const CATEGORIES: { key: ExpenseCategory; label: string }[] = [
  { key: "hosting", label: "Hosting" },
  { key: "software", label: "Software" },
  { key: "marketing", label: "Marketing" },
  { key: "salarios", label: "Salarios" },
  { key: "servicios", label: "Servicios" },
  { key: "equipamiento", label: "Equipamiento" },
  { key: "otro", label: "Otro" },
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  hosting: "bg-blue-500/20 text-blue-400",
  software: "bg-purple-500/20 text-purple-400",
  marketing: "bg-orange-500/20 text-orange-400",
  salarios: "bg-green-500/20 text-green-400",
  servicios: "bg-cyan-500/20 text-cyan-400",
  equipamiento: "bg-yellow-500/20 text-yellow-400",
  otro: "bg-zinc-500/20 text-zinc-400",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "all">("all");
  const [importing, setImporting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetchExpenses();
  }, [session, router]);

  async function fetchExpenses() {
    const res = await fetch("/api/expenses");
    if (res.ok) {
      const data = await res.json();
      setExpenses(
        data.map((e: Expense) => ({
          ...e,
          createdAt: new Date(e.createdAt),
        }))
      );
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    const form = new FormData(e.currentTarget);
    const body = {
      date: form.get("date"),
      category: form.get("category"),
      description: form.get("description"),
      amount: Number(form.get("amount")),
      paymentMethod: form.get("paymentMethod") || "",
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        fetchExpenses();
      } else {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Error al crear el gasto");
      }
    } catch {
      setFormError("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  }

  async function handleExport() {
    window.open("/api/expenses/export", "_blank");
  }

  async function handleImport(file: File) {
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      setImporting(false);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const dateIdx = headers.findIndex((h) => h === "fecha" || h === "date");
    const catIdx = headers.findIndex((h) => h === "categoria" || h === "category");
    const descIdx = headers.findIndex((h) => h === "descripcion" || h === "description");
    const amountIdx = headers.findIndex((h) => h === "monto" || h === "amount");
    const methodIdx = headers.findIndex((h) => h.includes("metodo") || h.includes("method"));

    if (dateIdx === -1 || amountIdx === -1) {
      setImporting(false);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const body = {
        date: cols[dateIdx] || new Date().toISOString().slice(0, 10),
        category: cols[catIdx] || "otro",
        description: cols[descIdx] || "",
        amount: parseFloat(cols[amountIdx]) || 0,
        paymentMethod: methodIdx >= 0 ? cols[methodIdx] : "",
      };
      if (body.amount > 0) {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
    }

    await fetchExpenses();
    setImporting(false);
  }

  const filtered =
    filterCat === "all"
      ? expenses
      : expenses.filter((e) => e.category === filterCat);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMonth = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);

  const months = new Set(expenses.map((e) => e.date.slice(0, 7)));
  const avgMonthly = months.size > 0 ? totalAll / months.size : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-text">Gastos</h1>
          <p className="text-xs text-text-muted">
            {expenses.length} gastos registrados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            disabled={expenses.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text disabled:opacity-40"
          >
            <Download size={14} />
            Exportar CSV
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text disabled:opacity-40"
          >
            <Upload size={14} />
            {importing ? "Importando..." : "Importar CSV"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => {
              setShowForm(true);
              setFormError("");
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={14} />
            Nuevo gasto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total acumulado" value={formatCurrency(totalAll)} iconBg="bg-accent-muted" iconColor="text-accent" />
        <StatCard icon={TrendingDown} label="Este mes" value={formatCurrency(totalMonth)} iconBg="bg-danger-muted" iconColor="text-danger" />
        <StatCard icon={Calendar} label="Promedio mensual" value={formatCurrency(avgMonthly)} iconBg="bg-warning-muted" iconColor="text-warning" />
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        <Filter size={14} className="text-text-muted" />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as ExpenseCategory | "all")}
          className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        {filterCat !== "all" && (
          <button
            onClick={() => setFilterCat("all")}
            className="text-[11px] text-text-muted hover:text-text"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Sin gastos"
          description={
            filterCat !== "all"
              ? "No hay gastos en esta categoría"
              : "Registrá tu primer gasto o importá un CSV"
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="whitespace-nowrap px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="min-w-[180px] px-4 py-3">Descripción</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Monto</th>
                <th className="hidden whitespace-nowrap px-4 py-3 md:table-cell">
                  Método
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => (
                <tr
                  key={exp.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-bg-hover"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-text-secondary">
                    {exp.date}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.otro}`}
                    >
                      {CATEGORIES.find((c) => c.key === exp.category)?.label ||
                        exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text">
                    {exp.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-text">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-text-muted md:table-cell">
                    {exp.paymentMethod || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={deleting === exp.id}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-danger-muted hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Nuevo gasto</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-text-muted hover:text-text"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">
                    Fecha *
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">
                    Categoría *
                  </label>
                  <select
                    name="category"
                    required
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
                  Descripción *
                </label>
                <input
                  name="description"
                  required
                  placeholder="Ej: Suscripción Vercel Pro"
                  className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">
                    Monto *
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text-muted">
                    Método de pago
                  </label>
                  <input
                    name="paymentMethod"
                    placeholder="Ej: Transferencia, Tarjeta"
                    className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
              {formError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={creating}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-text-secondary hover:text-text"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {creating ? "Guardando..." : "Guardar gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
