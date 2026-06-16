"use client";
import { useState, useEffect } from "react";
import { useT } from "@/lib/i18n/context";
import { LogoMark } from "./logo-mark";
import { LangSwitch } from "./lang-switch";

export function Header() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Navbar inteligente (sticky auto-hide): persigue el scroll, se esconde al
  // bajar y reaparece al subir. Bajo prefers-reduced-motion queda siempre
  // visible (nunca aplica is-hidden). El cambio de fondo/sombra (is-scrolled)
  // mejora la legibilidad cuando flota sobre el contenido.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = window.scrollY;
    let ticking = false;
    function update() {
      const y = window.scrollY;
      setScrolled(y > 14);
      if (!reduce) {
        const delta = y - lastY;
        if (Math.abs(delta) > 6) {
          // Esconder al bajar pasada la zona del hero; mostrar al subir.
          if (delta > 0 && y > 140) setHidden(true);
          else if (delta < 0) setHidden(false);
          lastY = y;
        }
        if (y <= 140) setHidden(false); // cerca del top siempre visible
      }
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`at-header${scrolled ? " is-scrolled" : ""}${hidden ? " is-hidden" : ""}`}>
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
