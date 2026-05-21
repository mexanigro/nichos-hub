"use client";

import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";

export function FinalCTA() {
  const { t, isRTL } = useT();

  return (
    <section className="l-section-lg l-tech-grid relative overflow-hidden bg-[var(--l-bg)]">
      {/* Subtle glow behind */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 md:block"
        style={{ background: "radial-gradient(circle, var(--l-accent-glow) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 mx-auto max-w-[600px] text-start">
        <h2
          style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
          className="font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
        >
          {t.cta.title}
        </h2>
        <p className="mt-4 text-[1.05rem] leading-[1.65] text-[var(--l-text-2)] md:text-[1rem]">
          {t.cta.subtitle}
        </p>
        <a
          href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--l-display)",
            boxShadow: "0 0 40px rgba(255,255,255,0.06), 0 0 80px rgba(255,255,255,0.03)",
          }}
          className="mt-8 inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-white px-6 py-3.5 text-[1rem] font-semibold text-[#0a0a0f] transition-all duration-200 hover:opacity-90 active:scale-[0.97] md:px-8"
        >
          {t.cta.button}
          <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
