"use client";
import { useT } from "@/lib/i18n/context";
import { useReveal } from "@/hooks/use-scroll-reveal";

export function Evergreen() {
  const { t } = useT();
  const reveal = useReveal<HTMLElement>();
  if (!t.evergreen) return null;

  return (
    <section className="at-fresh" ref={reveal} data-reveal>
      <div className="container">
        <div className="at-fresh-wrap">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span
                className="txt"
                style={{ color: "rgba(244,240,232,0.6)" }}
              >
                {t.evergreen.eyebrow}
              </span>
            </div>
            <h2>
              {t.evergreen.h}
              <em>{t.evergreen.hEm}</em>
            </h2>
            <div
              className="at-fresh-counter"
              aria-label={`${t.evergreen.counter} ${t.evergreen.counterUnit}`}
            >
              <span className="num">{t.evergreen.counter}</span>
              <div className="at-fresh-counter-right">
                <span className="unit">{t.evergreen.counterUnit}</span>
                <span className="desc">{t.evergreen.counterDesc}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="at-fresh-body">{t.evergreen.body}</p>
            <div className="at-fresh-points">
              {t.evergreen.points.map((p, i) => (
                <div className="at-fresh-point" key={i}>
                  <span className="k">{p.k}</span>
                  <span className="v">{p.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
