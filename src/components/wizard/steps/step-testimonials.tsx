"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardTestimonial } from "@/lib/wizard/wizard-types";

export function StepTestimonials({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const items: WizardTestimonial[] = data.testimonials || [];

  function update(i: number, patch: Partial<WizardTestimonial>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    updateField("testimonials", next);
  }

  function add() {
    updateField("testimonials", [...items, { name: "", title: "", text: "", rating: 5 }]);
  }

  function remove(i: number) {
    updateField("testimonials", items.filter((_, j) => j !== i));
  }

  return (
    <WizardStep
      title={w.testimonialsTitle || "Testimonios de tus clientes"}
      subtitle={w.testimonialsSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            Si tenés reviews en Google o IG, copialas acá. Si no, podés saltar este paso
            y me las pasás por WhatsApp después.
          </p>
        )}
        {items.map((tm, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field-row">
              <div className="wiz-field">
                <label>{w.testimonialName || "Nombre"}</label>
                <input
                  type="text"
                  value={tm.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Ej: María R."
                />
              </div>
              <div className="wiz-field">
                <label>
                  {w.testimonialRole || "Cómo te conoció"} <span className="opt">({w.optional})</span>
                </label>
                <input
                  type="text"
                  value={tm.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder="Cliente desde 2022"
                />
              </div>
            </div>
            <div className="wiz-field">
              <label>{w.testimonialText || "Lo que dijo"}</label>
              <textarea
                value={tm.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder="El mejor corte que tuve. Atención impecable."
                rows={2}
              />
            </div>
            <div className="wiz-field">
              <label>{w.testimonialRating || "Estrellas"}</label>
              <div className="wiz-rating-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`wiz-star${tm.rating >= n ? " on" : ""}`}
                    onClick={() => update(i, { rating: n })}
                    aria-label={`${n} estrellas`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="wiz-link-btn danger"
              onClick={() => remove(i)}
            >
              {w.benefitRemove || "Eliminar"}
            </button>
          </div>
        ))}
        <button type="button" className="wiz-add-btn" onClick={add}>
          + {w.testimonialAdd || "Agregar testimonio"}
        </button>
      </div>
    </WizardStep>
  );
}
