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
      <h3
        style={{ fontFamily: "var(--l-display)" }}
        className="mb-1.5 text-[0.95rem] font-semibold text-[var(--l-text)]"
      >
        {t.builder.branding.title}
      </h3>
      <p className="mb-5 text-[0.85rem] text-[var(--l-text-2)]">
        {t.builder.branding.subtitle}
      </p>

      <div className="space-y-5">
        <div>
          <span className="mb-2.5 block text-[0.85rem] font-medium text-[var(--l-text)]">
            {t.builder.branding.logo}
          </span>
          <div className="flex gap-3">
            <label className="relative flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-[var(--l-radius-sm)] border-2 border-dashed border-[var(--l-border)] p-5 transition-colors duration-200 hover:border-[var(--l-accent)]">
              <Upload size={18} className="text-[var(--l-text-3)]" />
              <span className="text-[0.82rem] text-[var(--l-text-3)]">
                {t.builder.branding.logoUpload}
              </span>
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
                <span className="text-[0.78rem] font-medium text-[var(--l-accent)]">
                  {data.logo.name.slice(0, 30)}
                </span>
              )}
            </label>

            <button
              onClick={() => update({ logo: null, logoCreate: true })}
              className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-[var(--l-radius-sm)] border-2 p-5 transition-all duration-200 ${
                data.logoCreate
                  ? "border-[var(--l-accent)] bg-[var(--l-accent-muted)]"
                  : "border-dashed border-[var(--l-border)] hover:border-[var(--l-accent)]"
              }`}
            >
              <span className="text-lg">&#10024;</span>
              <span className="text-[0.82rem] font-medium text-[var(--l-text-2)]">
                {t.builder.branding.logoCreate}
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--l-text)]">
            {t.builder.branding.colors}
          </label>
          <input
            type="text"
            value={data.colors}
            onChange={(e) => update({ colors: e.target.value })}
            placeholder="e.g. black, gold, minimal"
            className="w-full rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-bg)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] placeholder:text-[var(--l-text-3)] transition-colors duration-200 focus:border-[var(--l-accent)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
