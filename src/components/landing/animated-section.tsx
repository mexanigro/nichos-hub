"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type TargetAndTransition } from "framer-motion";

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale";

const VARIANTS: Record<Variant, { hidden: TargetAndTransition; visible: TargetAndTransition }> = {
  "fade-up": {
    hidden: { opacity: 0, clipPath: "inset(4% 0% 4% 0%)" },
    visible: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
  },
  "fade-left": {
    hidden: { opacity: 0, clipPath: "inset(0% 4% 0% 0%)" },
    visible: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
  },
  "fade-right": {
    hidden: { opacity: 0, clipPath: "inset(0% 0% 0% 4%)" },
    visible: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96, clipPath: "inset(2% 2% 2% 2%)" },
    visible: { opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0%)" },
  },
};

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: Variant;
}

export function AnimatedSection({ children, className, delay = 0, variant = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReduced = useReducedMotion();

  const v = VARIANTS[variant];

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? v.visible : v.hidden}
      animate={inView ? v.visible : v.hidden}
      transition={{ duration: 0.65, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
