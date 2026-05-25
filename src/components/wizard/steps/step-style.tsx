"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

const COLOR_SUGGESTIONS = [
  { label: "Gold", value: "gold", swatch: "#c8a97e" },
  { label: "Rose", value: "pink", swatch: "#e091c0" },
  { label: "Black", value: "black", swatch: "#1a1a1a" },
  { label: "Navy", value: "navy", swatch: "#1e3a5f" },
  { label: "Olive", value: "olive", swatch: "#5a6b3c" },
  { label: "Burgundy", value: "burgundy", swatch: "#800020" },
];

export function StepStyle({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.styleTitle} subtitle={w.styleSub} errors={errors}>
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.colorsLabel} <span className="opt">({w.optional})</span></label>
          <input
            type="text"
            value={data.colors}
            onChange={(e) => updateField("colors", e.target.value)}
            placeholder={w.colorsPh}
          />
          <div className="wiz-swatches">
            {COLOR_SUGGESTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`wiz-swatch${data.colors === c.value ? " active" : ""}`}
                onClick={() => updateField("colors", c.value)}
                title={c.label}
              >
                <span className="wiz-swatch-dot" style={{ background: c.swatch }} />
                <span className="wiz-swatch-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="wiz-toggle-field">
          <label className="wiz-toggle">
            <input
              type="checkbox"
              checked={data.logoCreate}
              onChange={(e) => updateField("logoCreate", e.target.checked)}
            />
            <span className="wiz-toggle-track">
              <span className="wiz-toggle-thumb" />
            </span>
            <span className="wiz-toggle-label">{w.logoCreateLabel}</span>
          </label>
          <p className="wiz-hint">{w.logoCreateDesc}</p>
        </div>
      </div>
    </WizardStep>
  );
}
