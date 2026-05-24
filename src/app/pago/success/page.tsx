"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";

function SuccessContent() {
  const params = useSearchParams();
  const lowProfileCode = params.get("LowProfileCode") || params.get("lowProfileCode");
  const clientId = params.get("ReturnValue") || params.get("returnValue");

  const { t, locale } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!lowProfileCode || !clientId) {
      setStatus("error");
      setError("Missing payment data");
      return;
    }

    fetch("/api/cardcom/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowProfileCode, clientId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStatus("success");
        else { setStatus("error"); setError(data.error || "Verification failed"); }
      })
      .catch(() => { setStatus("error"); setError("Network error"); });
  }, [lowProfileCode, clientId]);

  if (status === "verifying") {
    return (
      <div className="pago" dir={dir}>
        <main className="pago-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <span className="pago-spinner" />
        </main>
      </div>
    );
  }

  return (
    <div className={`pago ${status === "success" ? "pgok" : ""}`} dir={dir}>
      <header className="pago-header">
        <div className="container pago-header-inner">
          <a href="/" className="pago-brand">
            <LogoMark size={20} color="var(--pg-ink)" />
            <span className="wm">Arzac <em>studio</em></span>
          </a>
        </div>
      </header>
      <main className="pago-main">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
          {status === "success" ? (
            <div className="pgok-hero" style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
              <span className="ico" style={{ display: "inline-flex" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 10 17 19 8"/></svg>
              </span>
              <div className="eyebrow">{t.pagoOk.eyebrow}</div>
              <h1>{t.pagoOk.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
              <p style={{ marginInline: "auto" }}>{t.pagoOk.sub}</p>
            </div>
          ) : (
            <div className="pgerr-hero" style={{ width: "100%", maxWidth: 520, textAlign: "center" }}>
              <span className="ico" style={{ display: "inline-flex" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.01l.01-.011"/></svg>
              </span>
              <div className="eyebrow">{t.pagoErr.eyebrow}</div>
              <h1>{t.pagoErr.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
              <p style={{ marginInline: "auto" }}>{error || t.pagoErr.sub}</p>
              {clientId && (
                <div className="pgerr-actions" style={{ marginTop: 16 }}>
                  <a href={`/pago/${clientId}`} className="pago-btn" style={{ textDecoration: "none" }}>{t.pagoErr.cta} <span className="pago-btn-arrow">→</span></a>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}

export default function PagoSuccessPage() {
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
