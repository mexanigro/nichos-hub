"use client";

import { Plus, ListOrdered } from "lucide-react";
import { ReorderControls, moveItem } from "./reorder-controls";

/**
 * Shared editor for sections shaped as `Array<{ number, title, description, iconName? }>`.
 * Used by:
 *   - sections.philosophy.pillars (cafeteria)
 *   - sections.process.steps (cafeteria + remodelaciones)
 *
 * `number` is a free-form string (e.g. "01", "I", "Primero") so the owner can
 * choose roman / arabic / words. We auto-suggest "01", "02" but never overwrite
 * a manual value.
 */
export type NumberedStep = {
  number: string;
  title: string;
  description: string;
  iconName?: string;
};

export function NumberedStepsEditor({
  value,
  onChange,
  itemNoun,
  withIcon = false,
  iconSuggestions = ["Coffee", "Sparkles", "Heart", "Award", "Star", "Zap", "Wrench", "Hammer", "Ruler", "PaintBucket"],
}: {
  value: NumberedStep[] | undefined;
  onChange: (next: NumberedStep[] | undefined) => void;
  /** Singular noun used in labels: "pilar", "paso", "fase". */
  itemNoun: string;
  /** True for process.steps (template renders an icon per step). */
  withIcon?: boolean;
  iconSuggestions?: string[];
}) {
  const items = value ?? [];

  function nextDefaultNumber(): string {
    const n = items.length + 1;
    return n < 10 ? `0${n}` : `${n}`;
  }

  function update(index: number, patch: Partial<NumberedStep>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    const out = items.filter((_, i) => i !== index);
    onChange(out.length > 0 ? out : undefined);
  }

  function move(from: number, dir: -1 | 1) {
    onChange(moveItem(items, from, from + dir));
  }

  function add() {
    const blank: NumberedStep = { number: nextDefaultNumber(), title: "", description: "" };
    if (withIcon) blank.iconName = iconSuggestions[0] ?? "Star";
    onChange([...items, blank]);
  }

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <EmptyState itemNoun={itemNoun} />
        <AddButton itemNoun={itemNoun} onClick={add} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const missing: string[] = [];
        if (!it.number.trim()) missing.push("numero");
        if (!it.title.trim()) missing.push("titulo");
        if (!it.description.trim()) missing.push("descripcion");

        return (
          <div
            key={i}
            className={`rounded-lg border bg-bg-elevated p-3 ${
              missing.length > 0 ? "border-amber-500/30" : "border-border"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {capitalize(itemNoun)} {i + 1}
              </span>
              <ReorderControls
                index={i}
                total={items.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            </div>

            <div className={`grid gap-2 ${withIcon ? "sm:grid-cols-[80px_120px_1fr]" : "sm:grid-cols-[80px_1fr]"}`}>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Numero</label>
                <input
                  type="text"
                  value={it.number}
                  onChange={(e) => update(i, { number: e.target.value })}
                  placeholder="01"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-center text-xs font-mono text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
              {withIcon && (
                <div>
                  <label className="mb-0.5 block text-[10px] text-text-muted">Icono</label>
                  <input
                    type="text"
                    list={`icon-suggestions-step-${i}`}
                    value={it.iconName ?? ""}
                    onChange={(e) => update(i, { iconName: e.target.value })}
                    placeholder="Coffee"
                    className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                  />
                  <datalist id={`icon-suggestions-step-${i}`}>
                    {iconSuggestions.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>
              )}
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Titulo</label>
                <input
                  type="text"
                  value={it.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder="Granos de origen unico"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
              <textarea
                value={it.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={2}
                placeholder={`Detalles del ${itemNoun}...`}
                className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
              />
            </div>

            {missing.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-300/80">Falta completar: {missing.join(", ")}.</p>
            )}
          </div>
        );
      })}
      <AddButton itemNoun={itemNoun} onClick={add} />
    </div>
  );
}

function AddButton({ itemNoun, onClick }: { itemNoun: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Plus size={12} /> Agregar {itemNoun}
    </button>
  );
}

function EmptyState({ itemNoun }: { itemNoun: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
      <ListOrdered size={20} className="mx-auto mb-2 text-text-muted" />
      <p className="text-[11px] text-text-secondary">Sin {itemNoun}es cargados</p>
      <p className="mt-0.5 text-[10px] text-text-muted">
        Los items se numeran y se muestran en orden en la web del cliente. Si dejas la lista
        vacia se usan los del preset del nicho.
      </p>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
