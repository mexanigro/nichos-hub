"use client";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/context";
import { LogoMark } from "./logo-mark";
import { LangSwitch } from "./lang-switch";

export function Header() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);

  // Navbar no-sticky: solo seguimos un leve cambio de borde al empezar a
  // scrollear. Sin auto-hide (el header scrollea con la página).
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 14);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`at-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container at-header-inner">
        <a className="at-brand" href="/">
          <span className="at-brand-face" aria-hidden="true">
            <img src="/mascot/hedgehog/processed/face.png" alt="" width={34} height={34} loading="eager" decoding="async" />
          </span>
          <LogoMark size={22} color="var(--at-ink)" />
          <span className="wm">
            Arzac <em>studio</em>
          </span>
        </a>
        <nav className="at-nav" aria-label="Main">
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
