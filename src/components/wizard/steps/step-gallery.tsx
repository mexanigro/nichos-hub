"use client";

import { useCallback, useRef } from "react";
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

export function StepGallery({ data, updateField, errors }: StepProps) {
  const { t } = useT();
  const w = t.wizard;
  const heroRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleHero = useCallback(
    async (file: File) => {
      if (file.size > 500_000 || !file.type.startsWith("image/")) return;
      const s = await fileToSerialized(file);
      updateField("heroImage", s);
    },
    [updateField],
  );

  const handleGallery = useCallback(
    async (files: FileList) => {
      const newPhotos: SerializedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 500_000 || !file.type.startsWith("image/")) continue;
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
        <div className="wiz-field">
          <label>{w.heroImage} <span className="opt">({w.optional})</span></label>
          <WizardHint k="heroImage" />
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
            <div className="wiz-upload-zone" onClick={() => heroRef.current?.click()}>
              <input
                ref={heroRef}
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHero(f); }}
                hidden
              />
              <span className="wiz-upload-hint">{w.uploadDrop}</span>
            </div>
          )}
        </div>

        <div className="wiz-field">
          <label>{w.galleryImages} <span className="opt">({w.optional})</span></label>
          <WizardHint k="galleryImages" />
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
              <span className="wiz-upload-hint">+ {w.galleryImages}</span>
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
