"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";
import React from "react";

export function Process() {
  const { t } = useT();
  const staggerRef = useReveal<HTMLDivElement>();

  return (
    <section className="at-section" id="how">
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row"><span className="dot" /><span className="txt">{t.process.eyebrow}</span></div>
            <h2>{t.process.title}<em>{t.process.titleEm}</em></h2>
          </div>
        </div>
        <div className="at-proc-grid" ref={staggerRef} data-stagger>
          {t.process.steps.map((s, i) => (
            <div className="at-step" key={i} style={{ "--si": i } as React.CSSProperties}>
              <div className="stp-num">/0{i + 1}</div>
              <div className="stp-body">
                <div className="stp-name">{s.t}</div>
                <div className="stp-d">{s.d}</div>
                <div className="stp-t">{s.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
