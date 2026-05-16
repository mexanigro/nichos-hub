"use client";

import { useT } from "@/lib/i18n";

export function HowItWorks() {
  const { t } = useT();

  return (
    <section className="l-section bg-[var(--l-bg-warm)]" id="how-it-works">
      <div className="mx-auto max-w-[800px]">
        <div className="mb-14 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] bg-[var(--l-accent-muted)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.howItWorks.badge || "HOW IT WORKS"}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.howItWorks.title}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--l-text-2)]">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="relative">
          {t.howItWorks.steps.map((step, i) => {
            const isLast = i === t.howItWorks.steps.length - 1;
            return (
              <div key={i} className="relative flex gap-5 pb-8 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    style={{ fontFamily: "var(--l-display)" }}
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--l-accent)] text-[0.85rem] font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  {!isLast && (
                    <div className="mt-2 w-[2px] flex-1 bg-[var(--l-border)]" />
                  )}
                </div>
                <div className="pt-2 pb-4">
                  <h3
                    style={{ fontFamily: "var(--l-display)" }}
                    className="text-[1rem] font-semibold text-[var(--l-text)]"
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[42ch] text-[0.9rem] leading-[1.65] text-[var(--l-text-2)]">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
