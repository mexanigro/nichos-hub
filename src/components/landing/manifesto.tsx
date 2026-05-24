"use client";
import { useT } from "@/lib/i18n/context";

export function Manifesto() {
  const { t } = useT();
  return (
    <section className="at-mani">
      <div className="container">
        <div className="row">
          <div>
            <div className="eyebrow-row">
              <span className="dot" />
              <span
                className="txt"
                style={{ color: "rgba(244,240,232,0.6)" }}
              >
                {t.manifesto.eyebrow}
              </span>
            </div>
            <h2 style={{ marginTop: 12 }}>
              {t.manifesto.h}
              <em>{t.manifesto.hEm}</em>
            </h2>
          </div>
          <div>
            <p className="at-mani-body">{t.manifesto.body}</p>
            <div className="at-mani-points">
              {t.manifesto.points.map((p, i) => (
                <div className="at-mani-point" key={i}>
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
