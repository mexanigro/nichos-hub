"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

interface WizardStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  errors?: string[];
}

export function WizardStep({ title, subtitle, children, errors }: WizardStepProps) {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  }, []);

  // Translate error keys (e.g. "errNiche" → t.wizard.errNiche)
  function translateError(err: string): string {
    const wizardT = t.wizard as Record<string, unknown>;
    return typeof wizardT[err] === "string" ? (wizardT[err] as string) : err;
  }

  return (
    <div className={`wiz-step${mounted ? " in" : ""}`} ref={ref}>
      <div className="wiz-step-header">
        <h2 className="wiz-step-title">{title}</h2>
        {subtitle && <p className="wiz-step-subtitle">{subtitle}</p>}
      </div>
      <div className="wiz-step-body">
        {children}
      </div>
      {errors && errors.length > 0 && (
        <div className="wiz-errors">
          {errors.map((err, i) => (
            <p key={i} className="wiz-error">{translateError(err)}</p>
          ))}
        </div>
      )}
    </div>
  );
}
