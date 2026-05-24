"use client";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";

export function Hero() {
  const { t } = useT();
  return (
    <section className="at-hero">
      <div className="container">
        <div className="at-hero-inner">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span className="txt">{t.hero.eyebrow}</span>
            </div>
            <h1 className="at-h1">
              {t.hero.h1a}
              <span className="ital">{t.hero.h1b}</span>
              {t.hero.h1c}
            </h1>
            <p className="at-hero-sub">{t.hero.sub}</p>
            <div className="at-hero-actions">
              <a className="at-btn-primary" href="#pricing">
                {t.hero.cta}{" "}
                <span
                  style={{
                    fontFamily: "var(--at-serif)",
                    fontStyle: "italic",
                    fontSize: 18,
                  }}
                >
                  &rarr;
                </span>
              </a>
              <a className="at-btn-link" href="#work">
                {t.hero.ghost}
              </a>
            </div>
          </div>
          <div className="at-hero-teaser">
            <div className="at-hero-phone" aria-hidden="true">
              <div className="island" />
              <div className="screen">
                <Image
                  src="/landing/hero-onyx-steel-vertical.png"
                  alt="Onyx & Steel barbershop"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            </div>
            <div className="at-hero-ribbon">
              <div className="at-hero-ribbon-inner">
                <span>shipped this week</span>
                <span>tattoo &middot; TLV</span>
                <span>caf&eacute; &middot; Florentin</span>
                <span>barber &middot; Holon</span>
                <span>nails &middot; Ramat Gan</span>
                <span>shipped this week</span>
                <span>tattoo &middot; TLV</span>
                <span>caf&eacute; &middot; Florentin</span>
                <span>barber &middot; Holon</span>
                <span>nails &middot; Ramat Gan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
