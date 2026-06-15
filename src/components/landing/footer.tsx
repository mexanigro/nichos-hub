"use client";
import { useT } from "@/lib/i18n/context";
import { Mascot } from "./mascot";

const LEGAL_HREFS = ["/privacy", "/terms", "mailto:website@arzac.studio"];

export function Footer() {
  const { t } = useT();
  return (
    <footer className="at-foot" role="contentinfo">
      <div className="container at-foot-row">
        <div className="left">{t.foot.rights}</div>
        <nav className="center" aria-label="Legal">
          {t.foot.legal.map((l, i) => (
            <a key={i} href={LEGAL_HREFS[i]}>{l}</a>
          ))}
        </nav>
        <div className="right">
          <Mascot variant="footer" delayMs={0} />
          <span className="dot" aria-hidden="true" /> {t.statusLine}
        </div>
      </div>
    </footer>
  );
}
