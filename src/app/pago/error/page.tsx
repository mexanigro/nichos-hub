"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const i18n: Record<string, { title: string; subtitle: string; retry: string }> = {
  he: {
    title: "הייתה בעיה בתשלום",
    subtitle: "התשלום לא בוצע. אפשר לנסות שוב.",
    retry: "נסה שוב",
  },
  en: {
    title: "Payment failed",
    subtitle: "The payment was not processed. You can try again.",
    retry: "Try again",
  },
  es: {
    title: "Error en el pago",
    subtitle: "El pago no se proceso. Podes intentar de nuevo.",
    retry: "Intentar de nuevo",
  },
  ru: {
    title: "Ошибка оплаты",
    subtitle: "Оплата не прошла. Попробуйте ещё раз.",
    retry: "Попробовать снова",
  },
};

function detectLang(): string {
  if (typeof navigator === "undefined") return "en";
  const bl = navigator.language?.toLowerCase() || "";
  if (bl.startsWith("he")) return "he";
  if (bl.startsWith("ru")) return "ru";
  if (bl.startsWith("es")) return "es";
  return "en";
}

function ErrorContent() {
  const params = useSearchParams();
  const clientId = params.get("ReturnValue") || params.get("returnValue");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const t = i18n[lang] || i18n.en;
  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <div className="pago-root" dir={dir}>
      <header className="pago-header">
        <div className="pago-header-inner">
          <img src="/logo-icon.svg" alt="Arzac Studio" className="h-10 w-10" />
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
          <h1 className="pago-result-title">{t.title}</h1>
          <p className="pago-result-text">{t.subtitle}</p>
          {clientId && (
            <a href={`/pago/${clientId}`} className="pago-btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
              {t.retry}
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

export default function PagoErrorPage() {
  return (
    <Suspense fallback={
      <div className="pago-root">
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
