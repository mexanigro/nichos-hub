"use client";

import { useRef, type MouseEvent } from "react";
import { Globe, Users, MessageSquare, Calendar, Languages, Bot, BarChart3, Globe2, RefreshCw } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n";

// Map features to each pillar
const PILLAR_FEATURES = [
  [Calendar, Languages], // Web pillar features
  [BarChart3, Globe2],   // CRM pillar features
  [Bot, RefreshCw],      // WhatsApp pillar features
];

const PILLAR_ICONS = [Globe, Users, MessageSquare];
const PILLAR_COLORS = ["#ffffff", "#a1a1aa", "#25D366"];

function TiltCard({ children, index, featured = false }: { children: React.ReactNode; index: number; featured?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  // Dynamic shadow based on tilt
  const shadowX = useTransform(x, [-0.5, 0.5], [8, -8]);
  const shadowY = useTransform(y, [-0.5, 0.5], [-8, 8]);

  function handleMouseMove(e: MouseEvent) {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20, clipPath: "inset(4% 0% 4% 0%)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        rotateX: prefersReduced ? 0 : rotateX,
        rotateY: prefersReduced ? 0 : rotateY,
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className="group"
    >
      {children}
    </motion.div>
  );
}

export function Features() {
  const { t } = useT();

  const pillars = [
    { icon: PILLAR_ICONS[0], color: PILLAR_COLORS[0], ...t.pillars.web, featureIcons: PILLAR_FEATURES[0] },
    { icon: PILLAR_ICONS[1], color: PILLAR_COLORS[1], ...t.pillars.crm, featureIcons: PILLAR_FEATURES[1] },
    { icon: PILLAR_ICONS[2], color: PILLAR_COLORS[2], ...t.pillars.whatsapp, featureIcons: PILLAR_FEATURES[2] },
  ];

  // Map feature items to their pillar (2 per pillar)
  const featureItems = t.features.items;

  return (
    <section className="l-section l-dot-grid relative overflow-hidden bg-[var(--l-section-alt)]" id="features">
      <div className="l-container relative z-10">
        <div className="mb-10 text-center md:mb-14">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.features.badge || "FEATURES"}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.pillars.title}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--l-text-2)]">
            {t.pillars.subtitle}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, i) => {
            const PillarIcon = pillar.icon;
            const isCRM = i === 1;
            return (
              <TiltCard key={i} index={i} featured={isCRM}>
                <div
                  className={`l-card-hover-glow rounded-[var(--l-radius-lg)] border bg-[var(--l-card)] p-7 ${
                    isCRM ? "border-white/20" : "border-[var(--l-border)]"
                  }`}
                  style={{
                    boxShadow: isCRM
                      ? "var(--l-shadow-card), 0 0 30px rgba(255,255,255,0.04)"
                      : "var(--l-shadow-card)",
                  }}
                >
                  {/* Pillar header */}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: pillar.color + "18" }}
                    >
                      <PillarIcon size={22} style={{ color: pillar.color }} />
                    </div>
                    <div>
                      <h3
                        style={{ fontFamily: "var(--l-display)" }}
                        className="text-[1.1rem] font-semibold text-[var(--l-text)]"
                      >
                        {pillar.title}
                      </h3>
                      <p className="mt-1 text-[0.88rem] leading-[1.6] text-[var(--l-text-2)]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 h-px bg-[var(--l-border-subtle)]" />

                  {/* Feature bullets from this pillar */}
                  <div className="flex flex-col gap-3">
                    {pillar.featureIcons.map((FIcon, fi) => {
                      const featureIndex = i * 2 + fi;
                      const feature = featureItems[featureIndex];
                      if (!feature) return null;
                      return (
                        <div key={fi} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--l-accent-muted)]">
                            <FIcon size={14} style={{ color: "var(--l-accent)" }} />
                          </div>
                          <div>
                            <p
                              style={{ fontFamily: "var(--l-display)" }}
                              className="text-[0.88rem] font-semibold text-[var(--l-text)]"
                            >
                              {feature.title}
                            </p>
                            <p className="mt-0.5 text-[0.82rem] leading-[1.55] text-[var(--l-text-3)]">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>

        {/* Coming soon */}
        <p className="mt-8 text-center text-[0.82rem] text-[var(--l-text-3)]">
          {(t.features as Record<string, unknown>).comingSoon as string || "Más funciones en camino…"}
        </p>
      </div>
    </section>
  );
}
