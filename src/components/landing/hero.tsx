"use client";

import { useT } from "@/lib/i18n";

export function Hero() {
  const { t } = useT();

  return (
    <section className="pb-20 pt-36 px-6 md:pb-24 md:px-12 md:pt-44">
      <div className="l-narrow text-center">
        <span
          style={{ fontFamily: "var(--l-display)" }}
          className="inline-block rounded-[var(--l-radius-pill)] bg-[var(--l-accent-muted)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
        >
          {t.hero.badge || "WEBSITE + CRM + AI"}
        </span>

        <h1
          style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h1)" }}
          className="mt-6 font-bold leading-[1.1] tracking-[-0.025em] text-[var(--l-text)]"
        >
          {t.hero.headline}
        </h1>

        <p className="mx-auto mt-5 max-w-[520px] text-[1.125rem] leading-[1.7] text-[var(--l-text-2)]">
          {t.hero.subheadline}
        </p>

        <a
          href="#builder"
          style={{ fontFamily: "var(--l-display)" }}
          className="mt-9 inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-8 py-3.5 text-[1rem] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {t.hero.cta}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
