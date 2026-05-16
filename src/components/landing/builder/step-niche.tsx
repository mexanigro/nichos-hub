"use client";

import { Scissors, Sparkles, Paintbrush, Hand } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { BuilderData } from "./builder-section";

const NICHES = [
  { id: "barberia", icon: Scissors },
  { id: "estetica", icon: Sparkles },
  { id: "tattoo", icon: Paintbrush },
  { id: "nails", icon: Hand },
];

const NICHE_LABELS: Record<string, Record<string, string>> = {
  barberia: { en: "Barbershop", es: "Barberia", ru: "Барбершоп", he: "מספרה" },
  estetica: { en: "Beauty salon", es: "Estetica", ru: "Салон красоты", he: "סלון יופי" },
  tattoo: { en: "Tattoo studio", es: "Tattoo studio", ru: "Тату студия", he: "סטודיו לקעקועים" },
  nails: { en: "Nail salon", es: "Salon de unas", ru: "Маникюр", he: "מניקור" },
};

interface Props {
  data: BuilderData;
  update: (partial: Partial<BuilderData>) => void;
}

export function StepNiche({ data, update }: Props) {
  const { t, locale } = useT();

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-text">{t.builder.niche.title}</h3>
      <p className="mb-5 text-xs text-text-secondary">{t.builder.niche.subtitle}</p>

      <div className="grid grid-cols-2 gap-3">
        {NICHES.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => update({ niche: id })}
            aria-pressed={data.niche === id}
            className={`flex flex-col items-center gap-2 rounded-md border p-5 transition-all active:scale-95 ${
              data.niche === id
                ? "border-accent bg-accent/5 shadow-glow-sm"
                : "border-border hover:border-border-hover"
            }`}
          >
            <Icon size={24} className={data.niche === id ? "text-accent" : "text-text-muted"} />
            <span className="text-xs font-medium text-text">
              {NICHE_LABELS[id][locale]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
