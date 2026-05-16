"use client";

import { Globe, Users, MessageSquare } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Pillars() {
  const { t } = useT();

  const items = [
    { icon: Globe, ...t.pillars.web, color: "#4a9a8a" },
    { icon: Users, ...t.pillars.crm, color: "#3d8a6a" },
    { icon: MessageSquare, ...t.pillars.whatsapp, color: "#6a5acd" },
  ];

  return (
    <section className="l-section" id="features">
      <div className="l-container" style={{ paddingInline: 0 }}>
        <div className="mb-14 max-w-[460px]">
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.pillars.title}
          </h2>
          <p className="mt-3 text-[0.95rem] leading-[1.65] text-[var(--l-text-2)]">
            {t.pillars.subtitle}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group rounded-[var(--l-radius-lg)] border border-[var(--l-border-subtle)] bg-[var(--l-card)] p-7 transition-all duration-200 hover:border-[var(--l-accent)] hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                  style={{ background: item.color + "14" }}
                >
                  <Icon size={20} style={{ color: item.color }} />
                </div>
                <h3
                  style={{ fontFamily: "var(--l-display)" }}
                  className="mt-4 text-[1.05rem] font-semibold text-[var(--l-text)]"
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9rem] leading-[1.65] text-[var(--l-text-2)]">
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
