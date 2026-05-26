"use client";

import { useMemo } from "react";
import { Loader2, X, ArrowRight, Plus, Minus, Edit2, GitCommit } from "lucide-react";
import { diffConfig, summarizeValue, type DiffEntry } from "@/lib/config-diff";

/**
 * Pre-save diff modal. Shows the owner exactly what changed between the
 * doc they loaded and the doc they're about to send. Reduces "I pressed
 * Save and the splash broke" surprise.
 *
 * Renders nothing when `open` is false. Each entry shows path + kind +
 * before/after summary. Click "Confirmar" to trigger the actual PUT.
 */

const KIND_META: Record<DiffEntry["kind"], { label: string; icon: typeof Plus; className: string }> = {
  added: { label: "Nuevo", icon: Plus, className: "border-success/30 bg-success/5 text-success" },
  removed: { label: "Removido", icon: Minus, className: "border-red-500/30 bg-red-500/5 text-red-400" },
  changed: { label: "Cambio", icon: Edit2, className: "border-accent/30 bg-accent/5 text-accent" },
};

export function SaveDiffModal({
  open,
  before,
  after,
  saving,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  before: unknown;
  after: unknown;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const diff = useMemo(() => (open ? diffConfig(before, after) : []), [open, before, after]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <GitCommit size={14} className="text-accent" />
          <h2 className="flex-1 text-sm font-semibold text-text">
            Confirmar cambios
            {diff.length > 0 && (
              <span className="ml-2 text-xs font-normal text-text-muted">
                ({diff.length} {diff.length === 1 ? "cambio" : "cambios"})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text disabled:opacity-50"
            aria-label="Cancelar"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3">
          {diff.length === 0 ? (
            <div className="rounded-lg border border-border bg-bg-elevated p-6 text-center">
              <p className="text-xs text-text-muted">
                No hay cambios entre la version cargada y la actual.
              </p>
            </div>
          ) : (
            diff.map((entry, i) => <DiffRow key={`${entry.path}-${i}`} entry={entry} />)
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-[10px] text-text-muted">
            {diff.length === 0
              ? "Podes cerrar este dialogo."
              : "Al confirmar se sobrescribe el documento de Firestore."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving || diff.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Guardando..." : "Confirmar y guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffRow({ entry }: { entry: DiffEntry }) {
  const meta = KIND_META[entry.kind];
  const Icon = meta.icon;
  return (
    <div className={`rounded-lg border px-3 py-2 ${meta.className}`}>
      <div className="flex items-start gap-2">
        <Icon size={11} className="mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="rounded bg-black/20 px-1 py-0.5 font-mono text-[10px]">{entry.path || "config"}</code>
            <span className="text-[10px] uppercase tracking-wider opacity-70">{meta.label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="break-words font-mono text-text-muted line-through decoration-text-muted/40">
              {summarizeValue(entry.before)}
            </span>
            <ArrowRight size={10} className="shrink-0 opacity-60" />
            <span className="break-words font-mono text-text">{summarizeValue(entry.after)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
