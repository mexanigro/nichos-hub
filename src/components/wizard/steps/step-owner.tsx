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

function PhotoUploader({
  value,
  onChange,
  placeholder,
}: {
  value: SerializedFile | null;
  onChange: (v: SerializedFile | null) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 500_000 || !file.type.startsWith("image/")) return;
      const s = await fileToSerialized(file);
      onChange(s);
    },
    [onChange],
  );

  if (value) {
    return (
      <div className="wiz-photo-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value.dataUrl} alt="Photo" />
        <button type="button" className="wiz-upload-remove" onClick={() => onChange(null)}>
          &times;
        </button>
      </div>
    );
  }

  return (
    <div
      className={`wiz-upload-zone mini circle${dragging ? " drag" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} hidden />
      <span className="wiz-upload-hint">{placeholder}</span>
    </div>
  );
}

function MultiPhotoUploader({
  photos,
  onChange,
  addLabel,
}: {
  photos: SerializedFile[];
  onChange: (v: SerializedFile[]) => void;
  addLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList) => {
      const newPhotos: SerializedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 500_000 || !file.type.startsWith("image/")) continue;
        const s = await fileToSerialized(file);
        newPhotos.push(s);
      }
      onChange([...photos, ...newPhotos]);
    },
    [photos, onChange],
  );

  return (
    <div className="wiz-multi-photos">
      <div className="wiz-photo-grid">
        {photos.map((p, i) => (
          <div key={i} className="wiz-photo-preview small">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.dataUrl} alt={`Photo ${i + 1}`} />
            <button
              type="button"
              className="wiz-upload-remove"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
            >
              &times;
            </button>
          </div>
        ))}
        <button
          type="button"
          className="wiz-upload-zone mini"
          onClick={() => ref.current?.click()}
        >
          <span className="wiz-upload-hint">+ {addLabel}</span>
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
        hidden
      />
    </div>
  );
}

export function StepOwner({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const isSolo = data.businessMode === "solo";

  if (!isSolo) {
    return (
      <WizardStep title={w.staffPhotos} subtitle={w.ownerSub} errors={errors}>
        <div className="wiz-fields">
          <MultiPhotoUploader
            photos={data.staffPhotos}
            onChange={(v) => updateField("staffPhotos", v)}
            addLabel={w.ownerPhotoLabel}
          />
        </div>
      </WizardStep>
    );
  }

  return (
    <WizardStep title={w.ownerTitle} subtitle={w.ownerSub} errors={errors}>
      <div className="wiz-owner-layout">
        <PhotoUploader
          value={data.ownerPhoto}
          onChange={(v) => updateField("ownerPhoto", v)}
          placeholder={w.ownerPhotoLabel}
        />
        <div className="wiz-fields">
          <div className="wiz-field">
            <label>{w.ownerNameLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              placeholder={w.ownerNameLabel}
            />
          </div>
          <div className="wiz-field">
            <label>{w.ownerRoleLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.ownerRole}
              onChange={(e) => updateField("ownerRole", e.target.value)}
              placeholder={w.ownerRoleLabel}
            />
          </div>
          <div className="wiz-field">
            <label>{w.ownerBioLabel} <span className="opt">({w.optional})</span></label>
            <textarea
              value={data.ownerBio}
              onChange={(e) => updateField("ownerBio", e.target.value)}
              placeholder={w.ownerBioLabel}
              rows={3}
            />
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
