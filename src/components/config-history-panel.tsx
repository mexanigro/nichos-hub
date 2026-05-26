"use client";

import { useEffect, useState } from "react";
import { History, ChevronDown, ChevronRight, Plus, Minus, Edit2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
};

const KIND_ICON = { added: Plus, removed: Minus, changed: Edit2 } as const;
const KIND_COLOR = {
  added: "text-success",
  removed: "text-red-400",
  changed: "text-accent",
} as const;

export function ConfigHistoryPanel({ clientId }: { clientId: string }) {
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
                  <span className="text-xs font-medium text-text">
                    {entry.changeCount} {entry.changeCount === 1 ? "cambio" : "cambios"}
                  </span>
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
                  {entry.changedBy && (
                    <span className="hidden text-[10px] text-text-muted sm:inline">
                      · {entry.changedBy}
                    </span>
                  )}
                </button>
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
