"use client";

import { useT } from "@/lib/i18n";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Users, Bot, Rocket, ShieldCheck, MessageSquare, Star } from "lucide-react";

export function Hero() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();

  const words = t.hero.headline.split(" ");

  const icons = t.hero.serviceIcons;
  const services = [
    { icon: Monitor, label: icons?.web ?? "WEB" },
    { icon: Users, label: icons?.crm ?? "CRM" },
    { icon: Bot, label: icons?.agent ?? "Agente" },
  ];

  return (
    <section className="l-tech-grid relative overflow-hidden pb-10 pt-32 px-6 md:pb-20 md:px-12 md:pt-44">
      {/* Enhanced glow orbs — vivid drift animation */}
      <div
        className="pointer-events-none absolute -left-[200px] top-[15%] h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--l-orb-teal) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 10s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-[150px] top-[5%] h-[400px] w-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--l-orb-purple) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 12s ease-in-out infinite 4s",
        }}
      />
      <div
        className="pointer-events-none absolute left-[25%] top-[55%] h-[350px] w-[350px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--l-orb-blue) 0%, transparent 70%)",
          animation: prefersReduced ? "none" : "glow-drift 14s ease-in-out infinite 7s",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[10%] left-[55%] h-[250px] w-[250px] rounded-full"
        style={{
          background: "radial-gradient(circle, var(--l-orb-teal) 0%, transparent 70%)",
          opacity: 0.3,
          animation: prefersReduced ? "none" : "glow-drift 11s ease-in-out infinite 2s",
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
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[var(--l-text-3)]"
                >
                  {svc.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Badge with shimmer */}
        <motion.span
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prefersReduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
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

        {/* CTA with glow + rocket icon */}
        <motion.div
          initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: prefersReduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9"
        >
          <a
            href="#builder"
            style={{
              fontFamily: "var(--l-display)",
              boxShadow: "0 0 30px var(--l-accent-glow), 0 0 60px var(--l-accent-glow)",
            }}
            className="inline-flex items-center gap-2.5 rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-8 py-3.5 text-[1rem] font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_50px_var(--l-accent-glow)] active:scale-[0.97]"
          >
            {t.hero.cta}
            <Rocket size={16} aria-hidden="true" />
          </a>
        </motion.div>

        {/* Social proof — inline, same spacing as badge→h1 */}
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
