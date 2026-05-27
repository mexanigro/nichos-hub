"use client";

import { WizardStep } from "../wizard-step";
import { WizardRefImage } from "../wizard-ref-image";
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
      title={w.testimonialsTitle || "Customer testimonials"}
      subtitle={w.testimonialsSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        <WizardRefImage data={data} stepKey="testimonials" />
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            {w.testimonialsEmptyHint ||
              "If you have Google or IG reviews, paste them here. Or skip and send them by WhatsApp later."}
          </p>
        )}
        {items.map((tm, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field-row">
              <div className="wiz-field">
                <label>{w.testimonialName || "Name"}</label>
                <input
                  type="text"
                  value={tm.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder={w.testimonialNamePh || "Ex: Maria R."}
                />
              </div>
              <div className="wiz-field">
                <label>
                  {w.testimonialRole || "How they found you"} <span className="opt">({w.optional})</span>
                </label>
                <input
                  type="text"
                  value={tm.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder={w.testimonialRolePh || "Customer since 2022"}
                />
              </div>
            </div>
            <div className="wiz-field">
              <label>{w.testimonialText || "What they said"}</label>
              <textarea
                value={tm.text}
                onChange={(e) => update(i, { text: e.target.value })}
                placeholder={w.testimonialTextPh || "Best haircut I've had. Outstanding service."}
                rows={2}
              />
            </div>
            <div className="wiz-field">
              <label>{w.testimonialRating || "Stars"}</label>
              <div className="wiz-rating-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`wiz-star${tm.rating >= n ? " on" : ""}`}
                    onClick={() => update(i, { rating: n })}
                    aria-label={`${n} ${w.testimonialRating || "stars"}`}
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
              {w.listRemove || w.benefitRemove || "Remove"}
            </button>
          </div>
        ))}
        <button type="button" className="wiz-add-btn" onClick={add}>
          + {w.testimonialAdd || "Add testimonial"}
        </button>
      </div>
    </WizardStep>
  );
}
