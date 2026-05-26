"use client";

import { useCallback, useRef } from "react";
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

/* Mini wireframe showing where hero image and gallery appear on the page */
function GalleryMockup() {
  return (
    <div className="wiz-mockup" aria-hidden>
      <div className="wiz-mockup-bar">
        <div className="wiz-mockup-logo-spot" />
        <div className="wiz-mockup-nav"><span /><span /><span /></div>
      </div>
      {/* Hero */}
      <div className="wiz-mockup-hero full">
        <div className="wiz-mockup-hero-label">Imagen principal →</div>
        <div className="wiz-mockup-hero-text">
          <div className="wiz-mockup-h1" />
          <div className="wiz-mockup-sub" />
          <div className="wiz-mockup-btn" />
        </div>
      </div>
      {/* Gallery grid */}
      <div className="wiz-mockup-gallery">
        <div className="wiz-mockup-gallery-label">← Galería</div>
        <div /><div /><div /><div />
      </div>
    </div>
  );
}

export function StepGallery({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const heroRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleHero = useCallback(
    async (file: File) => {
      if (file.size > 2_000_000 || !file.type.startsWith("image/")) return;
      const s = await fileToSerialized(file);
      updateField("heroImage", s);
    },
    [updateField],
  );

  const handleGallery = useCallback(
    async (files: FileList) => {
      const newPhotos: SerializedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 2_000_000 || !file.type.startsWith("image/")) continue;
        const s = await fileToSerialized(file);
        newPhotos.push(s);
      }
      updateField("galleryImages", [...data.galleryImages, ...newPhotos]);
    },
    [data.galleryImages, updateField],
  );

  return (
    <WizardStep title={w.galleryTitle} subtitle={w.gallerySub} errors={errors}>
      <div className="wiz-fields">
        <p className="wiz-note">{w.galleryCtx}</p>

        <GalleryMockup />

        {/* Hero image */}
        <div className="wiz-field">
          <label>{w.heroImage} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">{w.heroUploadHint}</p>
          {data.heroImage ? (
            <div className="wiz-upload-preview wide">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.heroImage.dataUrl} alt="Hero" />
              <button
                type="button"
                className="wiz-upload-remove"
                onClick={() => updateField("heroImage", null)}
              >
                &times;
              </button>
            </div>
          ) : (
            <div
              className="wiz-upload-zone hero-zone"
              onClick={() => heroRef.current?.click()}
            >
              <input
                ref={heroRef}
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHero(f); }}
                hidden
              />
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="wiz-upload-hint">Imagen principal de tu web</span>
              <span className="wiz-upload-formats">JPG o PNG · recomendado 1920×1080px o más</span>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="wiz-field">
          <label>{w.galleryImages} <span className="opt">({w.optional})</span></label>
          <p className="wiz-field-hint">{w.galleryUploadHint}</p>
          <div className="wiz-photo-grid">
            {data.galleryImages.map((p, i) => (
              <div key={i} className="wiz-photo-preview small">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.dataUrl} alt={`Gallery ${i + 1}`} />
                <button
                  type="button"
                  className="wiz-upload-remove"
                  onClick={() =>
                    updateField("galleryImages", data.galleryImages.filter((_, j) => j !== i))
                  }
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              className="wiz-upload-zone mini"
              onClick={() => galleryRef.current?.click()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="wiz-upload-hint">Agregar foto</span>
            </button>
          </div>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) handleGallery(e.target.files);
              e.target.value = "";
            }}
            hidden
          />
        </div>
      </div>
    </WizardStep>
  );
}
