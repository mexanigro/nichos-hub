"use client";

import { useCallback, useRef, useState } from "react";
import { WizardStep } from "../wizard-step";
import { useT } from "@/lib/i18n";
import type { StepProps } from "@/lib/wizard/wizard-types";
import type { SerializedFile } from "@/lib/builder-storage";

function fileToSerialized(file: File): Promise<SerializedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, dataUrl: reader.result as string });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function LogoUploader({
  label,
  value,
  onChange,
  optional = false,
  optionalLabel = "",
}: {
  label: string;
  value: SerializedFile | null;
  onChange: (v: SerializedFile | null) => void;
  optional?: boolean;
  optionalLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 1_000_000 || !file.type.startsWith("image/")) return;
      const s = await fileToSerialized(file);
      onChange(s);
    },
    [onChange],
  );

  return (
    <div className="wiz-field">
      <label>
        {label}
        {optional && optionalLabel && (
          <span className="opt"> ({optionalLabel})</span>
        )}
      </label>
      {value ? (
        <div className="wiz-upload-preview compact">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.dataUrl} alt={label} />
          <button type="button" className="wiz-upload-remove" onClick={() => onChange(null)}>
            &times;
          </button>
        </div>
      ) : (
        <div
          className={`wiz-upload-zone mini${dragging ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => ref.current?.click()}
        >
          <input
            ref={ref}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            hidden
          />
          <span className="wiz-upload-hint">{label}</span>
        </div>
      )}
    </div>
  );
}

const ACCENT_PRESETS = [
  "#b3522e", "#c8a97e", "#e091c0", "#5a9fd4", "#3e4e2c", "#800020", "#333333",
];

export function StepBranding({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  const hasBranding = data.hasBranding;
  const wantsLiam = data.wantsLiamBranding;

  return (
    <WizardStep title={w.brandingTitle} subtitle={w.brandingSub} errors={errors}>
      <div className="wiz-fields">

        {/* Question 1: ¿Tenés branding? */}
        <div className="wiz-mode-cards">
          <button
            type="button"
            className={`wiz-mode-card${hasBranding === true ? " selected" : ""}`}
            onClick={() => updateField("hasBranding", true)}
          >
            <span className="wiz-mode-title">{w.hasBrandingYes}</span>
          </button>
          <button
            type="button"
            className={`wiz-mode-card${hasBranding === false ? " selected" : ""}`}
            onClick={() => {
              updateField("hasBranding", false);
              updateField("logo", null);
              updateField("logoDark", null);
              updateField("logoBlackWhite", null);
            }}
          >
            <span className="wiz-mode-title">{w.hasBrandingNo}</span>
          </button>
        </div>

        {/* Branch A: tiene branding — pedir logos */}
        {hasBranding === true && (
          <>
            <p className="wiz-note">{w.logoAllNote}</p>

            <LogoUploader
              label={w.logoLightLabel}
              value={data.logo}
              onChange={(v) => updateField("logo", v)}
            />
            <LogoUploader
              label={w.logoDarkLabel}
              value={data.logoDark}
              onChange={(v) => updateField("logoDark", v)}
              optional
              optionalLabel={w.optional}
            />
            <LogoUploader
              label={w.logoBlackWhiteLabel}
              value={data.logoBlackWhite}
              onChange={(v) => updateField("logoBlackWhite", v)}
              optional
              optionalLabel={w.optional}
            />

            <div className="wiz-field">
              <label>{w.accentLabel} <span className="opt">({w.optional})</span></label>
              <div className="wiz-color-row">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`wiz-color-dot${data.accentColor === c ? " active" : ""}`}
                    style={{ background: c }}
                    onClick={() => updateField("accentColor", c)}
                  />
                ))}
                <input
                  type="color"
                  value={data.accentColor || "#b3522e"}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="wiz-color-picker"
                />
              </div>
            </div>
          </>
        )}

        {/* Branch B: no tiene branding — ¿quiere que Liam lo cree? */}
        {hasBranding === false && (
          <>
            <div className="wiz-field-group">
              <p className="wiz-field-label">{w.wantsLiamTitle}</p>
              <div className="wiz-mode-cards">
                <button
                  type="button"
                  className={`wiz-mode-card${wantsLiam === true ? " selected" : ""}`}
                  onClick={() => updateField("wantsLiamBranding", true)}
                >
                  <span className="wiz-mode-title">{w.wantsLiamYes}</span>
                </button>
                <button
                  type="button"
                  className={`wiz-mode-card${wantsLiam === false ? " selected" : ""}`}
                  onClick={() => updateField("wantsLiamBranding", false)}
                >
                  <span className="wiz-mode-title">{w.wantsLiamNo}</span>
                </button>
              </div>
            </div>

            {/* Preferencias de color/estilo (siempre visible cuando no tiene branding) */}
            <div className="wiz-field">
              <label>{w.colorsLabel} <span className="opt">({w.optional})</span></label>
              <input
                type="text"
                value={data.colors}
                onChange={(e) => updateField("colors", e.target.value)}
                placeholder={w.colorsPh}
              />
            </div>
          </>
        )}
      </div>
    </WizardStep>
  );
}
