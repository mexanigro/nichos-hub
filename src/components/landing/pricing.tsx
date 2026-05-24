"use client";
import { useT } from "@/lib/i18n/context";

export function Pricing() {
  const { t } = useT();
  return (
    <section className="at-section alt" id="pricing">
      <div className="container">
        <div className="at-section-head">
          <div>
            <div className="eyebrow-row"><span className="dot" /><span className="txt">{t.pricing.eyebrow}</span></div>
            <h2>{t.pricing.title}<em>{t.pricing.titleEm}</em></h2>
          </div>
          <p>{t.pricing.sub}</p>
        </div>

        <div className="at-plans">
          {t.pricing.plans.map((p, i) => (
            <div className={`at-plan${p.highlight ? " hl" : ""}`} key={i}>
              {p.highlight && <span className="stamp">Most popular</span>}
              <span className="tag">/{(i + 1).toString().padStart(2, "0")} · {p.tag}</span>
              <h3 className="name">{p.name}</h3>
              <p className="tagline">{p.tagline}</p>
              <div className="price">
                <span className="c">₪</span>
                <span className="v">{p.price}</span>
                <span className="per">{t.pricing.monthlyAbbr}</span>
              </div>
              <div className="row-meta">
                <span>{t.pricing.setupLabel}</span>
                <span style={{ color: "var(--at-accent)" }}>{t.pricing.setupValue}</span>
              </div>
              <ul>
                {p.items.map((it, j) => <li key={j}><span>{it}</span></li>)}
              </ul>
              <div className="ctas">
                <a className="at-plan-btn primary" href="/onboarding/pago">{t.pricing.cta} →</a>
                <a className="at-plan-btn ghost" href="https://wa.me/972500000000" target="_blank" rel="noopener noreferrer">{t.pricing.ctaSecondary}</a>
              </div>
            </div>
          ))}
        </div>
        <div className="at-pricing-note">{t.pricing.note}</div>
      </div>
    </section>
  );
}
