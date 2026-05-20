"use client";

import { Clock, Zap, Users, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n";

const WA_GREEN = "#25D366";
const REASON_ICONS = [Clock, Zap, Users, MessageCircle];

export function WhatsAppAgent() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();

  return (
    <section className="l-section l-dot-grid relative overflow-hidden bg-[var(--l-section-alt)]" id="whatsapp-agent">
      <div className="l-container relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Copy — left column */}
          <div>
            <motion.span
              initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              style={{ fontFamily: "var(--l-display)" }}
              className="inline-block rounded-[var(--l-radius-pill)] border px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em]"
              // WhatsApp green as the unique content color
            >
              <span style={{ color: WA_GREEN, borderColor: WA_GREEN + "40" }}>
                {t.whatsappAgent.badge}
              </span>
            </motion.span>

            <motion.h2
              initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
              style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
              className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
            >
              {t.whatsappAgent.title}
            </motion.h2>

            <motion.p
              initial={prefersReduced ? {} : { opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
              className="mt-4 max-w-[460px] text-[0.95rem] leading-[1.65] text-[var(--l-text-2)]"
            >
              {t.whatsappAgent.description}
            </motion.p>

            {/* Feature reasons */}
            <div className="mt-6 flex flex-col gap-3">
              {t.whatsappAgent.reasons.map((reason, i) => {
                const Icon = REASON_ICONS[i] || MessageCircle;
                return (
                  <motion.div
                    key={i}
                    initial={prefersReduced ? {} : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.18 + i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: WA_GREEN + "18" }}
                    >
                      <Icon size={15} style={{ color: WA_GREEN }} strokeWidth={1.8} />
                    </div>
                    <span className="text-[0.9rem] text-[var(--l-text)]">{reason}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Chat mockup — right column */}
          <motion.div
            initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative mx-auto w-full max-w-[380px]"
          >
            {/* Phone frame */}
            <div
              className="overflow-hidden rounded-[24px] border border-[var(--l-border)] bg-[var(--l-card)]"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)" }}
            >
              {/* WhatsApp header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ background: WA_GREEN }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[0.85rem] font-semibold text-white">Arzac Studio</p>
                  <p className="text-[0.7rem] text-white/80">{t.whatsappAgent.online}</p>
                </div>
                {/* 24/7 badge */}
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[0.65rem] font-bold text-white">
                  24/7 ✓
                </span>
              </div>

              {/* Chat area */}
              <div
                className="flex flex-col gap-2.5 px-4 py-5"
                style={{ minHeight: 260, background: "var(--l-bg)" }}
              >
                {t.whatsappAgent.conversation.map((msg, i) => {
                  const isClient = msg.from === "client";
                  return (
                    <motion.div
                      key={i}
                      initial={prefersReduced ? {} : { opacity: 0, y: 8, scale: 0.97 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.35,
                        delay: prefersReduced ? 0 : 0.3 + i * 0.12,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-[1.5] ${
                        isClient
                          ? "self-end bg-[var(--l-surface)] text-[var(--l-text)]"
                          : "self-start text-white"
                      }`}
                      style={
                        isClient
                          ? undefined
                          : { background: WA_GREEN }
                      }
                    >
                      {msg.text}
                    </motion.div>
                  );
                })}
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 border-t border-[var(--l-border-subtle)] bg-[var(--l-surface)] px-4 py-3">
                <div className="flex-1 rounded-full border border-[var(--l-border)] bg-[var(--l-bg)] px-4 py-2 text-[0.78rem] text-[var(--l-text-3)]">
                  Escribí un mensaje…
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: WA_GREEN }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
