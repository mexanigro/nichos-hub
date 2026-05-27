"use client";

import { WizardStep } from "../wizard-step";
import { WizardRefImage } from "../wizard-ref-image";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardBenefit } from "@/lib/wizard/wizard-types";

const ICON_PRESETS = ["Award", "Star", "Heart", "Shield", "Clock", "Users", "Sparkles", "Zap"];

export function StepBenefits({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const items: WizardBenefit[] = data.benefits || [];

  function update(i: number, patch: Partial<WizardBenefit>) {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    updateField("benefits", next);
  }

  function add() {
    updateField("benefits", [...items, { title: "", desc: "", iconName: "Star" }]);
  }

  function remove(i: number) {
    updateField("benefits", items.filter((_, j) => j !== i));
  }

  return (
    <WizardStep
      title={w.benefitsTitle || "Why do they choose you?"}
      subtitle={w.benefitsSub || ""}
      errors={errors}
    >
      <div className="wiz-fields">
        <WizardRefImage data={data} stepKey="benefits" />
        {items.length === 0 && (
          <p className="wiz-hint" style={{ marginBottom: 8 }}>
            {w.benefitsEmptyHint ||
              "Your site can show 3 to 5 reasons to trust you. Leave it empty and I'll use a generic set for your niche."}
          </p>
        )}
        {items.map((b, i) => (
          <div key={i} className="wiz-list-item">
            <div className="wiz-field">
              <label>{w.benefitTitle || "Title"}</label>
              <input
                type="text"
                value={b.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder={w.benefitTitlePh || "Ex: 15 years of experience"}
              />
            </div>
            <div className="wiz-field">
              <label>{w.benefitDesc || "Short description"}</label>
              <input
                type="text"
                value={b.desc}
                onChange={(e) => update(i, { desc: e.target.value })}
                placeholder={w.benefitDescPh || "One line on why it matters."}
              />
            </div>
            <div className="wiz-field">
              <label>{w.benefitIcon || "Icon"}</label>
              <select
                value={b.iconName}
                onChange={(e) => update(i, { iconName: e.target.value })}
              >
                {ICON_PRESETS.map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
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
          + {w.benefitAdd || "Add benefit"}
        </button>
      </div>
    </WizardStep>
  );
}
