"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";

/* ─── Niche visual themes (placeholder gradients until real videos) ─── */
const NICHES = [
  {
    id: "barberia",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    accent: "#e2b04a",
    heroText: "El corte perfecto te espera",
    services: ["Corte Clásico", "Barba", "Afeitado", "Color"],
  },
  {
    id: "estetica",
    gradient: "linear-gradient(135deg, #1a0e2e 0%, #2d1b4e 40%, #4a2c6e 100%)",
    accent: "#d4a0d4",
    heroText: "Tu belleza, nuestra pasión",
    services: ["Facial", "Manicura", "Depilación", "Masajes"],
  },
  {
    id: "cafeteria",
    gradient: "linear-gradient(135deg, #1b1810 0%, #2c2418 40%, #3e3020 100%)",
    accent: "#c89b5e",
    heroText: "Café de especialidad",
    services: ["Espresso", "Latte Art", "Pastelería", "Brunch"],
  },
] as const;

/* ─── Placeholder "site" rendered as CSS ─── */
function PlaceholderSite({ niche, isActive }: { niche: (typeof NICHES)[number]; isActive: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-b-lg transition-opacity"
      style={{
        background: niche.gradient,
        opacity: isActive ? 1 : 0,
        transitionDuration: "400ms",
        transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
      }}
    >
      {/* Mini nav */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="h-3 w-16 rounded-full bg-white/20" />
        <div className="flex gap-3">
          <div className="h-2.5 w-10 rounded-full bg-white/10" />
          <div className="h-2.5 w-10 rounded-full bg-white/10" />
          <div className="h-2.5 w-10 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Hero area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div
          className="mb-3 h-2 w-20 rounded-full"
          style={{ background: niche.accent + "60" }}
        />
        <p
          className="max-w-[260px] text-[0.85rem] font-bold leading-tight tracking-tight text-white/90 sm:text-[1.1rem]"
          style={{ fontFamily: "var(--l-display)" }}
        >
          {niche.heroText}
        </p>
        <div
          className="mt-4 rounded-full px-5 py-1.5 text-[0.7rem] font-semibold text-white sm:text-[0.75rem]"
          style={{ background: niche.accent }}
        >
          Reservar turno
        </div>

        {/* Service cards grid */}
        <div className="mt-6 grid w-full max-w-[280px] grid-cols-2 gap-2 sm:max-w-[320px]">
          {niche.services.map((service) => (
            <div
              key={service}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center backdrop-blur-sm"
            >
              <div
                className="mx-auto mb-1.5 h-5 w-5 rounded-md"
                style={{ background: niche.accent + "30" }}
              />
              <p className="text-[0.65rem] font-medium text-white/70 sm:text-[0.7rem]">
                {service}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TemplateShowcase() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeNiche, setActiveNiche] = useState(0);

  const nicheLabels = [
    t.showcase.niches.barberia,
    t.showcase.niches.estetica,
    t.showcase.niches.cafeteria,
  ];

  /* ─── Scroll-driven niche rotation ─── */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Map scroll progress → niche index
  // We want the rotation to happen in the middle 60% of scroll
  const nicheProgress = useTransform(scrollYProgress, [0.2, 0.8], [0, 2.99]);

  useEffect(() => {
    if (prefersReduced) return;

    const unsubscribe = nicheProgress.on("change", (latest) => {
      const idx = Math.min(Math.floor(latest), 2);
      if (idx >= 0) setActiveNiche(idx);
    });

    return unsubscribe;
  }, [nicheProgress, prefersReduced]);

  /* ─── Manual rotation for reduced motion / fallback ─── */
  const cycleNiche = useCallback(() => {
    setActiveNiche((prev) => (prev + 1) % NICHES.length);
  }, []);

  // Auto-cycle when reduced motion or if user can't scroll (e.g. embedded)
  useEffect(() => {
    if (!prefersReduced) return;
    const id = setInterval(cycleNiche, 3000);
    return () => clearInterval(id);
  }, [prefersReduced, cycleNiche]);

  /* ─── Subtle parallax on the device frame ─── */
  const frameY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [40, -40]
  );

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: prefersReduced ? "auto" : "200vh" }}
    >
      <div
        className="mx-auto max-w-[800px] px-6 md:px-12"
        style={{
          position: prefersReduced ? "relative" : "sticky",
          top: prefersReduced ? undefined : "50%",
          transform: prefersReduced ? undefined : "translateY(-50%)",
          paddingBlock: prefersReduced ? "var(--l-section-y)" : undefined,
        }}
      >
        {/* Section header */}
        <div className="mb-10 text-center">
          <motion.span
            initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.showcase.badge || "SEE IT IN ACTION"}
          </motion.span>
          <motion.h2
            initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.showcase.title}
          </motion.h2>
          <motion.p
            initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="mt-3 text-[0.95rem] text-[var(--l-text-2)]"
          >
            {t.showcase.subtitle}
          </motion.p>
        </div>

        {/* Device frame */}
        <motion.div
          style={{ y: frameY }}
          className="relative mx-auto max-w-[520px]"
        >
          {/* Accent glow behind device */}
          <div
            className="pointer-events-none absolute -inset-12 rounded-3xl opacity-50"
            style={{
              background: `radial-gradient(ellipse at center, ${NICHES[activeNiche].accent}15 0%, transparent 70%)`,
              transition: "background 600ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />

          {/* Browser chrome */}
          <div
            className="relative overflow-hidden rounded-xl border border-[var(--l-border)]"
            style={{
              boxShadow: `0 8px 40px rgba(0,0,0,0.3), 0 0 80px ${NICHES[activeNiche].accent}08`,
              transition: "box-shadow 600ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-[10px] w-[10px] rounded-full bg-[var(--l-text-3)]/30" />
                <div className="h-[10px] w-[10px] rounded-full bg-[var(--l-text-3)]/30" />
                <div className="h-[10px] w-[10px] rounded-full bg-[var(--l-text-3)]/30" />
              </div>
              <div className="ml-3 flex-1">
                <div className="mx-auto max-w-[200px] rounded-md bg-[var(--l-bg)] px-3 py-1 text-center text-[0.65rem] text-[var(--l-text-3)]">
                  tunegocio.arzac.studio
                </div>
              </div>
            </div>

            {/* Viewport — aspect ratio container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--l-bg)]">
              {NICHES.map((niche, i) => (
                <PlaceholderSite key={niche.id} niche={niche} isActive={i === activeNiche} />
              ))}
            </div>
          </div>

          {/* Niche tabs below device */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {NICHES.map((niche, i) => (
              <button
                key={niche.id}
                onClick={() => setActiveNiche(i)}
                className="relative rounded-full px-4 py-2 text-[0.8rem] font-medium transition-colors duration-200 active:scale-[0.97]"
                style={{
                  fontFamily: "var(--l-display)",
                  color: i === activeNiche ? "white" : "var(--l-text-3)",
                  background: i === activeNiche ? NICHES[activeNiche].accent : "transparent",
                  transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
                }}
                aria-pressed={i === activeNiche}
                aria-label={`Ver template de ${nicheLabels[i]}`}
              >
                {nicheLabels[i]}
              </button>
            ))}
          </div>

          {/* Scroll hint (only in scroll mode) */}
          {!prefersReduced && (
            <AnimatePresence>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="mt-4 text-center text-[0.75rem] text-[var(--l-text-3)]"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-0.5 inline-block"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
                {" "}Scroll para explorar
              </motion.p>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </section>
  );
}
