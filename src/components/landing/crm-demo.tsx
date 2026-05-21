"use client";

import { useRef, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { useT } from "@/lib/i18n";

export function CrmDemo() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  /* Lazy play/pause */
  const inView = useInView(sectionRef, { amount: 0.3 });
  useEffect(() => {
    const vids = [desktopVideoRef.current, mobileVideoRef.current];
    for (const v of vids) {
      if (!v) continue;
      if (inView) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    }
  }, [inView]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* 3D adjusted for wider frame — desktop only */
  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.4],
    prefersReduced ? [0, 0] : [6, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4],
    prefersReduced ? [1, 1] : [0.94, 1],
  );

  return (
    <section
      ref={sectionRef}
      className="l-section relative overflow-hidden bg-[var(--l-bg)]"
      id="crm-demo"
    >
      {/* Header — inside container */}
      <div className="l-container relative z-10">
        <div className="mb-10 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.crmDemo.badge}
          </span>
          <h2
            style={{
              fontFamily: "var(--l-display)",
              fontSize: "var(--l-h2)",
            }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.crmDemo.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[0.95rem] text-[var(--l-text-2)]">
            {t.crmDemo.subtitle}
          </p>
        </div>
      </div>

      {/* ─── Mobile: Phone mockup with mobile CRM video ─── */}
      <div className="relative z-10 mx-auto lg:hidden" style={{ maxWidth: "min(420px, 95vw)" }}>
        <div
          className="overflow-hidden rounded-[40px] border-[2.5px] border-[var(--l-border)] bg-[var(--l-card)]"
          style={{
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Dynamic Island */}
          <div className="mx-auto mt-3.5 h-[26px] w-[100px] rounded-[14px] bg-black" />
          {/* Screen */}
          <div className="relative mx-2 mb-2 mt-2.5 aspect-[9/16] overflow-hidden rounded-[34px] bg-[var(--l-bg)]">
            <video
              ref={mobileVideoRef}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="none"
              poster="/videos/crm-demo-mobile-poster.jpg"
              aria-label={t.crmDemo.videoAlt}
            >
              <source src="/videos/crm-demo-mobile.mp4" type="video/mp4" />
            </video>
          </div>
          {/* Home indicator */}
          <div className="mx-auto mb-3 mt-2 h-[5px] w-[110px] rounded-full bg-[var(--l-border)]" />
        </div>
      </div>

      {/* ─── Desktop: Browser chrome with desktop CRM video ─── */}
      <div className="relative z-10 mx-auto hidden px-6 lg:block" style={{ maxWidth: "min(1280px, 100vw - 48px)" }}>
        <motion.div
          style={{ perspective: 1400, transformStyle: "preserve-3d" }}
        >
          <motion.div
            style={{ rotateX, scale, transformOrigin: "center bottom" }}
          >
            <div
              className="overflow-hidden rounded-[var(--l-radius-lg)] border border-[var(--l-border)] bg-[var(--l-card)]"
              style={{
                boxShadow:
                  "0 25px 70px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Enhanced title bar */}
              <div className="flex h-11 items-center gap-2 border-b border-[var(--l-border-subtle)] bg-[var(--l-surface)] px-4">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="mx-auto flex w-fit items-center gap-1.5 rounded-md border border-[var(--l-border-subtle)] bg-[var(--l-bg)] px-4 py-1">
                    {/* Lock icon */}
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="text-emerald-500"
                    >
                      <path d="M8 1a4 4 0 0 0-4 4v2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1V5a4 4 0 0 0-4-4zm2.5 6H5.5V5a2.5 2.5 0 1 1 5 0v2z" />
                    </svg>
                    <span className="text-[0.7rem] text-[var(--l-text-3)]">
                      crm.arzac.studio
                    </span>
                  </div>
                </div>
              </div>

              {/* Video area */}
              <div className="relative aspect-[16/9] w-full bg-[var(--l-bg)]">
                <video
                  ref={desktopVideoRef}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/videos/crm-demo-poster.jpg"
                  aria-label={t.crmDemo.videoAlt}
                >
                  <source src="/videos/crm-demo.mp4" type="video/mp4" />
                </video>

                {/* Fallback — behind video */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-[var(--l-bg)]"
                  style={{ zIndex: -1 }}
                >
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--l-border)] bg-[var(--l-surface)]">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-[var(--l-accent)]"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <p className="text-[0.85rem] text-[var(--l-text-3)]">
                      {t.crmDemo.videoAlt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Feature chips — inside container */}
      <div className="l-container relative z-10">
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {t.crmDemo.chips.map((chip, i) => (
            <motion.span
              key={i}
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.23, 1, 0.32, 1],
              }}
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
