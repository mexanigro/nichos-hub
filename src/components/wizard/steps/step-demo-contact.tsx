"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

/**
 * Step final del wizard /free — captura el lead para que Liam pueda contactar.
 * Sin esto, las demos se quedan en el browser del prospect y no se persisten.
 *
 * Email es obligatorio (sin email, no podemos enviar la demo final). WhatsApp
 * es opcional pero recomendado.
 */
export function StepDemoContact({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep
      title={w.demoContactTitle}
      subtitle={w.demoContactSub}
      errors={errors}
    >
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.emailLabel}</label>
          <input
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder={w.demoEmailPh || "hello@mybusiness.com"}
            autoFocus
            required
          />
          <p className="wiz-hint">{w.demoEmailHint}</p>
        </div>

        <div className="wiz-field">
          <label>
            {w.whatsappLabel} <span className="opt">({w.optional})</span>
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={data.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            placeholder="+972 50 000 0000"
          />
          <p className="wiz-hint">{w.demoWhatsappHint}</p>
        </div>
      </div>
    </WizardStep>
  );
}
