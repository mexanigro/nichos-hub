"use client";

import { Globe, BarChart3, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n";

const PILLAR_ICONS = [Globe, BarChart3, MessageCircle];
const PILLAR_ACCENTS = ["#ffffff", "#a1a1aa", "#25D366"];

export function WhyItMatters() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();

  return (
    <section className="l-section relative overflow-hidden bg-[var(--l-bg)]" id="why-it-matters">
      <div className="l-container relative z-10">
        {/* Header */}
        <div className="mb-10 text-center md:mb-14">
          <motion.span
            initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.whyItMatters.badge}
          </motion.span>
          <motion.h2
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.whyItMatters.title}
          </motion.h2>
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-3 max-w-[560px] text-[0.95rem] leading-[1.65] text-[var(--l-text-2)]"
          >
            {t.whyItMatters.subtitle}
          </motion.p>
        </div>

        {/* 3 pillars */}
        <div className="grid gap-5 md:grid-cols-3">
          {t.whyItMatters.pillars.map((pillar, i) => {
            const Icon = PILLAR_ICONS[i] || Globe;
            const accent = PILLAR_ACCENTS[i] || "#ffffff";
            return (
              <motion.div
                key={i}
                initial={
                  prefersReduced
                    ? {}
                    : { opacity: 0, y: 20, clipPath: "inset(4% 0% 4% 0%)" }
                }
                whileInView={{
                  opacity: 1,
                  y: 0,
                  clipPath: "inset(0% 0% 0% 0%)",
                }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="rounded-[var(--l-radius-lg)] border border-[var(--l-border)] bg-[var(--l-card)] p-6 md:p-7"
                style={{ boxShadow: "var(--l-shadow-card)" }}
              >
                {/* Icon */}
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-[12px]"
                  style={{ background: accent + "18" }}
                >
                  <Icon size={22} style={{ color: accent }} strokeWidth={1.6} />
                </div>

                {/* Title */}
                <h3
                  style={{ fontFamily: "var(--l-display)" }}
                  className="text-[1.05rem] font-semibold text-[var(--l-text)]"
                >
                  {pillar.title}
                </h3>

                {/* Stat highlight */}
                <p
                  className="mt-3 text-[1.1rem] font-bold leading-[1.3]"
                  style={{ color: accent }}
                >
                  {pillar.stat}
                </p>

                {/* Description */}
                <p className="mt-1 text-[0.88rem] leading-[1.6] text-[var(--l-text-2)]">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
