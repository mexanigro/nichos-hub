"use client";

import { WizardStep } from "../wizard-step";
import { WizardRefImage } from "../wizard-ref-image";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardFaq } from "@/lib/wizard/wizard-types";

export function StepFaq({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const items: WizardFaq[] = data.faqItems || [];

  function update(i: number, patch: Partial<WizardFaq>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    updateField("faqItems", next);
  }

  function add() {
    updateField("faqItems", [...items, { q: "", a: "" }]);
  }

  function remove(i: number) {
    updateField("faqItems", items.filter((_, j) => j !== i));
  }

  return (
    <WizardStep
      title={w.faqTitle || "Frequently asked questions"}
      subtitle={w.faqSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        <WizardRefImage data={data} stepKey="faq" />
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            {w.faqEmptyHint ||
              "Think of the 3-5 questions you always get on WhatsApp before someone books. If you leave it empty, I'll write a generic set."}
          </p>
        )}
        {items.map((f, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field">
              <label>{w.faqQuestion || "Question"}</label>
              <input
                type="text"
                value={f.q}
                onChange={(e) => update(i, { q: e.target.value })}
                placeholder={w.faqQuestionPh || "Ex: Do I need to book in advance?"}
              />
            </div>
            <div className="wiz-field">
              <label>{w.faqAnswer || "Answer"}</label>
              <textarea
                value={f.a}
                onChange={(e) => update(i, { a: e.target.value })}
                placeholder={w.faqAnswerPh || "Recommended, but we also take walk-ins if there's availability."}
                rows={2}
              />
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
          + {w.faqAdd || "Add question"}
        </button>
      </div>
    </WizardStep>
  );
}
