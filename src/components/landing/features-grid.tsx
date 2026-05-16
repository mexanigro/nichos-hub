"use client";

import { Calendar, Languages, Bot, BarChart3, Globe2, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";

const ICONS = [Calendar, Languages, Bot, BarChart3, Globe2, RefreshCw];

export function FeaturesGrid() {
  const { t } = useT();

  return (
    <section className="l-section">
      <div className="l-container" style={{ paddingInline: 0 }}>
        <div className="mb-14 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] bg-[var(--l-accent-muted)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.features.badge || "FEATURES"}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.features.title}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--l-text-2)]">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <div
                key={i}
                className="group rounded-[var(--l-radius)] border border-[var(--l-border-subtle)] bg-[var(--l-card)] p-6 transition-all duration-200 hover:border-[var(--l-accent)] hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--l-radius-sm)] bg-[var(--l-accent-muted)]">
                  <Icon size={18} style={{ color: "var(--l-accent)" }} />
                </div>
                <h3
                  style={{ fontFamily: "var(--l-display)" }}
                  className="mt-3.5 text-[0.95rem] font-semibold text-[var(--l-text)]"
                >
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[0.85rem] leading-[1.6] text-[var(--l-text-2)]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
