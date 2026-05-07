import type { HealthStatus, ClientStatus } from "@/types";

const healthColors: Record<HealthStatus, string> = {
  healthy: "bg-success",
  degraded: "bg-warning",
  down: "bg-danger",
};

const statusLabels: Record<ClientStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "text-success bg-success-muted" },
  trial: { label: "Trial", className: "text-accent bg-accent-muted" },
  maintenance: { label: "Mantenimiento", className: "text-warning bg-warning-muted" },
  suspended: { label: "Suspendido", className: "text-danger bg-danger-muted" },
  archived: { label: "Archivado", className: "text-text-muted bg-bg-elevated" },
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
  const config = statusLabels[status];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
