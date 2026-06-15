"use client";
import { useT } from "@/lib/i18n/context";
import { AnimatedStepper } from "./animated-stepper";

export function Process() {
  const { t } = useT();

  return (
    <section className="at-section" id="how">
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row"><span className="dot" /><span className="txt">{t.process.eyebrow}</span></div>
            <h2>{t.process.title}<em>{t.process.titleEm}</em></h2>
          </div>
        </div>
        <AnimatedStepper
          steps={t.process.steps.map((s) => ({ title: s.t, desc: s.d, time: s.time }))}
        />
      </div>
    </section>
  );
}
