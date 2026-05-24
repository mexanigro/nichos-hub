"use client";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/context";
import { LogoMark } from "./logo-mark";
import { LangSwitch } from "./lang-switch";

export function Header() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = Math.abs(y - lastY);
        setScrolled(y > 14);
        if (y < 80) setHidden(false);
        else if (delta > 6) setHidden(y > lastY);
        lastY = y;
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
