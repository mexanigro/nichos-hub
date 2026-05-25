"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

export function StepBusiness({ data, updateField, errors, variant }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const showTagline = variant === "paid";

  return (
    <WizardStep title={w.businessTitle} subtitle={w.businessSub} errors={errors}>
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.businessNameLabel} *</label>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            placeholder={w.businessNamePh}
            autoFocus
          />
        </div>

        {showTagline && (
          <div className="wiz-field">
            <label>{w.taglineLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder={w.taglinePh}
            />
          </div>
        )}

        <div className="wiz-field">
          <label>{w.descLabel} <span className="opt">({w.optional})</span></label>
          <textarea
            value={data.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder={w.descPh}
            rows={3}
          />
        </div>
      </div>
    </WizardStep>
  );
}
