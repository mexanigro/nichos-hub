"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

export function FinalCTA() {
  const { t } = useT();

  return (
    <AnimatedSection className="px-5 py-20">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-md border border-border bg-bg-card p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -end-20 -top-20 h-60 w-60 rounded-full bg-accent-from/8 blur-[80px]" />
          <div className="absolute -bottom-20 -start-20 h-60 w-60 rounded-full bg-accent-to/8 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-text-secondary">{t.cta.subtitle}</p>
          <motion.a
            href="#builder"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-6 py-3 text-sm font-semibold text-white shadow-glow-md"
          >
            {t.cta.button}
            <ArrowRight size={16} />
          </motion.a>
        </div>
      </div>
    </AnimatedSection>
  );
}
