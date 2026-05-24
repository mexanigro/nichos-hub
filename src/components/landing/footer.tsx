"use client";
import { useT } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useT();
  return (
    <footer className="at-foot">
      <div className="container at-foot-row">
        <div className="left">{t.foot.rights}</div>
        <div className="center">
          {t.foot.legal.map((l, i) => (
            <a key={i} href="#">{l}</a>
          ))}
        </div>
        <div className="right">
          <span className="dot" /> {t.statusLine}
        </div>
      </div>
    </footer>
  );
}
