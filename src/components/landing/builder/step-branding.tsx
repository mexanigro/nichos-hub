"use client";

import { Upload } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { BuilderData } from "./builder-section";

interface Props {
  data: BuilderData;
  update: (partial: Partial<BuilderData>) => void;
}

export function StepBranding({ data, update }: Props) {
  const { t } = useT();

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-text">{t.builder.branding.title}</h3>
      <p className="mb-5 text-xs text-text-secondary">{t.builder.branding.subtitle}</p>

      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-xs font-medium text-text">{t.builder.branding.logo}</span>
          <div className="flex gap-3">
            <label className="relative flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-5 transition-colors hover:border-border-hover">
              <Upload size={18} className="text-text-muted" />
              <span className="text-[11px] text-text-muted">{t.builder.branding.logoUpload}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  update({ logo: file, logoCreate: false });
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {data.logo && (
                <span className="text-[10px] font-medium text-accent">
                  {data.logo.name.slice(0, 30)}
                </span>
              )}
            </label>

            <button
              onClick={() => update({ logo: null, logoCreate: true })}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-md border-2 p-5 transition-all ${
                data.logoCreate
                  ? "border-accent bg-accent/5"
                  : "border-dashed border-border hover:border-border-hover"
              }`}
            >
              <span className="text-lg">✨</span>
              <span className="text-[11px] font-medium text-text-secondary">
                {t.builder.branding.logoCreate}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text">
            {t.builder.branding.colors}
          </label>
          <input
            type="text"
            value={data.colors}
            onChange={(e) => update({ colors: e.target.value })}
            placeholder="e.g. black, gold, minimal"
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
