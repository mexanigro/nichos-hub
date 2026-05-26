"use client";

import { useEffect, useState } from "react";
import { History, ChevronDown, ChevronRight, Plus, Minus, Edit2, Loader2, User, UserCog } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "next-auth/react";

/**
 * Compact recent-changes panel for /clients/[clientId] Overview.
 * Pulls from /api/config/{clientId}/history (written by PUT /api/config).
 * Each entry expandable to see per-path before→after summaries.
 */

type HistoryChange = {
  path: string;
  kind: "added" | "removed" | "changed";
  beforeSummary: string;
  afterSummary: string;
};

type HistoryEntry = {
  id: string;
  changedAt: string | null;
  changedBy: string | null;
  changeCount: number;
  truncated: boolean;
  changes: HistoryChange[];
  kind?: string | null;
};

type Actor =
  | { type: "customer"; label: string; description: string }
  | { type: "you"; label: string; description: string }
  | { type: "operator"; label: string; description: string }
  | { type: "unknown"; label: string; description: string };

function classifyActor(changedBy: string | null, ownerEmail?: string | null): Actor {
  if (!changedBy) return { type: "unknown", label: "Sistema", description: "Origen no registrado" };
  if (changedBy === "customer") {
    return {
      type: "customer",
      label: "Cliente",
      description: "El cliente reenvió la información solicitada",
    };
  }
  if (ownerEmail && changedBy === ownerEmail) {
    return { type: "you", label: "Vos", description: changedBy };
  }
  if (changedBy === "owner") {
    return { type: "you", label: "Vos", description: "Sesión owner" };
  }
  return { type: "operator", label: "Operador", description: changedBy };
}

const ACTOR_STYLES: Record<Actor["type"], { chip: string; icon: typeof User }> = {
  customer: {
    chip: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    icon: User,
  },
  you: {
    chip: "border-accent/40 bg-accent/10 text-accent",
    icon: UserCog,
  },
  operator: {
    chip: "border-border bg-bg-elevated text-text-secondary",
    icon: UserCog,
  },
  unknown: {
    chip: "border-border bg-bg-elevated text-text-muted",
    icon: UserCog,
  },
};

const KIND_ICON = { added: Plus, removed: Minus, changed: Edit2 } as const;
const KIND_COLOR = {
  added: "text-success",
  removed: "text-red-400",
  changed: "text-accent",
} as const;

export function ConfigHistoryPanel({ clientId }: { clientId: string }) {
  const { data: session } = useSession();
  const ownerEmail = session?.user?.email ?? null;
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/config/${clientId}/history?limit=10`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.entries)) setEntries(data.entries);
        else setEntries([]);
        if (data.error) setError(data.error);
      })
      .catch(() => {
        if (!cancelled) {
          setEntries([]);
          setError("No se pudo cargar el historial");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-text-muted">
        <History size={12} />
        Cambios recientes del config
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={14} className="animate-spin text-text-muted" />
        </div>
      ) : !entries || entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-muted">
          {error || "Sin cambios registrados todavia."}
        </p>
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {entries.map((entry) => {
            const isOpen = expanded.has(entry.id);
            const actor = classifyActor(entry.changedBy, ownerEmail);
            const styles = ACTOR_STYLES[actor.type];
            const ActorIcon = styles.icon;
            return (
              <div key={entry.id} className="rounded-lg border border-border bg-bg-elevated">
                <button
                  type="button"
                  onClick={() => toggle(entry.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  {isOpen ? (
                    <ChevronDown size={11} className="text-text-muted" />
                  ) : (
                    <ChevronRight size={11} className="text-text-muted" />
                  )}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${styles.chip}`}
                    title={actor.description}
                  >
                    <ActorIcon size={9} />
                    {actor.label}
                  </span>
                  <span className="text-xs font-medium text-text">
                    {entry.changeCount} {entry.changeCount === 1 ? "cambio" : "cambios"}
                  </span>
                  {entry.kind === "resubmit" && (
                    <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-medium text-sky-300">
                      Reenvío
                    </span>
                  )}
                  {entry.truncated && (
                    <span className="rounded bg-bg-active px-1 py-0.5 text-[9px] uppercase tracking-wider text-text-muted">
                      truncado
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-text-muted" title={entry.changedAt ?? ""}>
                    {entry.changedAt
                      ? formatDistanceToNow(new Date(entry.changedAt), { addSuffix: true, locale: es })
                      : "—"}
                  </span>
                </button>
                {actor.type === "customer" && (
                  <div className="border-t border-border bg-sky-500/[0.04] px-3 py-1.5 text-[10px] text-sky-200/80">
                    {entry.kind === "resubmit"
                      ? "Cliente reenvió la info con cambios. El estado volvió a pending_review."
                      : "El cliente actualizó la información desde el wizard."}
                  </div>
                )}
                {isOpen && (
                  <div className="space-y-1 border-t border-border px-3 pb-2 pt-2">
                    {entry.changes.map((c, i) => {
                      const Icon = KIND_ICON[c.kind];
                      return (
                        <div key={`${c.path}-${i}`} className="flex items-start gap-1.5 text-[10px]">
                          <Icon size={10} className={`mt-0.5 shrink-0 ${KIND_COLOR[c.kind]}`} />
                          <div className="min-w-0 flex-1">
                            <code className="font-mono text-[10px] text-text-secondary">{c.path}</code>
                            <div className="text-text-muted">
                              <span className="line-through decoration-text-muted/40">
                                {c.beforeSummary}
                              </span>
                              <span className="mx-1 opacity-40">→</span>
                              <span className="text-text">{c.afterSummary}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
