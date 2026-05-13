"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const params = useSearchParams();
  const clientId = params.get("ReturnValue") || params.get("returnValue");

  return (
    <div className="pago-root" dir="rtl">
      <header className="pago-header">
        <div className="pago-header-inner">
          <Logo />
          <span className="pago-logo-text">arzac.studio</span>
        </div>
      </header>
      <main className="pago-main">
        <div className="pago-result-card">
          <div className="pago-result-icon pago-result-icon-error">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M9 9l10 10M19 9L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="pago-result-title">הייתה בעיה בתשלום</h1>
          <p className="pago-result-text">התשלום לא בוצע. אפשר לנסות שוב.</p>
          {clientId && (
            <a href={`/pago/${clientId}`} className="pago-btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
              נסה שוב
            </a>
          )}
        </div>
      </main>
      <footer className="pago-footer">
        <p>&copy; {new Date().getFullYear()} Arzac Studio</p>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Arzac Studio">
      <rect width="40" height="40" rx="10" fill="oklch(0.52 0.08 192)" />
      <text x="20" y="27" textAnchor="middle" fill="oklch(0.98 0.005 192)" fontFamily="var(--font-display), sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.5">
        AS
      </text>
    </svg>
  );
}

export default function PagoErrorPage() {
  return (
    <Suspense fallback={
      <div className="pago-root" dir="rtl">
        <main className="pago-main">
          <div className="pago-result-card">
            <span className="pago-spinner" />
          </div>
        </main>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
