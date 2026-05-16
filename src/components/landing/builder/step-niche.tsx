"use client";

import { Scissors, Sparkles, Paintbrush, Hand, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import type { BuilderData } from "./builder-section";

const NICHES = [
  { id: "barberia", icon: Scissors },
  { id: "estetica", icon: Sparkles },
  { id: "tattoo", icon: Paintbrush },
  { id: "nails", icon: Hand },
  { id: "otro", icon: MoreHorizontal },
];

const NICHE_LABELS: Record<string, Record<string, string>> = {
  barberia: { en: "Barbershop", es: "Barbería", ru: "Барбершоп", he: "מספרה" },
  estetica: { en: "Beauty salon", es: "Estética", ru: "Салон красоты", he: "סלון יופי" },
  tattoo: { en: "Tattoo studio", es: "Tattoo studio", ru: "Тату студия", he: "סטודיו לקעקועים" },
  nails: { en: "Nail salon", es: "Salón de uñas", ru: "Маникюр", he: "מניקור" },
  otro: { en: "Other", es: "Otro", ru: "Другое", he: "אחר" },
};

interface Props {
  data: BuilderData;
  update: (partial: Partial<BuilderData>) => void;
}

export function StepNiche({ data, update }: Props) {
  const { t, locale } = useT();

  return (
    <div>
      <h3
        style={{ fontFamily: "var(--l-display)" }}
        className="mb-1.5 text-[0.95rem] font-semibold text-[var(--l-text)]"
      >
        {t.builder.niche.title}
      </h3>
      <p className="mb-5 text-[0.85rem] text-[var(--l-text-2)]">
        {t.builder.niche.subtitle}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {NICHES.slice(0, 4).map(({ id, icon: Icon }) => {
          const selected = data.niche === id;
          return (
            <button
              key={id}
              onClick={() => update({ niche: id, customNiche: "" })}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2.5 rounded-[var(--l-radius-sm)] border p-5 transition-all duration-200 active:scale-[0.97] ${
                selected
                  ? "border-[var(--l-accent)] bg-[var(--l-accent-muted)]"
                  : "border-[var(--l-border)] hover:border-[var(--l-accent)]"
              }`}
            >
              <Icon
                size={24}
                className={selected ? "text-[var(--l-accent)]" : "text-[var(--l-text-3)]"}
              />
              <span className="text-[0.85rem] font-medium text-[var(--l-text)]">
                {NICHE_LABELS[id][locale]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center">
        {(() => {
          const { id, icon: Icon } = NICHES[4];
          const selected = data.niche === id;
          return (
            <button
              onClick={() => update({ niche: id })}
              aria-pressed={selected}
              className={`flex w-full max-w-[calc(50%-6px)] flex-col items-center gap-2.5 rounded-[var(--l-radius-sm)] border p-5 transition-all duration-200 active:scale-[0.97] ${
                selected
                  ? "border-[var(--l-accent)] bg-[var(--l-accent-muted)]"
                  : "border-[var(--l-border)] hover:border-[var(--l-accent)]"
              }`}
            >
              <Icon
                size={24}
                className={selected ? "text-[var(--l-accent)]" : "text-[var(--l-text-3)]"}
              />
              <span className="text-[0.85rem] font-medium text-[var(--l-text)]">
                {NICHE_LABELS[id][locale]}
              </span>
            </button>
          );
        })()}
      </div>

      <AnimatePresence>
        {data.niche === "otro" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <input
              type="text"
              value={data.customNiche}
              onChange={(e) => update({ customNiche: e.target.value })}
              placeholder={t.builder.niche.otroPlaceholder || "Ej: floristería, café, gimnasio..."}
              className="mt-4 w-full rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-bg)] px-4 py-3 text-[0.88rem] text-[var(--l-text)] placeholder:text-[var(--l-text-3)] transition-colors duration-200 focus:border-[var(--l-accent)] focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
