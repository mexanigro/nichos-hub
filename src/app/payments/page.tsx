"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { Payment, PaymentStatus } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "text-success bg-success-muted" },
  pending: { label: "Pendiente", className: "text-warning bg-warning-muted" },
  failed: { label: "Fallido", className: "text-danger bg-danger-muted" },
  cancelled: { label: "Cancelado", className: "text-text-muted bg-bg-elevated" },
};

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function PaymentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentStatus | "all">(
    (searchParams.get("status") as PaymentStatus) || "all",
  );

  useEffect(() => {
    if (session?.user?.role !== "owner") {
      router.push("/sales");
      return;
    }
    fetch("/api/payments")
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
      .finally(() => setLoading(false));
  }, [session, router]);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthPayments = payments.filter(
    (p) => format(p.billingDate, "yyyy-MM") === thisMonth,
  );
  const totalCobrado = thisMonthPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const pendientes = payments.filter((p) => p.status === "pending").length;
  const fallidos = payments.filter((p) => p.status === "failed").length;

  const filtered =
    filter === "all" ? payments : payments.filter((p) => p.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text">Pagos</h1>
        <p className="text-xs text-text-muted">
          {payments.length} registros de pago
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-muted">
              <DollarSign size={16} className="text-success" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Cobrado este mes
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-success">
            ₪{totalCobrado.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-muted">
              <Clock size={16} className="text-warning" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Pendientes
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-warning">
            {pendientes}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-muted">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
              Fallidos
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-danger">
            {fallidos}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-1.5">
        {(["all", "paid", "pending", "failed", "cancelled"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                filter === s
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text"
              }`}
            >
              {s === "all"
                ? "Todos"
                : statusConfig[s].label}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos"
          description="No hay registros de pago con este filtro"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-card text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="min-w-[140px] px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Client ID</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="hidden px-4 py-3 md:table-cell">Último cobro</th>
                <th className="hidden px-4 py-3 md:table-cell">Próximo cobro</th>
                <th className="hidden px-4 py-3 lg:table-cell">Tarjeta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-bg-hover"
                >
                  <td className="min-w-[140px] px-4 py-3">
                    <span className="font-medium text-text">
                      {p.businessName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-muted">
                      {p.clientId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium tabular-nums text-text">
                      ₪{p.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={p.status} />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-text-muted md:table-cell">
                    {format(p.billingDate, "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-text-muted md:table-cell">
                    {format(p.nextBillingDate, "dd MMM yyyy", { locale: es })}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="font-mono text-xs text-text-muted">
                      {p.cardLastFour ? `•••• ${p.cardLastFour}` : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
