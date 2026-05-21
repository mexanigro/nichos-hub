"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

const NICHE_KEYS = ["barberia", "estetica", "cafeteria"] as const;

export function WebShowcase() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [activeNiche, setActiveNiche] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* Parallax: desktop sinks, phone rises — staggered depth */
  const desktopY = useTransform(scrollYProgress, [0, 0.5], prefersReduced ? [0, 0] : [40, -20]);
  const phoneY = useTransform(scrollYProgress, [0, 0.5], prefersReduced ? [0, 0] : [60, -30]);
  const containerScale = useTransform(scrollYProgress, [0, 0.35], prefersReduced ? [1, 1] : [0.95, 1]);

  const nicheKey = NICHE_KEYS[activeNiche];

  return (
    <section
      ref={sectionRef}
      className="l-section l-tech-grid relative overflow-hidden bg-[var(--l-bg)]"
      id="web-showcase"
    >
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
            {t.webShowcase.badge}
          </motion.span>
          <motion.h2
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.webShowcase.title}
          </motion.h2>
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-3 max-w-[520px] text-[0.95rem] text-[var(--l-text-2)]"
          >
            {t.webShowcase.subtitle}
          </motion.p>
        </div>

        {/* Device mockups */}
        <motion.div
          style={{ scale: containerScale }}
          className="relative mx-auto max-w-[880px]"
        >
          {/* Desktop frame — hidden on mobile */}
          <motion.div
            style={{ y: desktopY }}
            className="relative hidden lg:block"
          >
            <div
              className="overflow-hidden rounded-[16px] border border-[var(--l-border)] bg-[var(--l-card)]"
              style={{
                boxShadow:
                  "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Laptop bezel top */}
              <div className="flex h-8 items-center gap-1.5 border-b border-[var(--l-border-subtle)] bg-[var(--l-surface)] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="relative aspect-[16/10] w-full bg-[var(--l-bg)]">
                <AnimatePresence mode="wait">
                  <motion.video
                    key={`desktop-${nicheKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source
                      src={`/videos/showcase-${nicheKey}-desktop.mp4`}
                      type="video/mp4"
                    />
                  </motion.video>
                </AnimatePresence>
                {/* Fallback */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-[var(--l-bg)]"
                  style={{ zIndex: -1 }}
                >
                  <p className="text-[0.85rem] text-[var(--l-text-3)]">
                    {t.webShowcase.niches[nicheKey]}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone frame — overlapping bottom-right on desktop */}
            <motion.div
              style={{ y: phoneY }}
              className="absolute -bottom-10 -right-4 z-10 w-[180px]"
            >
              <div
                className="overflow-hidden rounded-[20px] border-2 border-[var(--l-border)] bg-[var(--l-card)]"
                style={{
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                {/* Phone notch */}
                <div className="mx-auto mt-2 h-[4px] w-[40px] rounded-full bg-[var(--l-border)]" />
                <div className="relative aspect-[9/19] w-full bg-[var(--l-bg)] p-1">
                  <AnimatePresence mode="wait">
                    <motion.video
                      key={`phone-${nicheKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="h-full w-full rounded-[12px] object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    >
                      <source
                        src={`/videos/showcase-${nicheKey}-mobile.mp4`}
                        type="video/mp4"
                      />
                    </motion.video>
                  </AnimatePresence>
                </div>
                {/* Home bar */}
                <div className="mx-auto mb-2 mt-1 h-[3px] w-[36px] rounded-full bg-[var(--l-border)]" />
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile-only: single phone frame, centered */}
          <motion.div
            style={{ y: phoneY }}
            className="mx-auto max-w-[280px] lg:hidden"
          >
            <div
              className="overflow-hidden rounded-[28px] border-2 border-[var(--l-border)] bg-[var(--l-card)]"
              style={{
                boxShadow:
                  "0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
              }}
            >
              {/* Phone notch */}
              <div className="mx-auto mt-3 h-[5px] w-[48px] rounded-full bg-[var(--l-border)]" />
              <div className="relative aspect-[9/19] w-full bg-[var(--l-bg)] p-1.5">
                <AnimatePresence mode="wait">
                  <motion.video
                    key={`mobile-only-${nicheKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="h-full w-full rounded-[18px] object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  >
                    <source
                      src={`/videos/showcase-${nicheKey}-mobile.mp4`}
                      type="video/mp4"
                    />
                  </motion.video>
                </AnimatePresence>
              </div>
              {/* Home bar */}
              <div className="mx-auto mb-3 mt-1.5 h-[4px] w-[44px] rounded-full bg-[var(--l-border)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Niche tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:mt-16">
          {NICHE_KEYS.map((key, i) => (
            <button
              key={key}
              onClick={() => setActiveNiche(i)}
              className={`rounded-full border px-5 py-2 text-[0.85rem] font-medium transition-all duration-200 ${
                i === activeNiche
                  ? "border-[var(--l-accent)] bg-[var(--l-accent)] text-[var(--l-bg)]"
                  : "border-[var(--l-border)] bg-[var(--l-surface)] text-[var(--l-text-2)] hover:border-[var(--l-border-hover)]"
              }`}
            >
              {t.webShowcase.niches[key]}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
