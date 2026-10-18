"use client";
import { useState, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { SITES } from "@/lib/sites";
import { useReveal } from "@/hooks/use-scroll-reveal";
import { SectionCta } from "./section-cta";

export function Showcase() {
  const { t } = useT();
  const [active, setActive] = useState("barber");
  const reveal = useReveal<HTMLElement>();

  const meta = SITES.find((s) => s.id === active) ?? SITES[0];
  const siteT = t.showcase.sites[meta.id];
  const idx = SITES.findIndex((s) => s.id === active);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  // Flechas del teclado entre pestañas (en RTL la izquierda avanza) con un solo tabindex activo (LANDING-01).
  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const paso = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key as "ArrowRight" | "ArrowLeft"];
    const j = paso ? (i + paso + SITES.length) % SITES.length : e.key === "Home" ? 0 : e.key === "End" ? SITES.length - 1 : -1;
    if (j < 0) return;
    e.preventDefault();
    setActive(SITES[j].id);
    thumbs.current[j]?.focus();
  }

  return (
    <section className="at-section alt at-show" id="work" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span className="txt">{t.showcase.eyebrow}</span>
            </div>
            <h2>
              {t.showcase.title}
              <em>{t.showcase.titleEm}</em>
            </h2>
          </div>
          <p>{t.showcase.sub}</p>
        </div>

        <div className="stage">
          <div className="at-show-browser-wrap">
            <div className="at-browser">
              <div className="chrome">
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
                {/* LANDING-01 (Liam 2026-10-18): las demos viejas no se enlazan hasta que haya nuevas; el marco queda igual. */}
                <span className="url" aria-hidden="true" />
              </div>
              <div className="frame" role="tabpanel" id="at-show-panel" aria-labelledby={`at-show-tab-${active}`}>
                {SITES.map((s) => (
                  <Image
                    key={s.id}
                    src={s.img}
                    alt={s.id === active ? t.showcase.sites[s.id].name : ""}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    style={{ objectFit: "cover" }}
                    className={s.id === active ? "active" : ""}
                    loading={s.id === active ? undefined : "lazy"}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="at-show-meta">
            <div className="top">
              <span className="niche">
                {siteT.niche}
              </span>
              <span className="count" dir="ltr">
                {String(idx + 1).padStart(2, "0")}{" "}
                <span className="now">/</span>{" "}
                {String(SITES.length).padStart(2, "0")}
              </span>
            </div>
            <div className="name">{siteT.name}</div>
            <div className="tagline">{siteT.tagline}</div>
          </div>

          <div className="at-thumbs" role="tablist">
            {SITES.map((s, i) => {
              const st =
                t.showcase.sites[s.id];
              return (
                <button
                  key={s.id}
                  ref={(el) => { thumbs.current[i] = el; }}
                  type="button"
                  role="tab"
                  id={`at-show-tab-${s.id}`}
                  aria-controls="at-show-panel"
                  tabIndex={s.id === active ? 0 : -1}
                  onKeyDown={(e) => onKey(e, i)}
                  aria-selected={s.id === active}
                  aria-label={st.name}
                  onClick={() => setActive(s.id)}
                  className={`at-thumb${s.id === active ? " on" : ""}`}
                >
                  <Image
                    src={s.img}
                    alt=""
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                    loading="lazy"
                  />
                  <span className="at-thumb-label">
                    {st.niche}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <SectionCta to="pricing" />
      </div>
    </section>
  );
}
