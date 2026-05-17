"use client";

import { useT } from "@/lib/i18n";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();

  const words = t.hero.headline.split(" ");

  return (
    <section className="relative overflow-hidden pb-20 pt-36 px-6 md:pb-28 md:px-12 md:pt-44">
      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute -left-[200px] top-[20%] h-[400px] w-[400px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, var(--l-accent-glow) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-float 8s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-[150px] top-[10%] h-[350px] w-[350px] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-float 8s ease-in-out infinite 3s",
        }}
      />
      <div
        className="pointer-events-none absolute left-[30%] top-[60%] h-[300px] w-[300px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, var(--l-accent-glow) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-float 8s ease-in-out infinite 5s",
        }}
      />

      <div className="l-narrow relative z-10 text-center">
        {/* Badge with shimmer */}
        <motion.span
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "var(--l-display)" }}
          className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
        >
          <span
            className="inline-block bg-clip-text"
            style={{
              backgroundImage: prefersReduced
                ? "none"
                : "linear-gradient(90deg, var(--l-accent), var(--l-text-2), var(--l-accent))",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: prefersReduced ? "var(--l-accent)" : "transparent",
              animation: prefersReduced ? "none" : "shimmer 3s linear infinite",
            }}
          >
            {t.hero.badge || "WEBSITE + CRM + AI"}
          </span>
        </motion.span>

        {/* Headline with staggered word animation + gradient */}
        <h1
          style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h1)" }}
          className="mt-6 font-bold leading-[1.1] tracking-[-0.025em]"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: prefersReduced ? 0 : 0.15 + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, var(--l-text) 40%, var(--l-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginInlineEnd: "0.3em",
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-5 max-w-[520px] text-[1.125rem] leading-[1.7] text-[var(--l-text-2)]"
        >
          {t.hero.subheadline}
        </motion.p>

        {/* CTA with glow */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9"
        >
          <a
            href="#builder"
            style={{
              fontFamily: "var(--l-display)",
              boxShadow: "0 0 30px var(--l-accent-glow), 0 0 60px var(--l-accent-glow)",
            }}
            className="inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-8 py-3.5 text-[1rem] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_50px_var(--l-accent-glow)] active:scale-[0.98]"
          >
            {t.hero.cta}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
