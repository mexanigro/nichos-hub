"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Hero() {
  const { t } = useT();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-5 pt-20 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent-from/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-accent-to/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 mx-auto max-w-3xl"
      >
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-text sm:text-4xl md:text-5xl lg:text-6xl">
          {t.hero.headline}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base md:text-lg"
        >
          {t.hero.subheadline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8"
        >
          <a
            href="#builder"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-accent-from to-accent-to px-6 py-3 text-sm font-semibold text-white shadow-glow-md transition-all hover:shadow-glow-lg hover:brightness-110"
          >
            {t.hero.cta}
            <ArrowDown size={16} className="animate-bounce" />
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-10 text-xs text-text-muted"
        >
          {t.hero.trustedBy}
        </motion.p>
      </motion.div>
    </section>
  );
}
