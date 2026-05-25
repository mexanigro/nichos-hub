"use client";
import { useState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/context";
import { LogoMark } from "./logo-mark";
import { LangSwitch } from "./lang-switch";

export function Header() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const accum = useRef(0);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        setScrolled(y > 14);

        if (y < 80) {
          setHidden(false);
          accum.current = 0;
        } else if (Math.abs(delta) > 2) {
          if (delta > 0) {
            accum.current = Math.max(0, accum.current) + delta;
            if (accum.current > 40) setHidden(true);
          } else {
            accum.current = Math.min(0, accum.current) + delta;
            if (accum.current < -20) setHidden(false);
          }
        }

        lastY.current = y;
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`at-header${scrolled ? " is-scrolled" : ""}${hidden ? " is-hidden" : ""}`}
    >
      <div className="container at-header-inner">
        <a className="at-brand" href="/">
          <LogoMark size={22} color="var(--at-ink)" />
          <span className="wm">
            Arzac <em>studio</em>
          </span>
        </a>
        <nav className="at-nav">
          <a href="#work">{t.nav.work}</a>
          <a href="#crm">{t.nav.crm}</a>
          <a href="#agent">{t.nav.agent}</a>
          {t.nav.how && <a href="#how">{t.nav.how}</a>}
          <a href="#pricing">{t.nav.pricing}</a>
          <a href="#faq">{t.nav.faq}</a>
        </nav>
        <div className="at-controls">
          <LangSwitch />
          <a className="at-cta" href="#pricing">
            {t.nav.start} <span className="at-cta-arrow">&rarr;</span>
          </a>
        </div>
      </div>
    </header>
  );
}
