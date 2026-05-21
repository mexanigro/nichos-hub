"use client";

import { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "@/lib/i18n";

export function FAQ() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const uid = useId();

  return (
    <section className="l-section">
      <div className="mx-auto max-w-[700px]">
        <h2
          style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
          className="mb-10 text-center font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
        >
          {t.faq.title}
        </h2>

        <div className="space-y-2.5" role="region" aria-label={t.faq.title}>
          {t.faq.items.map((item, i) => {
            const isOpen = openIndex === i;
            const panelId = `${uid}-panel-${i}`;
            const triggerId = `${uid}-trigger-${i}`;
            return (
              <div
                key={i}
                className={`l-card-hover-glow rounded-[var(--l-radius)] border bg-[var(--l-card)] transition-colors duration-200 ${
                  isOpen ? "border-[var(--l-accent)]" : "border-[var(--l-border-subtle)] hover:border-[var(--l-border)]"
                }`}
              >
                <button
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-start md:px-7 md:py-[22px]"
                >
                  <span className="text-[0.95rem] font-medium text-[var(--l-text)]">
                    {item.question}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="shrink-0 text-[var(--l-text-3)] transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-[0.9rem] leading-[1.7] text-[var(--l-text-2)] md:px-7 md:pb-6">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
