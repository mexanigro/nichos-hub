"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";
import { whatsappHref } from "@/lib/whatsapp";
import { Flecha } from "./flecha";

const WA_HREF = whatsappHref();

export function FinalCta() {
  const { t } = useT();
  const reveal = useReveal<HTMLElement>();
  return (
    <div className="container at-final-wrap">
      <section className="at-final" ref={reveal} data-reveal>
        <h2>{t.final.a}<br /><em>{t.final.b}</em></h2>
        <div className="row">
          <a className="btn" href={WA_HREF} target="_blank" rel="noopener noreferrer">
            {t.final.cta} <span className="at-btn-arrow"><Flecha /></span>
          </a>
          <span className="note">{t.final.note}</span>
        </div>
      </section>
    </div>
  );
}
