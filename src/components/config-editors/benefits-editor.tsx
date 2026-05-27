"use client";

import { Plus, Sparkles } from "lucide-react";
import { ReorderControls, moveItem } from "./reorder-controls";
import { useClientLanguage } from "@/lib/client-language-context";
import { placeholderFor } from "@/lib/dashboard-placeholders";

export type Benefit = {
  title: string;
  desc: string;
  iconName: string;
};

/**
 * Editor for `sections.whyChooseUs.benefits[]`.
 *
 * The template renders 3-5 benefit cards in the "Why Choose Us" section,
 * each with a Lucide icon. Common icon names: Award, Star, Heart, Shield,
 * Clock, Users, Sparkles, Crown, Zap.
 */
export function BenefitsEditor({
  value,
  onChange,
  iconSuggestions = ["Award", "Star", "Heart", "Shield", "Clock", "Users", "Sparkles", "Crown", "Zap"],
}: {
  value: Benefit[] | undefined;
  onChange: (next: Benefit[] | undefined) => void;
  iconSuggestions?: string[];
}) {
  const items = value ?? [];
  const lang = useClientLanguage();
  const titlePh = placeholderFor(lang, "benefitTitle");
  const descPh = placeholderFor(lang, "benefitDesc");

  function update(index: number, patch: Partial<Benefit>) {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function remove(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : undefined);
  }

  function move(from: number, dir: -1 | 1) {
    onChange(moveItem(items, from, from + dir));
  }

  function add() {
    onChange([...items, { title: "", desc: "", iconName: iconSuggestions[0] ?? "Star" }]);
  }

  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <EmptyState />
        <AddButton onClick={add} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((b, i) => {
        const missing: string[] = [];
        if (!b.title.trim()) missing.push("titulo");
        if (!b.desc.trim()) missing.push("descripcion");
        if (!b.iconName.trim()) missing.push("icono");

        return (
          <div
            key={i}
            className={`rounded-lg border bg-bg-elevated p-3 ${
              missing.length > 0 ? "border-amber-500/30" : "border-border"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Beneficio {i + 1}
              </span>
              <ReorderControls
                index={i}
                total={items.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Icono (Lucide)</label>
                <input
                  type="text"
                  list={`icon-suggestions-${i}`}
                  value={b.iconName}
                  onChange={(e) => update(i, { iconName: e.target.value })}
                  placeholder="Star"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
                <datalist id={`icon-suggestions-${i}`}>
                  {iconSuggestions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Titulo</label>
                <input
                  type="text"
                  value={b.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={titlePh}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-0.5 block text-[10px] text-text-muted">Descripcion</label>
              <textarea
                value={b.desc}
                onChange={(e) => update(i, { desc: e.target.value })}
                rows={2}
                placeholder={descPh}
                className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
              />
            </div>

            {missing.length > 0 && (
              <p className="mt-1 text-[10px] text-amber-300/80">Falta completar: {missing.join(", ")}.</p>
            )}
          </div>
        );
      })}

      <AddButton onClick={add} />
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      <Plus size={12} /> Agregar beneficio
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
      <Sparkles size={20} className="mx-auto mb-2 text-text-muted" />
      <p className="text-[11px] text-text-secondary">Sin beneficios cargados</p>
      <p className="mt-0.5 text-[10px] text-text-muted">
        Cada beneficio aparece como una card en la seccion &quot;Por que elegirnos&quot; del cliente,
        con un icono y un titulo. Recomendado: 3 a 5 items.
      </p>
    </div>
  );
}
