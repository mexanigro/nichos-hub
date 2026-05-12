import type { PaymentStatus } from "@/types";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "text-success bg-success-muted" },
  pending: { label: "Pendiente", className: "text-warning bg-warning-muted" },
  failed: { label: "Fallido", className: "text-danger bg-danger-muted" },
  cancelled: { label: "Cancelado", className: "text-text-muted bg-bg-elevated" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PaymentTypeBadge({ type }: { type: "initial" | "recurring" }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
      type === "initial" ? "text-accent bg-accent-muted" : "text-text-secondary bg-bg-elevated"
    }`}>
      {type === "initial" ? "Setup" : "Mensual"}
    </span>
  );
}

export { statusConfig };
