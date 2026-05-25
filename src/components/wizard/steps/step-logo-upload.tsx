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

export function StepLogoUpload({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 350_000) return;
      if (!file.type.startsWith("image/")) return;
      const serialized = await fileToSerialized(file);
      updateField("logo", serialized);
    },
    [updateField],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <WizardStep title={w.logoTitle} subtitle={w.logoSub} errors={errors}>
      {data.logo ? (
        <div className="wiz-upload-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.logo.dataUrl} alt="Logo preview" />
          <div className="wiz-upload-meta">
            <span className="wiz-upload-name">{data.logo.name}</span>
            <button
              type="button"
              className="wiz-upload-remove"
              onClick={() => updateField("logo", null)}
            >
              {w.uploadRemove}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`wiz-upload-zone${dragging ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} hidden />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="wiz-upload-icon">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="wiz-upload-hint">{w.uploadDrop}</p>
          <p className="wiz-upload-formats">{w.uploadHint}</p>
        </div>
      )}
    </WizardStep>
  );
}
