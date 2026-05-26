"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { WizardNiche } from "@/lib/wizard/wizard-types";

const NICHE_IDS: WizardNiche[] = [
  "barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones", "otro",
];

const NICHE_ICONS: Record<string, React.ReactNode> = {
  barberia: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 21c0 0 2-4 2-10V3" /><path d="M21 21c0 0-2-4-2-10V3" />
      <circle cx="5" cy="3" r="1" fill="currentColor" /><circle cx="19" cy="3" r="1" fill="currentColor" />
      <path d="M12 3v18" /><circle cx="12" cy="3" r="1" fill="currentColor" />
    </svg>
  ),
  estetica: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10" /><path d="M22 12c0 5.52-4.48 10-10 10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="9" r="1" fill="currentColor" />
    </svg>
  ),
  tattoo: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l6-6" /><path d="M14.5 3.5l6 6-9.5 9.5H5v-6z" />
    </svg>
  ),
  nails: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2c-3 0-5 4-5 9s2 11 5 11 5-6 5-11S15 2 12 2z" />
    </svg>
  ),
  cafeteria: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 010 8h-1" /><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
      <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  remodelaciones: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  otro: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="6" cy="12" r="1" fill="currentColor" /><circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};

export function StepNiche({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.nicheTitle} subtitle={w.nicheSub} errors={errors}>
      <p className="wiz-ctx">{w.nicheCtx}</p>
      <div className="wiz-cards-grid">
        {NICHE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            className={`wiz-card${data.niche === id ? " selected" : ""}`}
            onClick={() => {
              updateField("niche", id);
              if (id !== "otro") updateField("customNiche", "");
            }}
          >
            <span className="wiz-card-icon">{NICHE_ICONS[id]}</span>
            <span className="wiz-card-label">{w.niches[id] || id}</span>
          </button>
        ))}
      </div>
      {data.niche === "otro" && (
        <div className="wiz-field" style={{ marginTop: 16 }}>
          <label>{w.customNicheLabel}</label>
          <input
            type="text"
            value={data.customNiche}
            onChange={(e) => updateField("customNiche", e.target.value)}
            placeholder={w.customNichePh}
            autoFocus
          />
        </div>
      )}
    </WizardStep>
  );
}
