"use client";

import { useCallback, useEffect, useRef } from "react";
import { Upload, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { BuilderData } from "./builder-section";

interface Props {
  data: BuilderData;
  update: (partial: Partial<BuilderData>) => void;
}

function DropZone({
  label,
  files,
  onChange,
  onRemove,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useT();
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = files.map((f) => URL.createObjectURL(f));
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      onChange([...files, ...newFiles]);
    },
    [files, onChange],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      onChange([...files, ...newFiles]);
      e.target.value = "";
    },
    [files, onChange],
  );

  return (
    <div>
      <span className="mb-2 block text-[0.85rem] font-medium text-[var(--l-text)]">
        {label}
      </span>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative rounded-[var(--l-radius-sm)] border-2 border-dashed border-[var(--l-border)] p-7 text-center transition-colors duration-200 hover:border-[var(--l-accent)]"
      >
        <Upload size={20} className="mx-auto mb-2 text-[var(--l-text-3)]" />
        <p className="text-[0.82rem] text-[var(--l-text-3)]">{t.builder.photos.dragDrop}</p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((_, i) => (
            <div
              key={i}
              className="group relative h-16 w-16 overflow-hidden rounded-[8px] border border-[var(--l-border)]"
            >
              <img
                src={urlsRef.current[i]}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => onRemove(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepPhotos({ data, update }: Props) {
  const { t } = useT();

  return (
    <div>
      <h3
        style={{ fontFamily: "var(--l-display)" }}
        className="mb-1.5 text-[0.95rem] font-semibold text-[var(--l-text)]"
      >
        {t.builder.photos.title}
      </h3>
      <p className="mb-5 text-[0.85rem] text-[var(--l-text-2)]">
        {t.builder.photos.subtitle}
      </p>

      <div className="space-y-5">
        <DropZone
          label={t.builder.photos.business}
          files={data.photos}
          onChange={(photos) => update({ photos })}
          onRemove={(i) => update({ photos: data.photos.filter((_, idx) => idx !== i) })}
        />
        <DropZone
          label={t.builder.photos.staff}
          files={data.staffPhotos}
          onChange={(staffPhotos) => update({ staffPhotos })}
          onRemove={(i) =>
            update({ staffPhotos: data.staffPhotos.filter((_, idx) => idx !== i) })
          }
        />
      </div>
    </div>
  );
}
