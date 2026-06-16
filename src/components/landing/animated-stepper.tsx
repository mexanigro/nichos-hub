"use client";
import { useRef, useLayoutEffect, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { useReveal } from "@/hooks/use-scroll-reveal";

export interface StepperStep {
  title: string;
  desc: string;
  time?: string;
}

/** Anchor (fraction of viewport height) a step's node must cross to count as "reached". */
const ACTIVE_ANCHOR = 0.62;

function Step({
  index,
  step,
  registerDot,
}: {
  index: number;
  step: StepperStep;
  registerDot: (i: number, el: HTMLElement | null) => void;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div className="at-step" data-reveal ref={ref}>
      <div className="stp-num">
        <span className="stp-dot" ref={(el) => registerDot(index, el)} />/0{index + 1}
      </div>
      <div className="stp-body">
        <div className="stp-name">{step.title}</div>
        <div className="stp-d">{step.desc}</div>
        {step.time && <div className="stp-t">{step.time}</div>}
      </div>
    </div>
  );
}

/**
 * Vertical stepper with a gradient connector line that draws on scroll
 * (accent -> secondary), a node per step that lights up as it's reached,
 * and a per-step fade/slide reveal. Reusable across niches: pass the steps
 * and theme the line via the --at-accent / --at-leaf custom properties.
 */
export function AnimatedStepper({ steps }: { steps: StepperStep[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLElement | null)[]>([]);
  const reduce = useReducedMotion();
  // Evita hydration mismatch: framer-motion emite transform en SSR pero el
  // cliente lo aplica post-hidratación. Render plano (matchea SSR) hasta montar.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start 80%", "end 55%"],
  });

  // Light up every node up to (and including) the given index.
  const setActiveUpTo = useCallback((idx: number) => {
    const els = wrapRef.current?.querySelectorAll<HTMLElement>(".at-step");
    els?.forEach((el, i) => {
      el.dataset.active = String(i <= idx);
    });
  }, []);

  // Index of the last node whose center has crossed the active anchor line.
  const computeActive = useCallback(() => {
    const anchor = window.innerHeight * ACTIVE_ANCHOR;
    let idx = -1;
    dotRefs.current.forEach((d, i) => {
      if (d && d.getBoundingClientRect().top <= anchor) idx = i;
    });
    setActiveUpTo(idx);
  }, [setActiveUpTo]);

  // Pin the connector line to the first/last node centers so it reads as
  // threading through the numbers. Re-measure on layout/resize/font changes.
  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const line = lineRef.current;
      const dots = dotRefs.current.filter(Boolean) as HTMLElement[];
      if (!wrap || !line || dots.length < 2) return;
      const wrapTop = wrap.getBoundingClientRect().top;
      const first = dots[0].getBoundingClientRect();
      const last = dots[dots.length - 1].getBoundingClientRect();
      const top = first.top - wrapTop + first.height / 2;
      const bottom = last.top - wrapTop + last.height / 2;
      line.style.top = `${top}px`;
      line.style.height = `${Math.max(0, bottom - top)}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [steps.length]);

  // Reduced motion: line full, all nodes lit. Otherwise sync nodes to the
  // initial scroll position so deep-links land with the right nodes lit.
  useEffect(() => {
    if (reduce) {
      setActiveUpTo(steps.length - 1);
      return;
    }
    const raf = requestAnimationFrame(computeActive);
    return () => cancelAnimationFrame(raf);
  }, [reduce, steps.length, setActiveUpTo, computeActive]);

  useMotionValueEvent(scrollYProgress, "change", () => {
    if (!reduce) computeActive();
  });

  return (
    <div className="at-stepper" ref={wrapRef}>
      <div className="at-stepper-line" ref={lineRef} aria-hidden="true">
        <span className="rail" />
        {mounted ? (
          <motion.span
            className="rail-fill"
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
          />
        ) : (
          <span className="rail-fill" style={{ transform: "scaleY(0)" }} />
        )}
      </div>
      <div className="at-proc-grid">
        {steps.map((s, i) => (
          <Step key={i} index={i} step={s} registerDot={(idx, el) => (dotRefs.current[idx] = el)} />
        ))}
      </div>
    </div>
  );
}
