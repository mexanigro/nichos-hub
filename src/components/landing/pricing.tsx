"use client";

import { useT } from "@/lib/i18n";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="var(--l-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Pricing() {
  const { t } = useT();

  return (
    <section className="l-section bg-[var(--l-surface)]" id="pricing">
      <div className="mx-auto max-w-[880px]">
        <div className="mb-14 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] border border-[var(--l-border)] bg-[var(--l-card)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.pricing.badge || "PRICING"}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.pricing.title}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--l-text-2)]">
            {t.pricing.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {t.pricing.plans.map((plan, i) => {
            const isPopular = i === 1;
            return (
              <div
                key={i}
                className={`relative rounded-[var(--l-radius-lg)] border bg-[var(--l-card)] p-8 ${
                  isPopular
                    ? "border-[var(--l-accent)]"
                    : "border-[var(--l-border-subtle)]"
                }`}
                style={isPopular ? { borderWidth: "2px", boxShadow: "0 0 30px var(--l-accent-glow)" } : undefined}
              >
                {isPopular && (
                  <span
                    style={{ fontFamily: "var(--l-display)" }}
                    className="absolute -top-3.5 start-6 rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-white"
                  >
                    {t.pricing.popular}
                  </span>
                )}

                <h3 className="text-[0.92rem] font-medium text-[var(--l-text-2)]">
                  {plan.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    style={{ fontFamily: "var(--l-display)" }}
                    className="text-[2.8rem] font-bold tracking-[-0.03em] text-[var(--l-text)]"
                  >
                    {plan.price}
                  </span>
                  <span className="text-[0.9rem] text-[var(--l-text-3)]">₪{t.pricing.monthly}</span>
                </div>

                <div className="my-6 h-px bg-[var(--l-border-subtle)]" />

                <ul className="space-y-3.5">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-2.5 text-[0.9rem] leading-[1.5] text-[var(--l-text-2)]">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#builder"
                  style={{ fontFamily: "var(--l-display)" }}
                  className={`mt-8 flex h-12 items-center justify-center rounded-[var(--l-radius-pill)] text-[0.92rem] font-semibold transition-all duration-200 active:scale-[0.97] ${
                    isPopular
                      ? "bg-[var(--l-accent)] text-white hover:opacity-90"
                      : "border-[1.5px] border-[var(--l-border)] text-[var(--l-text)] hover:border-[var(--l-accent)] hover:text-[var(--l-accent)]"
                  }`}
                >
                  {t.pricing.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
