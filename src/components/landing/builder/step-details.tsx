"use client";

import { useT } from "@/lib/i18n";
import type { BuilderData } from "./builder-section";

interface Props {
  data: BuilderData;
  update: (partial: Partial<BuilderData>) => void;
}

export function StepDetails({ data, update }: Props) {
  const { t } = useT();

  const fields: { key: keyof BuilderData; label: string; type?: string; placeholder?: string }[] = [
    { key: "businessName", label: t.builder.details.businessName, placeholder: "My Business" },
    { key: "description", label: t.builder.details.description },
    { key: "whatsapp", label: t.builder.details.whatsapp, type: "tel", placeholder: "+972..." },
    { key: "email", label: t.builder.details.email, type: "email" },
    { key: "address", label: t.builder.details.address },
    { key: "instagram", label: t.builder.details.instagram, placeholder: "@" },
  ];

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-text">{t.builder.details.title}</h3>
      <p className="mb-5 text-xs text-text-secondary">{t.builder.details.subtitle}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key} className={key === "description" ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-[11px] font-medium text-text-secondary">
              {label}
            </label>
            {key === "description" ? (
              <textarea
                value={data[key] as string}
                onChange={(e) => update({ [key]: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            ) : (
              <input
                type={type || "text"}
                value={data[key] as string}
                onChange={(e) => update({ [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
