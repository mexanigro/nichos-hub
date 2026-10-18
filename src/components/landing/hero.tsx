"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { whatsappHref } from "@/lib/whatsapp";
import { Flecha } from "./flecha";

const WA_HREF = whatsappHref();

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
                {t.hero.cta} <span className="at-btn-arrow"><Flecha /></span>
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
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 280px, 360px"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
