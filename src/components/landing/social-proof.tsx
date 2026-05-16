"use client";

import { useInView } from "framer-motion";
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
    <span
      ref={ref}
      style={{ fontFamily: "var(--l-display)", fontSize: "clamp(2.4rem, 4vw, 3rem)" }}
      className="tabular-nums font-bold tracking-[-0.03em] text-[var(--l-text)]"
    >
      {value}{suffix}
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
    <section className="border-t border-[var(--l-border-subtle)]">
      <div className="l-container grid grid-cols-1 gap-8 py-[60px] sm:grid-cols-3 md:py-[80px]">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <Counter target={stat.value} suffix={stat.suffix} />
            <p className="mt-1.5 text-[0.85rem] font-medium text-[var(--l-text-3)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
