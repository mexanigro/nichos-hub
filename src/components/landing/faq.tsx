"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

export function Faq() {
  const { t } = useT();
  const [open, setOpen] = useState(0);
  const reveal = useReveal<HTMLElement>();

  return (
    <section className="at-section" id="faq" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row"><span className="dot" /><span className="txt">{t.faq.eyebrow}</span></div>
            <h2>{t.faq.title}<em>{t.faq.titleEm}</em></h2>
          </div>
        </div>
        <div className="at-faq-list">
          {t.faq.items.map((it, i) => {
            const isOpen = i === open;
            return (
              <div className={`at-faq-item${isOpen ? " open" : ""}`} key={i}>
                <button className="at-faq-q" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`at-faq-a-${i}`} id={`at-faq-q-${i}`} type="button">
                  <span className="qt">{it.q}</span>
                  <span className="ico" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {/* Cerrada, la respuesta no se lee ni recibe foco (LANDING-01). */}
                <div className="at-faq-a-wrap" id={`at-faq-a-${i}`} role="region" aria-labelledby={`at-faq-q-${i}`} aria-hidden={!isOpen} inert={!isOpen}>
                  <div className="at-faq-a">
                    <div className="at-faq-a-inner">{it.a}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
