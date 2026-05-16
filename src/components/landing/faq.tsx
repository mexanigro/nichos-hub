"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

export function FAQ() {
  const { t } = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <AnimatedSection className="mx-auto max-w-2xl px-5 py-20">
      <h2 className="mb-10 text-center text-2xl font-bold text-text sm:text-3xl">
        {t.faq.title}
      </h2>

      <div className="space-y-2">
        {t.faq.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="rounded-md border border-border bg-bg-card/50 transition-colors hover:border-border-hover"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-start"
              >
                <span className="text-xs font-medium text-text">{item.question}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-text-muted transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-xs leading-relaxed text-text-secondary">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
