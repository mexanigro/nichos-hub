"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

/* Mini wireframe showing where name/tagline appear in the page */
function BusinessMockup() {
  return (
    <div className="wiz-mockup" aria-hidden>
      <div className="wiz-mockup-bar">
        <div className="wiz-mockup-logo-spot" />
        <div className="wiz-mockup-nav"><span /><span /><span /></div>
      </div>
      <div className="wiz-mockup-hero">
        <div className="wiz-mockup-hero-text">
          <div className="wiz-mockup-h1 accent-line" />
          <div className="wiz-mockup-sub" />
          <div className="wiz-mockup-btn" />
        </div>
      </div>
      <div className="wiz-mockup-label">Nombre y slogan van acá ↑</div>
    </div>
  );
}

export function StepBusiness({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.businessTitle} subtitle={w.businessSub} errors={errors}>
      <BusinessMockup />
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.businessNameLabel} *</label>
          <p className="wiz-field-hint">Aparece en el encabezado y en el título principal de tu web.</p>
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            placeholder={w.businessNamePh}
            autoFocus
          />
        </div>

        <div className="wiz-field">
          <label>{w.taglineLabel} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">Una frase corta debajo del nombre. Ej: "Cortes que hablan por vos" · "Belleza sin apuros"</p>
          <input
            type="text"
            value={data.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            placeholder={w.taglinePh}
          />
        </div>

        <div className="wiz-field">
          <label>{w.descLabel} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">Qué hace tu negocio, qué lo hace especial. Aparece en la sección de presentación.</p>
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
