"use client";
import { useT } from "@/lib/i18n/context";

const LEGAL_HREFS = ["/privacy", "/terms", "mailto:website@arzac.studio"];

export function Footer() {
  const { t } = useT();
  return (
    <footer className="at-foot" role="contentinfo">
      <div className="container at-foot-row">
        <div className="left">{t.foot.rights}</div>
        <nav className="center" aria-label={t.a11y.legalNav}>
          {t.foot.legal.map((l, i) => (
            <a key={i} href={LEGAL_HREFS[i]}>{l}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
