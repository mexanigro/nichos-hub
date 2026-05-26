"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

export function StepMode({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.modeTitle} subtitle={w.modeSub} errors={errors}>
      <p className="wiz-ctx">{w.modeCtx}</p>
      <div className="wiz-cards-row">
        <button
          type="button"
          className={`wiz-card-lg${data.businessMode === "solo" ? " selected" : ""}`}
          onClick={() => updateField("businessMode", "solo")}
        >
          <span className="wiz-card-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span className="wiz-card-title">{w.solo}</span>
          <span className="wiz-card-desc">{w.soloDesc}</span>
        </button>

        <button
          type="button"
          className={`wiz-card-lg${data.businessMode === "team" ? " selected" : ""}`}
          onClick={() => updateField("businessMode", "team")}
        >
          <span className="wiz-card-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </span>
          <span className="wiz-card-title">{w.team}</span>
          <span className="wiz-card-desc">{w.teamDesc}</span>
        </button>
      </div>
    </WizardStep>
  );
}
