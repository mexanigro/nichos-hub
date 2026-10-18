"use client";
import { useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { SITES } from "@/lib/sites";
import { useReveal } from "@/hooks/use-scroll-reveal";
import { SectionCta } from "./section-cta";

export function Showcase() {
  const { t } = useT();
  const [active, setActive] = useState("estetica");
  const reveal = useReveal<HTMLElement>();

  const meta = SITES.find((s) => s.id === active) ?? SITES[0];
  const siteT = t.showcase.sites[meta.id];
  const idx = SITES.findIndex((s) => s.id === active);

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
                <span className="url">
                  <span className="url-text">https://{meta.url}</span>
                </span>
                <a
                  className="open-btn"
                  href={`https://${meta.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.showcase.open} &#8599;
                </a>
              </div>
              <div className="frame" role="tabpanel">
                {SITES.map((s) => (
                  <Image
                    key={s.id}
                    src={s.img}
                    alt={t.showcase.sites[s.id].name}
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
              <span className="count">
                {String(idx + 1).padStart(2, "0")}{" "}
                <span className="now">/</span>{" "}
                {String(SITES.length).padStart(2, "0")}
              </span>
            </div>
            <div className="name">{siteT.name}</div>
            <div className="tagline">{siteT.tagline}</div>
          </div>

          <div className="at-thumbs" role="tablist">
            {SITES.map((s) => {
              const st =
                t.showcase.sites[s.id];
              return (
                <button
                  key={s.id}
                  role="tab"
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
