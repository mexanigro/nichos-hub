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
      if (file.size > 1_000_000 || !file.type.startsWith("image/")) return;
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
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
        if (file.size > 1_000_000 || !file.type.startsWith("image/")) continue;
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="wiz-upload-hint">{addLabel}</span>
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

/* Mini wireframe showing owner card on the website */
function OwnerMockup({ isSolo }: { isSolo: boolean }) {
  return (
    <div className="wiz-mockup" aria-hidden>
      <div className="wiz-mockup-section-title" />
      {isSolo ? (
        <div className="wiz-mockup-owner">
          <div className="wiz-mockup-avatar" />
          <div className="wiz-mockup-owner-text">
            <div className="wiz-mockup-owner-name" />
            <div className="wiz-mockup-owner-role" />
            <div className="wiz-mockup-owner-bio" />
          </div>
        </div>
      ) : (
        <div className="wiz-mockup-team">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wiz-mockup-staff-card">
              <div className="wiz-mockup-avatar small" />
            </div>
          ))}
        </div>
      )}
      <div className="wiz-mockup-label">
        {isSolo ? "Así aparecés en 'Sobre mí' ↑" : "Fotos del equipo en la web ↑"}
      </div>
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
        <p className="wiz-ctx">{w.ownerCtx}</p>
        <OwnerMockup isSolo={false} />
        <div className="wiz-fields">
          <p className="wiz-field-hint">Subí fotos de tu equipo. Se muestran en la sección de presentación de tu web.</p>
          <MultiPhotoUploader
            photos={data.staffPhotos}
            onChange={(v) => updateField("staffPhotos", v)}
            addLabel="Agregar foto del equipo"
          />
        </div>
      </WizardStep>
    );
  }

  return (
    <WizardStep title={w.ownerTitle} subtitle={w.ownerSub} errors={errors}>
      <p className="wiz-ctx">{w.ownerCtx}</p>
      <OwnerMockup isSolo={true} />
      <div className="wiz-owner-layout">
        <div className="wiz-field">
          <label>{w.ownerPhotoLabel} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">Foto tuya, clara y de buena calidad. Preferentemente en formato cuadrado o vertical.</p>
          <PhotoUploader
            value={data.ownerPhoto}
            onChange={(v) => updateField("ownerPhoto", v)}
            placeholder="Tu foto"
          />
        </div>
        <div className="wiz-fields">
          <div className="wiz-field">
            <label>{w.ownerNameLabel} <span className="opt">({w.optional})</span></label>
            <input
              type="text"
              value={data.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="wiz-field">
            <label>{w.ownerRoleLabel} <span className="opt">({w.optional})</span></label>
            <p className="wiz-field-hint">Ej: "Fundador", "Estilista", "Tatuador"</p>
            <input
              type="text"
              value={data.ownerRole}
              onChange={(e) => updateField("ownerRole", e.target.value)}
              placeholder="Tu rol"
            />
          </div>
          <div className="wiz-field">
            <label>{w.ownerBioLabel} <span className="opt">({w.optional})</span></label>
            <p className="wiz-field-hint">1-2 oraciones sobre vos o tu historia. Ejemplo: "10 años cortando en Tel Aviv. Especializado en fade y barba."</p>
            <textarea
              value={data.ownerBio}
              onChange={(e) => updateField("ownerBio", e.target.value)}
              placeholder="Contá algo sobre vos"
              rows={3}
            />
          </div>
        </div>
      </div>
    </WizardStep>
  );
}
