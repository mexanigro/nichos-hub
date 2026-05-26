"use client";

import { WizardStep } from "../wizard-step";
import { WizardHint } from "../wizard-hint";
import { FieldError, useFieldValidation } from "../field-error";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

export function StepContact({ data, updateField, errors, variant }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const showFull = variant === "paid";

  // Validacion inline: muestra error solo despues del primer blur, no
  // mientras el usuario esta escribiendo (no asusta).
  const emailField = useFieldValidation(data.email, (v) => {
    if (v && !v.includes("@")) return "Falta el @ en tu email.";
    if (v && v.length < 5) return "Email muy corto.";
    return null;
  });

  const whatsappField = useFieldValidation(data.whatsapp, (v) => {
    if (v && v.replace(/\D/g, "").length < 7) return "Faltan dígitos. Incluí el código del país.";
    return null;
  });

  return (
    <WizardStep title={w.contactTitle} subtitle={w.contactSub} errors={errors}>
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.whatsappLabel}</label>
          <input
            type="tel"
            inputMode="tel"
            value={data.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            onBlur={whatsappField.onBlur}
            placeholder="+972 50 000 0000"
          />
          <FieldError message={whatsappField.error} />
          {!whatsappField.error && <WizardHint k="whatsapp" />}
        </div>

        <div className="wiz-field">
          <label>{w.emailLabel}</label>
          <input
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={emailField.onBlur}
            placeholder="hello@mybusiness.com"
          />
          <FieldError message={emailField.error} />
          {!emailField.error && <WizardHint k="email" />}
        </div>

        {showFull && (
          <div className="wiz-field">
            <label>{w.phoneLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="tel"
              inputMode="tel"
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+972 50 000 0000"
            />
          </div>
        )}

        <div className="wiz-field">
          <label>{w.instagramLabel} <span className="opt">({w.optional})</span></label>
          <input
            type="text"
            inputMode="url"
            value={data.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="@yourbusiness"
          />
        </div>

        {showFull && (
          <div className="wiz-field">
            <label>{w.facebookLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              inputMode="url"
              value={data.facebook}
              onChange={(e) => updateField("facebook", e.target.value)}
              placeholder="facebook.com/yourbusiness"
            />
          </div>
        )}

        <div className="wiz-field">
          <label>{w.addressLabel} <span className="opt">({w.optional})</span></label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder={w.addressLabel}
          />
          <WizardHint k="address" />
        </div>

        {showFull && (
          <div className="wiz-field-row">
            <div className="wiz-field">
              <label>{w.districtLabel}</label>
              <input
                type="text"
                value={data.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder={w.districtLabel}
              />
            </div>
            <div className="wiz-field">
              <label>{w.cityLabel}</label>
              <input
                type="text"
                value={data.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder={w.cityLabel}
              />
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
