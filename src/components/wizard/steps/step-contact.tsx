"use client";

import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";

export function StepContact({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.contactTitle} subtitle={w.contactSub} errors={errors}>
      <p className="wiz-ctx">{w.contactCtx}</p>
      <div className="wiz-fields">
        <div className="wiz-field">
          <label>{w.whatsappLabel}</label>
          <p className="wiz-field-hint">El botón de WhatsApp de tu web abre una conversación directo con este número.</p>
          <input
            type="tel"
            inputMode="tel"
            value={data.whatsapp}
            onChange={(e) => updateField("whatsapp", e.target.value)}
            placeholder="+972 50 000 0000"
          />
        </div>

        <div className="wiz-field">
          <label>{w.emailLabel}</label>
          <p className="wiz-field-hint">Para clientes que prefieren escribir por email.</p>
          <input
            type="email"
            inputMode="email"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="hello@minegocio.com"
          />
        </div>

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

        <div className="wiz-field">
          <label>{w.instagramLabel} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">Tu perfil se linkea en el footer y en los botones de redes de tu web.</p>
          <input
            type="text"
            inputMode="url"
            value={data.instagram}
            onChange={(e) => updateField("instagram", e.target.value)}
            placeholder="@tunegocio"
          />
        </div>

        <div className="wiz-field">
          <label>{w.facebookLabel} <span className="opt">({w.optional})</span></label>
          <input
            type="text"
            inputMode="url"
            value={data.facebook}
            onChange={(e) => updateField("facebook", e.target.value)}
            placeholder="facebook.com/tunegocio"
          />
        </div>

        <div className="wiz-field">
          <label>{w.addressLabel} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">Aparece en la sección de contacto con un mapa integrado.</p>
          <input
            type="text"
            value={data.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Calle, número, piso"
          />
        </div>

        <div className="wiz-field-row">
          <div className="wiz-field">
            <label>{w.districtLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.district}
              onChange={(e) => updateField("district", e.target.value)}
              placeholder={w.districtLabel}
            />
          </div>
          <div className="wiz-field">
            <label>{w.cityLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder={w.cityLabel}
            />
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
