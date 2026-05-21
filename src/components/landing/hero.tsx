"use client";

import { useRef, useEffect } from "react";
import { useT } from "@/lib/i18n";
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from "framer-motion";
import { Monitor, Users, Bot, Rocket, ShieldCheck, MessageSquare, Star } from "lucide-react";

const WA_HREF = `https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "")}`;

export function Hero() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const words = t.hero.headline.split(" ");

  const icons = t.hero.serviceIcons;
  const services = [
    { icon: Monitor, label: icons?.web ?? "WEB" },
    { icon: Users, label: icons?.crm ?? "CRM" },
    { icon: Bot, label: icons?.agent ?? "Agente" },
  ];

  /* Mouse-tracking parallax for orbs */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const orbX1 = useSpring(useTransform(mouseX, [-1, 1], [-30, 30]), { stiffness: 80, damping: 30 });
  const orbY1 = useSpring(useTransform(mouseY, [-1, 1], [-20, 20]), { stiffness: 80, damping: 30 });
  const orbX2 = useSpring(useTransform(mouseX, [-1, 1], [20, -20]), { stiffness: 60, damping: 25 });
  const orbY2 = useSpring(useTransform(mouseY, [-1, 1], [15, -15]), { stiffness: 60, damping: 25 });
  const orbX3 = useSpring(useTransform(mouseX, [-1, 1], [-15, 15]), { stiffness: 50, damping: 20 });
  const orbY3 = useSpring(useTransform(mouseY, [-1, 1], [-25, 25]), { stiffness: 50, damping: 20 });
  const orbX4 = useSpring(useTransform(mouseX, [-1, 1], [25, -25]), { stiffness: 70, damping: 28 });
  const orbY4 = useSpring(useTransform(mouseY, [-1, 1], [10, -10]), { stiffness: 70, damping: 28 });

  useEffect(() => {
    if (prefersReduced) return;
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouseX.set(nx);
      mouseY.set(ny);
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, [prefersReduced, mouseX, mouseY]);

  return (
    <section ref={sectionRef} className="l-tech-grid relative overflow-hidden pb-10 pt-32 px-6 md:pb-20 md:px-12 md:pt-44">
      {/* Enhanced glow orbs — mouse-tracking parallax */}
      <motion.div
        className="pointer-events-none absolute -left-[200px] top-[15%] hidden h-[500px] w-[500px] rounded-full md:block"
        style={{
          background: "radial-gradient(circle, var(--l-orb-teal) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 10s ease-in-out infinite",
          x: prefersReduced ? 0 : orbX1,
          y: prefersReduced ? 0 : orbY1,
        }}
      />
      <motion.div
        className="pointer-events-none absolute -right-[150px] top-[5%] hidden h-[400px] w-[400px] rounded-full md:block"
        style={{
          background: "radial-gradient(circle, var(--l-orb-purple) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 12s ease-in-out infinite 4s",
          x: prefersReduced ? 0 : orbX2,
          y: prefersReduced ? 0 : orbY2,
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-[25%] top-[55%] hidden h-[350px] w-[350px] rounded-full md:block"
        style={{
          background: "radial-gradient(circle, var(--l-orb-blue) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 14s ease-in-out infinite 7s",
          x: prefersReduced ? 0 : orbX3,
          y: prefersReduced ? 0 : orbY3,
        }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[10%] left-[55%] hidden h-[250px] w-[250px] rounded-full md:block"
        style={{
          background: "radial-gradient(circle, var(--l-orb-teal) 0%, transparent 70%)",
          opacity: 0.3,
          animation: prefersReduced ? "none" : "glow-drift 11s ease-in-out infinite 2s",
          x: prefersReduced ? 0 : orbX4,
          y: prefersReduced ? 0 : orbY4,
        }}
      />

      <div className="l-narrow relative z-10 text-center">
        {/* Service icon row */}
        <div className="mb-6 flex items-center justify-center gap-8 md:gap-10">
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.div
                key={i}
                initial={prefersReduced ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: prefersReduced ? 0 : i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[var(--l-border)] bg-[var(--l-surface)]">
                  <Icon size={20} style={{ color: "var(--l-accent)" }} strokeWidth={1.6} />
                </div>
                <span
                  style={{ fontFamily: "var(--l-display)" }}
                  className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[var(--l-text-3)]"
                >
                  {svc.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Badge — solid text, no shimmer */}
        <motion.span
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: "var(--l-display)" }}
          className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-surface)] px-4 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
        >
          {t.hero.badge || "WEBSITE + CRM + AI"}
        </motion.span>

        {/* Headline with staggered word animation */}
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
                delay: prefersReduced ? 0 : 0.35 + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="inline-block text-[var(--l-text)]"
              style={{ marginInlineEnd: "0.3em" }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Subheadline */}
        <motion.p
          initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-5 max-w-[520px] text-[1.125rem] leading-[1.7] text-[var(--l-text-2)]"
        >
          {t.hero.subheadline}
        </motion.p>

        {/* CTA — premium white button */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9"
        >
          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--l-display)",
              boxShadow: "0 0 40px rgba(255,255,255,0.06), 0 0 80px rgba(255,255,255,0.03)",
            }}
            className="inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-white px-8 py-3.5 text-[1rem] font-semibold text-[#0a0a0f] transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_50px_rgba(255,255,255,0.08)] active:scale-[0.97]"
          >
            {t.hero.cta}
            <Rocket size={16} aria-hidden="true" />
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { value: "47+", label: t.socialProof.activeBusinesses, icon: ShieldCheck },
            { value: "32+", label: t.socialProof.whatsappAgents, icon: MessageSquare },
            { value: "120+", label: t.socialProof.avgBookingsPerMonth, icon: Star },
          ].map((badge, i) => {
            const Icon = badge.icon;
            return (
              <span
                key={i}
                className="flex items-center gap-2 rounded-full border border-[var(--l-border)] bg-[var(--l-card)] px-4 py-2 text-[0.78rem]"
              >
                <Icon size={13} style={{ color: "var(--l-accent)" }} strokeWidth={1.8} aria-hidden="true" />
                <span className="tabular-nums font-bold text-[var(--l-stat-accent)]" style={{ textShadow: "var(--l-stat-glow)" }}>
                  {badge.value}
                </span>
                <span className="text-[var(--l-text-3)]">{badge.label}</span>
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
