"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { Mascot } from "./mascot";

const WA_HREF = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "972557719141"}`;

export function Hero() {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <section className="at-hero">
      <div className="container">
        <div className="at-hero-inner">
          <div data-reveal data-in-view={mounted ? "true" : undefined}>
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
              <a className="at-btn-primary" href={WA_HREF} target="_blank" rel="noopener noreferrer">
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
          <div className="at-hero-teaser" data-reveal data-in-view={mounted ? "true" : undefined} style={{ transitionDelay: "100ms" }}>
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
            <div className="at-hero-ribbon" aria-hidden="true">
              <div className="at-hero-ribbon-inner">
                <span>{t.hero.ribbon || "shipped this week"}</span>
                <span>tattoo · TLV</span>
                <span>café · Florentin</span>
                <span>barber · Holon</span>
                <span>nails · Ramat Gan</span>
                <span>{t.hero.ribbon || "shipped this week"}</span>
                <span>tattoo · TLV</span>
                <span>café · Florentin</span>
                <span>barber · Holon</span>
                <span>nails · Ramat Gan</span>
              </div>
            </div>
            <Mascot variant="hero" mouseFollow delayMs={350} />
          </div>
        </div>
      </div>
    </section>
  );
}
