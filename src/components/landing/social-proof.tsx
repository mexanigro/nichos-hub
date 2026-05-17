"use client";

import { useInView, motion, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    let rafId: number;
    const duration = 1800;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums font-bold text-[var(--l-text)]">
      {value}{suffix}
    </span>
  );
}

export function SocialProof() {
  const { t } = useT();
  const prefersReduced = useReducedMotion();

  const badges = [
    { value: 47, suffix: "+", label: t.socialProof.activeBusinesses },
    { value: 32, suffix: "+", label: t.socialProof.whatsappAgents },
    { value: 98, suffix: "%", label: t.socialProof.satisfaction },
  ];

  return (
    <section className="py-8">
      <div className="l-container flex flex-wrap items-center justify-center gap-3">
        {badges.map((badge, i) => (
          <motion.div
            key={i}
            initial={prefersReduced ? {} : { opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-full border border-[var(--l-border)] bg-[var(--l-card)] px-4 py-2 text-[0.82rem]"
          >
            <Counter target={badge.value} suffix={badge.suffix} />
            <span className="text-[var(--l-text-3)]">{badge.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
