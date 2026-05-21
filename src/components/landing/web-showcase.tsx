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

export function WebShowcase() {
  const { t, isRTL } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const desktopVideoRef = useRef<HTMLVideoElement>(null);
  const phoneVideoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  /* Lazy play/pause — videos only run while section is visible */
  const inView = useInView(sectionRef, { amount: 0.3 });
  useEffect(() => {
    const vids = [
      desktopVideoRef.current,
      phoneVideoRef.current,
      mobileVideoRef.current,
    ];
    for (const v of vids) {
      if (!v) continue;
      if (inView) v.play().catch(() => {});
      else v.pause();
    }
  }, [inView]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /* Parallax — recalibrated for wider layout */
  const desktopY = useTransform(
    scrollYProgress,
    [0, 0.5],
    prefersReduced ? [0, 0] : [30, -15],
  );
  const phoneY = useTransform(
    scrollYProgress,
    [0, 0.5],
    prefersReduced ? [0, 0] : [50, -25],
  );
  const containerScale = useTransform(
    scrollYProgress,
    [0, 0.35],
    prefersReduced ? [1, 1] : [0.97, 1],
  );

  /* Phone tilts toward center — inverted in RTL */
  const phoneRotate = prefersReduced ? 0 : isRTL ? -2 : 2;

  return (
    <section
      ref={sectionRef}
      className="l-section l-tech-grid relative overflow-hidden bg-[var(--l-bg)]"
      id="web-showcase"
    >
      {/* ── Header ── stays inside l-container */}
      <div className="l-container relative z-10">
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
            transition={{
              duration: 0.5,
              delay: 0.06,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{
              fontFamily: "var(--l-display)",
              fontSize: "var(--l-h2)",
            }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.webShowcase.title}
          </motion.h2>
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: 0.12,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="mx-auto mt-3 max-w-[520px] text-[0.95rem] text-[var(--l-text-2)]"
          >
            {t.webShowcase.subtitle}
          </motion.p>
        </div>
      </div>

      {/* ── Device mockups ── break out of container for wider impact */}
      <motion.div
        style={{
          scale: containerScale,
          maxWidth: "min(1400px, 100vw - 48px)",
        }}
        className="relative z-10 mx-auto"
      >
        {/* ─── Desktop: laptop + phone side by side ─── */}
        <div className="hidden items-center justify-center gap-6 lg:flex xl:gap-8">
          {/* Laptop frame — 72% */}
          <motion.div
            style={{ y: desktopY }}
            className="relative w-[72%] max-w-[1050px]"
          >
            <div
              className="overflow-hidden rounded-[16px] border border-[var(--l-border)] bg-[var(--l-card)]"
              style={{
                boxShadow:
                  "0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* macOS chrome */}
              <div className="flex h-8 items-center gap-1.5 border-b border-[var(--l-border-subtle)] bg-[var(--l-surface)] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </div>
              {/* Screen */}
              <div className="relative aspect-[16/10] w-full bg-[var(--l-bg)]">
                <video
                  ref={desktopVideoRef}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/videos/showcase-web-desktop-poster.jpg"
                >
                  <source
                    src="/videos/showcase-web-desktop.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
            </div>
          </motion.div>

          {/* Phone frame — premium iPhone style, 22% */}
          <motion.div
            style={{ y: phoneY, rotate: phoneRotate }}
            className="relative w-[22%] min-w-[240px] max-w-[320px]"
          >
            <div
              className="overflow-hidden rounded-[40px] border-[2.5px] border-[var(--l-border)] bg-[var(--l-card)]"
              style={{
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
              }}
            >
              {/* Dynamic Island */}
              <div className="mx-auto mt-3 h-[24px] w-[90px] rounded-[14px] bg-black" />
              {/* Screen */}
              <div className="relative mx-1.5 mb-1.5 mt-2 aspect-[9/19.5] overflow-hidden rounded-[32px] bg-[var(--l-bg)]">
                <video
                  ref={phoneVideoRef}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster="/videos/showcase-web-mobile-poster.jpg"
                >
                  <source
                    src="/videos/showcase-web-mobile.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
              {/* Home indicator */}
              <div className="mx-auto mb-2.5 mt-1.5 h-[4px] w-[100px] rounded-full bg-[var(--l-border)]" />
            </div>
          </motion.div>
        </div>

        {/* ─── Mobile: single phone centered, much bigger ─── */}
        <motion.div
          style={{ y: phoneY }}
          className="mx-auto w-[85vw] max-w-[360px] lg:hidden"
        >
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
            <div className="relative mx-2 mb-2 mt-2.5 aspect-[9/19.5] overflow-hidden rounded-[34px] bg-[var(--l-bg)]">
              <video
                ref={mobileVideoRef}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                preload="none"
                poster="/videos/showcase-web-mobile-poster.jpg"
              >
                <source
                  src="/videos/showcase-web-mobile.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
            {/* Home indicator */}
            <div className="mx-auto mb-3 mt-2 h-[5px] w-[110px] rounded-full bg-[var(--l-border)]" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
