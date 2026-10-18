"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";
import { SectionCta } from "./section-cta";
import React from "react";

const ICONS = [
  <svg key={0} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><circle cx="6.5" cy="7" r="0.8" fill="currentColor" /><circle cx="6.5" cy="17" r="0.8" fill="currentColor" /></svg>,
  <svg key={1} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>,
  <svg key={2} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 7a3 3 0 1 1 3 3l-7.5 7.5L7 20l-3 -3 2.5-2.5L14 7z" /></svg>,
  <svg key={10} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20 11 4h2l6 16" /><path d="M8 14h8" /></svg>,
  <svg key={11} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h9M7.5 3v2M5 9c1.5 3 4 5 7 6M10.5 5c-1 4-3.5 7-7 9" /><path d="m13 21 4-9 4 9M14.4 18h5.2" /></svg>,
  <svg key={3} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11A8 8 0 0 0 6 6.5" /><path d="M4 13a8 8 0 0 0 14 4.5" /><path d="M20 4v5h-5M4 20v-5h5" /></svg>,
  <svg key={4} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>,
  <svg key={6} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="12" cy="5" rx="8" ry="2.5" /><path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" /><path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" /></svg>,
  <svg key={5} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18" /><path d="M5 16l4-5 3 3 5-7" /><path d="M14 7h3v3" /></svg>,
  <svg key={9} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M4 5h16v11h-9l-4 4v-4H4z" /></svg>,
];

export function Everything() {
  const { t } = useT();
  const staggerRef = useReveal<HTMLUListElement>();
  const reveal = useReveal<HTMLElement>();

  return (
    <section className="at-ev" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span className="txt">{t.everything.eyebrow}</span>
            </div>
            <h2>
              {t.everything.title}
              <em>{t.everything.titleEm}</em>
            </h2>
          </div>
          <p>{t.everything.sub}</p>
        </div>

        <ul className="at-ev-items" ref={staggerRef} data-stagger role="list">
          {t.everything.items.map((it, i) => (
            <li className="at-ev-item" key={i} style={{ "--si": i } as React.CSSProperties}>
              <span className="ico" aria-hidden="true">{ICONS[i]}</span>
              <h3>{it.t}</h3>
              <p>{it.d}</p>
            </li>
          ))}
        </ul>

        <SectionCta to="pricing" />
      </div>
    </section>
  );
}
