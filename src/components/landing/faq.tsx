"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n/context";

export function Faq() {
  const { t } = useT();
  const [open, setOpen] = useState(0);

  return (
    <section className="at-section" id="faq">
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
                <div className="at-faq-q" onClick={() => setOpen(isOpen ? -1 : i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(isOpen ? -1 : i)}>
                  <span className="qt">{it.q}</span>
                  <span className="ico">+</span>
                </div>
                {isOpen && <div className="at-faq-a">{it.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
