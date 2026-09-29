"use client";

import { useState } from "react";
import { Plus, Quote, Star } from "lucide-react";
import { ReorderControls, moveItem } from "./reorder-controls";
import { useClientLanguage } from "@/lib/client-language-context";
import { placeholderFor } from "@/lib/dashboard-placeholders";
import { LanguageMismatchWarning } from "../language-mismatch-warning";
import { SelectorIdioma } from "../selector-idioma";
import { aplicarTextoIdioma, leerTextoIdioma } from "@/lib/textos-idioma";
import type { ClientLanguage } from "@/lib/client-language";

export type Testimonial = {
  /** IDIOMAS-01: el texto de otro idioma se ata a este id (`translations.<lang>.testimonials.<id>`). */
  id?: string;
  name: string;
  /** Servicio que reseña (se traduce por idioma, como el texto). */
  service?: string;
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
  config,
  setConfig,
}: {
  value: Testimonial[] | undefined;
  onChange: (next: Testimonial[] | undefined) => void;
  /** Prefijo para sessionStorage del aviso de mismatch (clientId, normalmente). */
  fieldIdPrefix?: string;
  /** IDIOMAS-01: con el config entero, la casilla edita también el texto de los otros idiomas. */
  config?: Record<string, unknown>;
  setConfig?: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
}) {
  const items = value ?? [];
  const lang = useClientLanguage();
  const namePh = placeholderFor(lang, "testimonialName");
  const titlePh = placeholderFor(lang, "testimonialTitle");
  const textPh = placeholderFor(lang, "testimonialText");
  const [idioma, setIdioma] = useState<ClientLanguage>(lang);
  const otro = idioma !== lang && !!config && !!setConfig;
  /** El texto de `campo` en el idioma que se edita: el de la raíz en el base; el de la capa (o vacío = pendiente) en otro. */
  const texto = (t: Testimonial, campo: "name" | "title" | "text" | "service") =>
    otro ? leerTextoIdioma(config, { seccion: "testimonials", id: t.id ?? "", campo, idioma, base: lang }) : (t[campo] ?? "");
  function escribir(i: number, campo: "title" | "text" | "service", valor: string) {
    const id = items[i].id;
    if (!otro) return update(i, { [campo]: valor });
    if (id) setConfig!((prev) => aplicarTextoIdioma(prev, { seccion: "testimonials", id, campo, valor, idioma, base: lang }));
  }

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
    onChange([...items, { id: `r-${Date.now().toString(36)}`, name: "", title: "", text: "", rating: 5 }]);
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
      {config && setConfig && (
        <SelectorIdioma idioma={idioma} base={lang} onCambio={setIdioma} conCapa={(code) => !!(config.translations as Record<string, Record<string, unknown>> | undefined)?.[code]?.testimonials} />
      )}
      {otro && (
        <p className="text-[10px] text-text-muted">
          Texto en otro idioma: lo vacío queda pendiente y la web muestra el original. El nombre, el id y el rating son los mismos en los cuatro idiomas.
        </p>
      )}
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
                  disabled={otro}
                  placeholder={namePh}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">ID</label>
                <input
                  type="text"
                  value={t.id ?? ""}
                  onChange={(e) => update(i, { id: e.target.value || undefined })}
                  disabled={otro}
                  placeholder="r1"
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 font-mono text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Titulo / Contexto</label>
                <input
                  type="text"
                  value={texto(t, "title")}
                  onChange={(e) => escribir(i, "title", e.target.value)}
                  disabled={otro && !t.id}
                  placeholder={otro ? t.title : titlePh}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[10px] text-text-muted">Servicio</label>
                <input
                  type="text"
                  value={texto(t, "service")}
                  onChange={(e) => escribir(i, "service", e.target.value)}
                  disabled={otro && !t.id}
                  placeholder={otro ? t.service : ""}
                  className="w-full rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div className="mt-2">
              <label className="mb-0.5 block text-[10px] text-text-muted">Texto</label>
              <textarea
                value={texto(t, "text")}
                onChange={(e) => escribir(i, "text", e.target.value)}
                disabled={otro && !t.id}
                rows={3}
                placeholder={otro ? t.text : textPh}
                className="w-full resize-none rounded border border-border bg-bg-card px-2 py-1 text-xs text-text placeholder:text-text-muted/40 focus:border-accent focus:outline-none disabled:opacity-60"
              />
              <LanguageMismatchWarning
                fieldId={`${fieldIdPrefix}:testimonials:${i}:text${otro ? `:${idioma}` : ""}`}
                text={texto(t, "text")}
                expected={idioma}
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
