"use client";

import { Plus, Quote, Star } from "lucide-react";
import { ReorderControls, moveItem } from "./reorder-controls";
import { useClientLanguage } from "@/lib/client-language-context";
import { placeholderFor } from "@/lib/dashboard-placeholders";
import { LanguageMismatchWarning } from "../language-mismatch-warning";

export type Testimonial = {
  name: string;
  title: string;
  text: string;
  rating: number;
};

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Editor for `testimonials[]`. The template renders these as a carousel in
 * the Testimonials section (controlled by features.showTestimonials).
 */
export function TestimonialsEditor({
  value,
  onChange,
  fieldIdPrefix = "testimonials",
}: {
  value: Testimonial[] | undefined;
  onChange: (next: Testimonial[] | undefined) => void;
  /** Prefijo para sessionStorage del aviso de mismatch (clientId, normalmente). */
  fieldIdPrefix?: string;
}) {
  const items = value ?? [];
  const lang = useClientLanguage();
  const namePh = placeholderFor(lang, "testimonialName");
  const titlePh = placeholderFor(lang, "testimonialTitle");
  const textPh = placeholderFor(lang, "testimonialText");

  function update(index: number, patch: Partial<Testimonial>) {
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
    onChange([...items, { name: "", title: "", text: "", rating: 5 }]);
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
      {items.map((t, i) => {
        const missing: string[] = [];
        if (!t.name.trim()) missing.push("nombre");
        if (!t.text.trim()) missing.push("texto");
        if (!Number.isFinite(t.rating) || t.rating < 1 || t.rating > 5) missing.push("rating 1-5");

        return (
          <div
            key={i}
            className={`rounded-lg border bg-bg-elevated p-3 ${
              missing.length > 0 ? "border-amber-500/30" : "border-border"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Testimonio {i + 1}
              </span>
              <ReorderControls
                index={i}
                total={items.length}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                onRemove={() => remove(i)}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Nombre</label>
                <input
                  type="text"
                  value={t.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={namePh}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Titulo / Contexto</label>
                <input
                  type="text"
                  value={t.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={titlePh}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-0.5 block text-[10px] text-text-muted">Texto</label>
              <textarea
                value={t.text}
                onChange={(e) => update(i, { text: e.target.value })}
                rows={3}
                placeholder={textPh}
                className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none"
              />
              <LanguageMismatchWarning
                fieldId={`${fieldIdPrefix}:testimonials:${i}:text`}
                text={t.text}
                expected={lang}
              />
            </div>

            <div className="mt-2">
              <label className="mb-1 block text-[10px] text-text-muted">Rating</label>
              <div className="flex items-center gap-1">
                {RATINGS.map((r) => {
                  const filled = r <= t.rating;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update(i, { rating: r })}
                      aria-label={`${r} estrella${r === 1 ? "" : "s"}`}
                      title={`${r} de 5`}
                      className={`rounded p-0.5 transition-colors ${
                        filled ? "text-amber-400" : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      <Star size={14} fill={filled ? "currentColor" : "none"} />
                    </button>
                  );
                })}
                <span className="ml-2 text-[10px] text-text-muted">{t.rating || 0} / 5</span>
              </div>
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
      <Plus size={12} /> Agregar testimonio
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-6 text-center">
      <Quote size={20} className="mx-auto mb-2 text-text-muted" />
      <p className="text-[11px] text-text-secondary">Sin testimonios cargados</p>
      <p className="mt-0.5 text-[10px] text-text-muted">
        Cada testimonio aparece en el carousel de la seccion &quot;Testimonios&quot; con nombre,
        rating y texto. Si dejas la lista vacia se usan los del preset del nicho.
      </p>
    </div>
  );
}
