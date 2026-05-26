"use client";

import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";

/**
 * Shared reorder + remove controls for list editors (benefits, testimonials,
 * staff, services). Keyboard-accessible, no drag library — accessible by
 * default and survives mobile better than drag.
 */
export function ReorderControls({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  removeLabel = "Eliminar",
}: {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  removeLabel?: string;
}) {
  const isFirst = index === 0;
  const isLast = index === total - 1;
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Subir"
        title="Subir"
        className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-hover hover:text-text disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
      >
        <ArrowUp size={11} />
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Bajar"
        title="Bajar"
        className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-hover hover:text-text disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
      >
        <ArrowDown size={11} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="flex h-6 w-6 items-center justify-center rounded text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

/** Move element at `from` to `to` in a new array. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = arr.slice();
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}
