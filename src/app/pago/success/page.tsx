"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const i18n: Record<string, { verifying: string; title: string; subtitle: string; errorTitle: string; errorText: string; retry: string }> = {
  he: {
    verifying: "...מאמת תשלום",
    title: "התשלום התקבל",
    subtitle: "האתר שלך בדרך. ניצור איתך קשר בהקדם.",
    errorTitle: "אירעה שגיאה",
    errorText: "לא הצלחנו לאמת את התשלום.",
    retry: "נסה שוב",
  },
  en: {
    verifying: "Verifying payment...",
    title: "Payment received!",
    subtitle: "Your site is on its way. We'll contact you soon.",
    errorTitle: "Something went wrong",
    errorText: "We couldn't verify your payment.",
    retry: "Try again",
  },
  es: {
    verifying: "Verificando pago...",
    title: "Pago recibido!",
    subtitle: "Tu sitio esta en camino. Te contactaremos pronto.",
    errorTitle: "Algo salio mal",
    errorText: "No pudimos verificar tu pago.",
    retry: "Intentar de nuevo",
  },
  ru: {
    verifying: "Проверка оплаты...",
    title: "Оплата получена!",
    subtitle: "Ваш сайт в пути. Мы свяжемся с вами в ближайшее время.",
    errorTitle: "Произошла ошибка",
    errorText: "Не удалось подтвердить оплату.",
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

function SuccessContent() {
  const params = useSearchParams();
  const lowProfileCode = params.get("LowProfileCode") || params.get("lowProfileCode");
  const clientId = params.get("ReturnValue") || params.get("returnValue");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const t = i18n[lang] || i18n.en;
  const dir = lang === "he" ? "rtl" : "ltr";

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
        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setError(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Network error");
      });
  }, [lowProfileCode, clientId]);

  return (
    <div className="pago-root" dir={dir}>
      <header className="pago-header">
        <div className="pago-header-inner">
          <img src="/logo-icon.svg" alt="Arzac Studio" className="h-10 w-10" />
          <span className="pago-logo-text">arzac.studio</span>
        </div>
      </header>
      <main className="pago-main">
        {status === "verifying" && (
          <div className="pago-result-card">
            <span className="pago-spinner" />
            <p className="pago-result-text">{t.verifying}</p>
          </div>
        )}

        {status === "success" && (
          <div className="pago-result-card">
            <div className="pago-result-icon pago-result-icon-success">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M7 14.5L11.5 19L21 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="pago-result-title">{t.title}</h1>
            <p className="pago-result-text">{t.subtitle}</p>
          </div>
        )}

        {status === "error" && (
          <div className="pago-result-card">
            <div className="pago-result-icon pago-result-icon-error">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M9 9l10 10M19 9L9 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="pago-result-title">{t.errorTitle}</h1>
            <p className="pago-result-text">{error || t.errorText}</p>
            {clientId && (
              <a href={`/pago/${clientId}`} className="pago-btn-primary" style={{ textDecoration: "none", textAlign: "center" }}>
                {t.retry}
              </a>
            )}
          </div>
        )}
      </main>
      <footer className="pago-footer">
        <p>&copy; {new Date().getFullYear()} Arzac Studio</p>
      </footer>
    </div>
  );
}

export default function PagoSuccessPage() {
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
      <SuccessContent />
    </Suspense>
  );
}
