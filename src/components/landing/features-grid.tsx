"use client";

import { motion } from "framer-motion";
import { Calendar, Languages, Bot, BarChart3, Globe2, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

const ICONS = [Calendar, Languages, Bot, BarChart3, Globe2, RefreshCw];

export function FeaturesGrid() {
  const { t } = useT();

  return (
    <AnimatedSection className="mx-auto max-w-6xl px-5 py-20">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.features.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.features.subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {t.features.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="rounded-md border border-border/60 bg-bg-card/50 p-5 transition-colors hover:border-border-hover hover:bg-bg-card"
            >
              <Icon size={18} className="mb-3 text-accent" />
              <h3 className="mb-1 text-xs font-semibold text-text">{item.title}</h3>
              <p className="text-[11px] leading-relaxed text-text-muted">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
