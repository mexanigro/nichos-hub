"use client";

import { User, Users } from "lucide-react";
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

  const inputClass =
    "w-full rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-bg)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] placeholder:text-[var(--l-text-3)] transition-colors duration-200 focus:border-[var(--l-accent)] focus:outline-none";

  return (
    <div>
      <h3
        style={{ fontFamily: "var(--l-display)" }}
        className="mb-1.5 text-[0.95rem] font-semibold text-[var(--l-text)]"
      >
        {t.builder.details.title}
      </h3>
      <p className="mb-5 text-[0.85rem] text-[var(--l-text-2)]">
        {t.builder.details.subtitle}
      </p>

      {/* Solo / Team toggle */}
      <div className="mb-6">
        <p className="mb-2.5 text-[0.82rem] font-medium text-[var(--l-text-2)]">
          {t.builder.details.modeTitle || "Do you work solo or have a team?"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["solo", "team"] as const).map((mode) => {
            const selected = data.businessMode === mode;
            const Icon = mode === "solo" ? User : Users;
            const label = mode === "solo"
              ? (t.builder.details.solo || "Solo")
              : (t.builder.details.team || "Team");
            return (
              <button
                key={mode}
                onClick={() => update({ businessMode: mode })}
                aria-pressed={selected}
                className={`flex items-center justify-center gap-2.5 rounded-[var(--l-radius-sm)] border px-4 py-3 transition-all duration-200 active:scale-[0.97] ${
                  selected
                    ? "border-[var(--l-accent)] bg-[var(--l-accent-muted)]"
                    : "border-[var(--l-border)] hover:border-[var(--l-accent)]"
                }`}
              >
                <Icon
                  size={18}
                  className={selected ? "text-[var(--l-accent)]" : "text-[var(--l-text-3)]"}
                />
                <span className="text-[0.85rem] font-medium text-[var(--l-text)]">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type, placeholder }) => (
          <div key={key} className={key === "description" ? "sm:col-span-2" : ""}>
            <label className="mb-1.5 block text-[0.82rem] font-medium text-[var(--l-text-2)]">
              {label}
            </label>
            {key === "description" ? (
              <textarea
                value={data[key] as string}
                onChange={(e) => update({ [key]: e.target.value })}
                rows={3}
                className={inputClass + " resize-none"}
              />
            ) : (
              <input
                type={type || "text"}
                value={data[key] as string}
                onChange={(e) => update({ [key]: e.target.value })}
                placeholder={placeholder}
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
