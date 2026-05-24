"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";

function ErrorContent() {
  const params = useSearchParams();
  const clientId = params.get("ReturnValue") || params.get("returnValue");

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
            <p>{t.pagoErr.sub}</p>
            <div className="pgerr-tips">
              <ul>
                {t.pagoErr.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
            <div className="pgerr-actions">
              {clientId && (
                <a href={`/pago/${clientId}`} className="pago-btn" style={{ textDecoration: "none" }}>{t.pagoErr.cta} <span className="pago-btn-arrow">→</span></a>
              )}
              <a href="/" className="pago-btn pago-btn-ghost" style={{ textDecoration: "none" }}>{t.pagoErr.ctaSecondary}</a>
            </div>
          </div>
        </div>
        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}

export default function PagoErrorPage() {
  return (
    <Suspense fallback={
      <div className="pago" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span className="pago-spinner" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
