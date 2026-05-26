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
  hint,
  value,
  onChange,
  optional = false,
  optionalLabel = "",
  bg = "light",
}: {
  label: string;
  hint?: string;
  value: SerializedFile | null;
  onChange: (v: SerializedFile | null) => void;
  optional?: boolean;
  optionalLabel?: string;
  bg?: "light" | "dark" | "bw";
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

  const bgStyle: React.CSSProperties =
    bg === "dark" ? { background: "#1a1a1a" } :
    bg === "bw" ? { background: "#f5f5f5", filter: "grayscale(1)" } :
    { background: "#fff" };

  return (
    <div className="wiz-field">
      <label>
        {label}
        {optional && optionalLabel && <span className="opt"> ({optionalLabel})</span>}
      </label>
      {hint && <p className="wiz-field-hint">{hint}</p>}
      {value ? (
        <div className="wiz-logo-preview" style={bgStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.dataUrl} alt={label} />
          <button type="button" className="wiz-upload-remove" onClick={() => onChange(null)}>
            &times;
          </button>
        </div>
      ) : (
        <div
          className={`wiz-upload-zone logo-zone${bg === "dark" ? " dark-bg" : ""}${dragging ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => ref.current?.click()}
        >
          <input
            ref={ref}
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            hidden
          />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="wiz-upload-hint">{label}</span>
        </div>
      )}
    </div>
  );
}

const ACCENT_PRESETS = [
  "#b3522e", "#c8a97e", "#e091c0", "#5a9fd4", "#3e4e2c", "#800020", "#333333",
];

/* Mini mockup showing logo placement in a website header */
function LogoPlacementMockup() {
  return (
    <div className="wiz-mockup" aria-hidden>
      <div className="wiz-mockup-bar">
        <div className="wiz-mockup-logo-spot" />
        <div className="wiz-mockup-nav">
          <span /><span /><span />
        </div>
      </div>
      <div className="wiz-mockup-hero">
        <div className="wiz-mockup-hero-text">
          <div className="wiz-mockup-h1" />
          <div className="wiz-mockup-sub" />
        </div>
      </div>
      <div className="wiz-mockup-footer">
        <div className="wiz-mockup-logo-spot small" />
      </div>
      <div className="wiz-mockup-label">Tu logo aparece acá ↑</div>
    </div>
  );
}

export function StepBranding({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  const hasBranding = data.hasBranding;
  const wantsLiam = data.wantsLiamBranding;

  return (
    <WizardStep title={w.brandingTitle} subtitle={w.brandingSub} errors={errors}>
      <div className="wiz-fields">

        <LogoPlacementMockup />

        {/* Pregunta 1: ¿Tenés branding? */}
        <div className="wiz-cards-row">
          <button
            type="button"
            className={`wiz-card-lg${hasBranding === true ? " selected" : ""}`}
            onClick={() => updateField("hasBranding", true)}
          >
            <span className="wiz-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </span>
            <span className="wiz-card-title">{w.hasBrandingYes}</span>
            <span className="wiz-card-desc">{w.hasBrandingDesc}</span>
          </button>

          <button
            type="button"
            className={`wiz-card-lg${hasBranding === false ? " selected" : ""}`}
            onClick={() => {
              updateField("hasBranding", false);
              updateField("logo", null);
              updateField("logoDark", null);
              updateField("logoBlackWhite", null);
            }}
          >
            <span className="wiz-card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
            </span>
            <span className="wiz-card-title">{w.hasBrandingNo}</span>
            <span className="wiz-card-desc">{w.hasBrandingNoDesc}</span>
          </button>
        </div>

        {/* Rama A: tiene branding → pedir logos */}
        {hasBranding === true && (
          <>
            <p className="wiz-note">{w.logoAllNote}</p>

            <LogoUploader
              label={w.logoLightLabel}
              hint="Ejemplo: logo sobre fondo blanco o beige"
              value={data.logo}
              onChange={(v) => updateField("logo", v)}
              bg="light"
            />
            <LogoUploader
              label={w.logoDarkLabel}
              hint="Ejemplo: logo en blanco o dorado sobre fondo oscuro"
              value={data.logoDark}
              onChange={(v) => updateField("logoDark", v)}
              optional
              optionalLabel={w.optional}
              bg="dark"
            />
            <LogoUploader
              label={w.logoBlackWhiteLabel}
              hint="Para documentos, sellos o cuando no hay color disponible"
              value={data.logoBlackWhite}
              onChange={(v) => updateField("logoBlackWhite", v)}
              optional
              optionalLabel={w.optional}
              bg="bw"
            />

            <div className="wiz-field">
              <label>{w.accentLabel} <span className="opt">({w.optional})</span></label>
              <p className="wiz-field-hint">El color principal de tu marca — botones, highlights, links</p>
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

        {/* Rama B: no tiene branding → ¿quiere que lo creemos? */}
        {hasBranding === false && (
          <div className="wiz-fields">
            <p className="wiz-field-label">{w.wantsLiamTitle}</p>

            <div className="wiz-cards-row">
              <button
                type="button"
                className={`wiz-card-lg${wantsLiam === true ? " selected" : ""}`}
                onClick={() => updateField("wantsLiamBranding", true)}
              >
                <span className="wiz-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </span>
                <span className="wiz-card-title">{w.wantsLiamYes}</span>
                <span className="wiz-card-desc">{w.wantsLiamDesc}</span>
              </button>

              <button
                type="button"
                className={`wiz-card-lg${wantsLiam === false ? " selected" : ""}`}
                onClick={() => updateField("wantsLiamBranding", false)}
              >
                <span className="wiz-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <span className="wiz-card-title">{w.wantsLiamNo}</span>
                <span className="wiz-card-desc">{w.wantsLiamNoDesc}</span>
              </button>
            </div>

            <div className="wiz-field">
              <label>{w.colorsLabel} <span className="opt">({w.optional})</span></label>
              <p className="wiz-field-hint">Colores, palabras o referencias de estilo que te gusten. Cualquier pista ayuda.</p>
              <input
                type="text"
                value={data.colors}
                onChange={(e) => updateField("colors", e.target.value)}
                placeholder={w.colorsPh}
              />
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
}
