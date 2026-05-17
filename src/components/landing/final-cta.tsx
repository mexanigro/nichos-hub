"use client";

import { useT } from "@/lib/i18n";

export function FinalCTA() {
  const { t } = useT();

  return (
    <section className="l-section-lg relative overflow-hidden bg-[var(--l-surface)]">
      {/* Subtle glow behind */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, var(--l-accent-glow) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[600px] text-center">
        <h2
          style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
          className="font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
        >
          {t.cta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[440px] text-[1rem] leading-[1.65] text-[var(--l-text-2)]">
          {t.cta.subtitle}
        </p>
        <a
          href="#builder"
          style={{
            fontFamily: "var(--l-display)",
            boxShadow: "0 0 30px var(--l-accent-glow), 0 0 60px var(--l-accent-glow)",
          }}
          className="mt-8 inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-8 py-3.5 text-[1rem] font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
        >
          {t.cta.button}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
}
