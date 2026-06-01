"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

export function FinalCta() {
  const { t } = useT();
  const reveal = useReveal<HTMLElement>();
  return (
    <div className="container at-final-wrap">
      <section className="at-final" ref={reveal} data-reveal>
        <span className="ornament">→</span>
        <h2>{t.final.a}<br /><em>{t.final.b}</em></h2>
        <div className="row">
          <a
            className="btn"
            href={t.final.ctaHref || "#pricing"}
            {...(t.final.ctaHref?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {t.final.cta}{" "}
            <span style={{ fontFamily: "var(--at-serif)", fontStyle: "italic", fontSize: 20 }}>→</span>
          </a>
          <span className="note">{t.final.note}</span>
        </div>
      </section>
    </div>
  );
}
