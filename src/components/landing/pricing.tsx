"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "./animated-section";

export function Pricing() {
  const { t } = useT();

  return (
    <AnimatedSection className="mx-auto max-w-4xl px-5 py-20" id="pricing">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.pricing.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.pricing.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {t.pricing.plans.map((plan, i) => {
          const isPopular = i === 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
              className={`relative rounded-md border p-6 transition-all ${
                isPopular
                  ? "border-accent/40 bg-bg-card shadow-glow-sm"
                  : "border-border bg-bg-card/50"
              }`}
            >
              {isPopular && (
                <span className="absolute -top-2.5 start-4 rounded-sm bg-gradient-to-r from-accent-from to-accent-to px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {t.pricing.popular}
                </span>
              )}

              <h3 className="text-sm font-semibold text-text">{plan.name}</h3>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-text">{plan.price}</span>
                <span className="text-sm text-text-muted">₪{t.pricing.monthly}</span>
              </div>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-xs text-text-secondary">
                    <Check size={14} className="mt-0.5 shrink-0 text-accent" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#builder"
                className={`mt-6 block rounded-md py-2.5 text-center text-xs font-semibold transition-all ${
                  isPopular
                    ? "bg-gradient-to-r from-accent-from to-accent-to text-white hover:brightness-110"
                    : "border border-border text-text hover:border-accent hover:text-accent"
                }`}
              >
                {t.pricing.cta}
              </a>
            </motion.div>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
