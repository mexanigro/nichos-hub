"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n";

export function CrmDemo() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.4], prefersReduced ? [0, 0] : [8, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.4], prefersReduced ? [1, 1] : [0.96, 1]);

  return (
    <section ref={sectionRef} className="l-section relative overflow-hidden bg-[var(--l-bg)]" id="crm-demo">
      <div className="l-container relative z-10">
        {/* Section header */}
        <div className="mb-12 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.crmDemo.badge}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.crmDemo.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[0.95rem] text-[var(--l-text-2)]">
            {t.crmDemo.subtitle}
          </p>
        </div>

        {/* Browser chrome mockup with 3D perspective */}
        <motion.div
          style={{
            perspective: 1200,
            transformStyle: "preserve-3d",
          }}
          className="mx-auto max-w-[900px]"
        >
          <motion.div
            style={{
              rotateX,
              scale,
              transformOrigin: "center bottom",
            }}
          >
            {/* Browser chrome */}
            <div className="overflow-hidden rounded-[var(--l-radius-lg)] border border-[var(--l-border)] bg-[var(--l-card)]" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)" }}>
              {/* Title bar */}
              <div className="flex h-10 items-center gap-2 border-b border-[var(--l-border-subtle)] bg-[var(--l-surface)] px-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="mx-auto w-fit rounded-md border border-[var(--l-border-subtle)] bg-[var(--l-bg)] px-4 py-1 text-[0.7rem] text-[var(--l-text-3)]">
                    crm.arzac.studio
                  </div>
                </div>
              </div>

              {/* Video / placeholder area */}
              <div className="relative aspect-[16/9] w-full bg-[var(--l-bg)]">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster="/images/crm-fallback.jpg"
                  aria-label={t.crmDemo.videoAlt}
                >
                  <source src="/videos/crm-demo.mp4" type="video/mp4" />
                </video>

                {/* Fallback overlay — shown when video fails to load */}
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--l-bg)]" style={{ zIndex: -1 }}>
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--l-border)] bg-[var(--l-surface)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--l-accent)]">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="text-[0.85rem] text-[var(--l-text-3)]">{t.crmDemo.videoAlt}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Feature chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {t.crmDemo.chips.map((chip, i) => (
            <motion.span
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-full border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-1.5 text-[0.8rem] font-medium text-[var(--l-text-2)]"
            >
              {chip}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
