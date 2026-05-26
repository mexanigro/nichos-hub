"use client";

import { useCallback, useRef, useState } from "react";
import { WizardStep } from "../wizard-step";
import { WizardHint } from "../wizard-hint";
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
}: {
  label: string;
  value: SerializedFile | null;
  onChange: (v: SerializedFile | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 350_000 || !file.type.startsWith("image/")) return;
      const s = await fileToSerialized(file);
      onChange(s);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="wiz-upload-preview compact">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value.dataUrl} alt={label} />
        <button type="button" className="wiz-upload-remove" onClick={() => onChange(null)}>
          &times;
        </button>
      </div>
    );
  }

  return (
    <div
      className={`wiz-upload-zone mini${dragging ? " drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} hidden />
      <span className="wiz-upload-hint">{label}</span>
    </div>
  );
}

const ACCENT_PRESETS = [
  "#b3522e", "#c8a97e", "#e091c0", "#5a9fd4", "#3e4e2c", "#800020", "#333333",
];

export function StepBrand({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;

  return (
    <WizardStep title={w.brandTitle} subtitle={w.brandSub} errors={errors}>
      <div className="wiz-fields">
        <div className="wiz-brand-logos">
          <div className="wiz-field">
            <label>{w.logoLightLabel}</label>
            <LogoUploader
              label={w.uploadDrop}
              value={data.logo}
              onChange={(v) => updateField("logo", v)}
            />
          </div>
          <div className="wiz-field">
            <label>{w.logoDarkLabel} <span className="opt">({w.optional})</span></label>
            <LogoUploader
              label={w.uploadDrop}
              value={data.logoDark}
              onChange={(v) => updateField("logoDark", v)}
            />
          </div>
        </div>
        <WizardHint k="logo" />

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
          <WizardHint k="accentColor" />
        </div>

        <div className="wiz-field">
          <label>{w.styleKeywords} <span className="opt">({w.optional})</span></label>
          <input
            type="text"
            value={data.colors}
            onChange={(e) => updateField("colors", e.target.value)}
            placeholder={w.colorsPh}
          />
          <WizardHint k="colors" />
        </div>
      </div>
    </WizardStep>
  );
}
