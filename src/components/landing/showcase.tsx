"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n/context";
import { SITES } from "@/lib/sites";

export function Showcase() {
  const { t } = useT();
  const [active, setActive] = useState("estetica");
  const [swap, setSwap] = useState(false);

  const meta = SITES.find((s) => s.id === active)!;
  const siteT = t.showcase.sites[active as keyof typeof t.showcase.sites];
  const idx = SITES.findIndex((s) => s.id === active);

  useEffect(() => {
    setSwap(true);
    const id = setTimeout(() => setSwap(false), 60);
    return () => clearTimeout(id);
  }, [active]);

  return (
    <section className="at-section alt at-show" id="work">
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

        {t.showcase.why && (
          <div className="at-why">
            <div>
              <div className="head">Why this matters</div>
              <div className="body">{t.showcase.why}</div>
            </div>
          </div>
        )}

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
              <div className="frame">
                <Image
                  src={meta.img}
                  alt={meta.niche}
                  fill
                  style={{ objectFit: "cover" }}
                  className={swap ? "swap" : ""}
                />
              </div>
            </div>
          </div>

          <div className="at-show-meta">
            <div className="top">
              <span className="niche">
                {meta.niche} &middot; {meta.city}
              </span>
              <span className="count">
                {String(idx + 1).padStart(2, "0")}{" "}
                <span className="now">/</span>{" "}
                {String(SITES.length).padStart(2, "0")}
              </span>
            </div>
            <div className="name">{siteT?.name || meta.niche}</div>
            <div className="tagline">{siteT?.tagline}</div>
          </div>

          <div className="at-thumbs" role="tablist">
            {SITES.map((s) => {
              const st =
                t.showcase.sites[s.id as keyof typeof t.showcase.sites];
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={s.id === active}
                  onClick={() => setActive(s.id)}
                  className={`at-thumb${s.id === active ? " on" : ""}`}
                >
                  <Image
                    src={s.img}
                    alt={s.niche}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <span className="at-thumb-label">
                    {(st?.name || s.niche).split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
