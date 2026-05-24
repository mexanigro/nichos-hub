"use client";

import { Suspense } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";
import { LangSwitch } from "@/components/landing/lang-switch";

function ExpiredContent() {
  const { t, locale } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

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
          <div className="pgexp-hero">
            <span className="ornament">⏳</span>
            <span className="ico">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 5h14M5 19h14M7 5v3a5 5 0 0 0 10 0V5M7 19v-3a5 5 0 0 1 10 0v3"/></svg>
            </span>
            <div className="eyebrow">{t.pagoExpired.eyebrow}</div>
            <h1>{t.pagoExpired.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
            <p>{t.pagoExpired.sub}</p>
          </div>
          <a href="/onboarding/pago" className="pago-btn" style={{ textDecoration: "none" }}>{t.pagoExpired.cta} <span className="pago-btn-arrow">→</span></a>
          <a href="/" className="pago-btn pago-btn-ghost" style={{ textDecoration: "none" }}>{t.pagoExpired.ctaSecondary}</a>
        </div>
        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}

export default function PagoExpiredPage() {
  return (
    <Suspense fallback={
      <div className="pago" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span className="pago-spinner" />
      </div>
    }>
      <ExpiredContent />
    </Suspense>
  );
}
