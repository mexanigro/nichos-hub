"use client";

import { motion, useInView } from "framer-motion";
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
    const duration = 1500;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [inView, target]);

  return (
    <span ref={ref} className="text-2xl font-bold text-text sm:text-3xl">
      {value}
      {suffix}
    </span>
  );
}

export function SocialProof() {
  const { t } = useT();

  const stats = [
    { value: 47, suffix: "+", label: t.socialProof.activeBusinesses },
    { value: 320, suffix: "+", label: t.socialProof.avgBookingsPerMonth },
    { value: 98, suffix: "%", label: t.socialProof.clientSatisfaction },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-5 py-16"
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="flex flex-col items-center gap-1 text-center"
        >
          <Counter target={stat.value} suffix={stat.suffix} />
          <span className="text-[11px] text-text-muted sm:text-xs">{stat.label}</span>
        </motion.div>
      ))}
    </motion.section>
  );
}
