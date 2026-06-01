import type { HealthStatus, ClientStatus } from "@/types";

const healthColors: Record<HealthStatus, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  down: "bg-danger",
};

const statusLabels: Record<ClientStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "text-success bg-success-muted" },
  demo: { label: "Demo", className: "text-yellow-500 bg-yellow-500/10" },
  trial: { label: "Trial", className: "text-accent bg-accent-muted" },
  maintenance: { label: "Mantenimiento", className: "text-warning bg-warning-muted" },
  suspended: { label: "Suspendido", className: "text-danger bg-danger-muted" },
  archived: { label: "Archivado", className: "text-text-muted bg-bg-elevated" },
  pending_provision: { label: "Pago sin onboarding", className: "text-purple-300 bg-purple-500/10" },
  pending_review: { label: "Pendiente revisión", className: "text-orange-300 bg-orange-500/10" },
  changes_requested: { label: "Cambios pedidos", className: "text-amber-300 bg-amber-500/10" },
};

export function HealthDot({ status }: { status: HealthStatus }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status !== "healthy" && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${healthColors[status]}`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${healthColors[status]}`} />
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const config = statusLabels[status] || { label: status, className: "text-text-muted bg-bg-elevated" };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
