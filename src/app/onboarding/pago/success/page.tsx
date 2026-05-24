"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";
import { LangSwitch } from "@/components/landing/lang-switch";

function SuccessContent() {
  const params = useSearchParams();
  const lowProfileCode = params.get("LowProfileCode") || params.get("lowProfileCode");
  const leadId = params.get("ReturnValue") || params.get("returnValue");

  const { t, locale } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  const planObj = useMemo(() => t.pricing.plans[1] || t.pricing.plans[0], [t]);

  useEffect(() => {
    if (!lowProfileCode || !leadId) {
      setStatus("error");
      setError("Missing payment data");
      return;
    }

    fetch("/api/cardcom/verify-onboarding-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowProfileCode, leadId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStatus("success");
        else { setStatus("error"); setError(data.error || "Verification failed"); }
      })
      .catch(() => { setStatus("error"); setError("Network error"); });
  }, [lowProfileCode, leadId]);

  if (status === "verifying") {
    return (
      <div className="pago" dir={dir}>
        <main className="pago-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <span className="pago-spinner" />
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="pago" dir={dir}>
        <header className="pago-header">
          <div className="container pago-header-inner">
            <a href="/" className="pago-brand">
              <LogoMark size={20} color="var(--pg-ink)" />
              <span className="wm">Arzac <em>studio</em></span>
            </a>
            <LangSwitch />
          </div>
        </header>
        <main className="pago-main">
          <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="pgerr-hero">
              <span className="ico">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.01l.01-.011"/></svg>
              </span>
              <div className="eyebrow">{t.pagoErr.eyebrow}</div>
              <h1>{t.pagoErr.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
              <p>{error || t.pagoErr.sub}</p>
              <div className="pgerr-actions">
                <a href="/onboarding/pago" className="pago-btn" style={{ textDecoration: "none" }}>{t.pagoErr.cta} <span className="pago-btn-arrow">→</span></a>
                <a href="/" className="pago-btn pago-btn-ghost" style={{ textDecoration: "none" }}>{t.pagoErr.ctaSecondary}</a>
              </div>
            </div>
          </div>
          <div className="container pago-foot">{t.pago.footerSecurity}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="pago pgok" dir={dir}>
      <header className="pago-header">
        <div className="container pago-header-inner">
          <a href="/" className="pago-brand">
            <LogoMark size={20} color="var(--pg-ink)" />
            <span className="wm">Arzac <em>studio</em></span>
          </a>
          <LangSwitch />
        </div>
      </header>
      <main className="pago-main">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="pgok-hero">
            <span className="ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 10 17 19 8"/></svg>
            </span>
            <div className="eyebrow">{t.pagoOk.eyebrow}</div>
            <h1>{t.pagoOk.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
            <p>{t.pagoOk.sub}</p>
          </div>

          <div className="pago-card">
            <div className="pago-card-head">
              <h3>{t.pago.summary}</h3>
              <span className="step-of">ID {leadId?.slice(0, 5) || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 8, borderTop: "1px dashed var(--pg-line)" }}>
              <div>
                <div style={{ fontFamily: "var(--pg-mono)", fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--pg-ink-3)" }}>{planObj.tag} · {planObj.name}</div>
              </div>
              <div style={{ fontFamily: "var(--pg-serif)", fontSize: 30, letterSpacing: "-0.02em", lineHeight: 1 }}>
                ₪{planObj.price}<span style={{ fontFamily: "var(--pg-mono)", fontSize: 11, color: "var(--pg-ink-3)", marginInlineStart: 4 }}>{t.pago.monthlyAbbr}</span>
              </div>
            </div>
          </div>

          <div className="pago-card">
            <div className="pgok-steps">
              <h4>{t.pagoOk.next}</h4>
              {t.pagoOk.steps.map((s, i) => (
                <div className="pgok-step" key={i}>
                  <span className="t">{s.t}</span>
                  <span className="d">{s.d}</span>
                </div>
              ))}
            </div>
          </div>

          <a href="/" className="pago-btn" style={{ textDecoration: "none" }}>
            {t.pagoOk.cta} <span className="pago-btn-arrow">→</span>
          </a>
        </div>
        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="pago" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span className="pago-spinner" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
