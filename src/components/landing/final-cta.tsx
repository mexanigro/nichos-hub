"use client";
import { useT } from "@/lib/i18n/context";

export function FinalCta() {
  const { t } = useT();
  return (
    <div className="container at-final-wrap">
      <section className="at-final">
        <span className="ornament">→</span>
        <h2>{t.final.a}<br /><em>{t.final.b}</em></h2>
        <div className="row">
          <a className="btn" href={t.final.ctaHref || "#pricing"}>
            {t.final.cta}{" "}
            <span style={{ fontFamily: "var(--at-serif)", fontStyle: "italic", fontSize: 20 }}>→</span>
          </a>
          <span className="note">{t.final.note}</span>
        </div>
      </section>
    </div>
  );
}
