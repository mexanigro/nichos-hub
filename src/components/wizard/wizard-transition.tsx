"use client";

import { useMemo } from "react";

interface WizardTransitionProps {
  stepKey: string;
  direction: 1 | -1;
  isRTL: boolean;
  children: React.ReactNode;
}

export function WizardTransition({
  stepKey,
  direction,
  isRTL,
  children,
}: WizardTransitionProps) {
  const dir = isRTL ? -direction : direction;

  const prefersReduced = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // key={stepKey} forces React to unmount/remount on step change,
  // which triggers the CSS animation fresh each time.
  return (
    <div
      key={stepKey}
      className={`wiz-transition-pane${prefersReduced ? "" : " wiz-slide-enter"}`}
      style={{ "--wz-slide-dir": dir } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
