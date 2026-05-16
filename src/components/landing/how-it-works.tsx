"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

export function HowItWorks() {
  const { t } = useT();

  return (
    <AnimatedSection className="mx-auto max-w-4xl px-5 py-20" id="how-it-works">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.howItWorks.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.howItWorks.subtitle}</p>
      </div>

      <div className="relative">
        <div className="absolute start-5 top-0 hidden h-full w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent sm:block" />

        <div className="space-y-8">
          {t.howItWorks.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative flex gap-5 ps-0 sm:ps-14"
            >
              <div className="absolute start-0 top-0 hidden h-10 w-10 items-center justify-center rounded-md border border-border bg-bg-card text-xs font-bold text-accent sm:flex">
                {i + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-bg-card text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-text">{step.title}</h3>
                </div>
                <h3 className="hidden text-sm font-semibold text-text sm:block">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
