"use client";

import { motion } from "framer-motion";
import { Globe, Users, MessageSquare } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

const ICONS = [Globe, Users, MessageSquare];

export function Pillars() {
  const { t } = useT();

  const items = [
    { icon: ICONS[0], ...t.pillars.web },
    { icon: ICONS[1], ...t.pillars.crm },
    { icon: ICONS[2], ...t.pillars.whatsapp },
  ];

  return (
    <AnimatedSection className="mx-auto max-w-6xl px-5 py-20" id="features">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.pillars.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.pillars.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="group rounded-md border border-border bg-bg-card p-6 transition-all hover:border-border-hover hover:shadow-glow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-text">{item.title}</h3>
              <p className="text-xs leading-relaxed text-text-secondary">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
