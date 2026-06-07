"use client";

import type { ProspectStatusEvent, ProspectFollowUpStatus } from "@/types";
import {
  Globe,
  Send,
  Eye,
  ThumbsUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

const STATUS_CONFIG: Record<
  ProspectFollowUpStatus,
  { label: string; color: string; bg: string; icon: typeof Globe }
> = {
  web_created: {
    label: "Web creada",
    color: "text-blue-400",
    bg: "bg-blue-400/15",
    icon: Globe,
  },
  web_sent: {
    label: "Web enviada",
    color: "text-violet-400",
    bg: "bg-violet-400/15",
    icon: Send,
  },
  web_viewed: {
    label: "Vio la web",
    color: "text-cyan-400",
    bg: "bg-cyan-400/15",
    icon: Eye,
  },
  interested: {
    label: "Interesado",
    color: "text-amber-400",
    bg: "bg-amber-400/15",
    icon: ThumbsUp,
  },
  payment_link_sent: {
    label: "Link de pago enviado",
    color: "text-orange-400",
    bg: "bg-orange-400/15",
    icon: CreditCard,
  },
  paid: {
    label: "Pago",
    color: "text-emerald-400",
    bg: "bg-emerald-400/15",
    icon: CheckCircle2,
  },
  not_interested: {
    label: "No interesado",
    color: "text-text-muted",
    bg: "bg-bg-elevated",
    icon: XCircle,
  },
  follow_up_pending: {
    label: "Follow-up pendiente",
    color: "text-amber-400",
    bg: "bg-amber-400/15",
    icon: Clock,
  },
};

export function getStatusConfig(status: ProspectFollowUpStatus) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.web_created;
}

export function ProspectStatusBadge({
  status,
  size = "sm",
}: {
  status: ProspectFollowUpStatus;
  size?: "sm" | "md";
}) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  const sizeClasses =
    size === "md"
      ? "px-3 py-1.5 text-xs gap-2"
      : "px-2 py-0.5 text-[10px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.color} ${sizeClasses}`}
    >
      <Icon size={size === "md" ? 14 : 11} />
      {config.label}
    </span>
  );
}

export function ProspectTimeline({
  history,
}: {
  history: ProspectStatusEvent[];
}) {
  if (!history || history.length === 0) return null;

  return (
    <div className="relative space-y-0">
      {history.map((event, i) => {
        const config = getStatusConfig(event.status);
        const Icon = config.icon;
        const isLast = i === history.length - 1;
        const date = new Date(event.date);

        return (
          <div key={`${event.status}-${event.date}`} className="relative flex gap-3 pb-4">
            {!isLast && (
              <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
            )}
            <div
              className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
            >
              <Icon size={13} className={config.color} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-[10px] text-text-muted">
                  {date.toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  {date.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {event.note && (
                <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
                  {event.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
