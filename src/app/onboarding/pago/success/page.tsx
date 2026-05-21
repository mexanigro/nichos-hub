"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
 * i18n minimo para la pagina de exito
 * ═══════════════════════════════════════════════════════════════════════════ */

const i18n: Record<string, { verifying: string; title: string; subtitle: string; errorTitle: string; errorText: string; retry: string }> = {
  he: {
    verifying: "...מאמת תשלום",
    title: "התשלום התקבל!",
    subtitle: "תודה! ניצור איתך קשר בהקדם להקמת האתר שלך.",
    errorTitle: "אירעה שגיאה",
    errorText: "לא הצלחנו לאמת את התשלום.",
    retry: "נסה שוב",
  },
  en: {
    verifying: "Verifying payment...",
    title: "Payment received!",
    subtitle: "Thank you! We'll contact you soon to set up your site.",
    errorTitle: "Something went wrong",
    errorText: "We couldn't verify your payment.",
    retry: "Try again",
  },
  es: {
    verifying: "Verificando pago...",
    title: "Pago recibido!",
    subtitle: "Gracias! Te contactaremos pronto para configurar tu sitio.",
    errorTitle: "Algo salio mal",
    errorText: "No pudimos verificar tu pago.",
    retry: "Intentar de nuevo",
  },
  ru: {
    verifying: "Проверка оплаты...",
    title: "Оплата получена!",
    subtitle: "Спасибо! Мы свяжемся с вами в ближайшее время для настройки сайта.",
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

/* ═══════════════════════════════════════════════════════════════════════════ */

function SuccessContent() {
  const params = useSearchParams();
  const lowProfileCode = params.get("LowProfileCode") || params.get("lowProfileCode");
  const leadId = params.get("ReturnValue") || params.get("returnValue");

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const t = i18n[lang] || i18n.en;
  const dir = lang === "he" ? "rtl" : "ltr";

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
  }, [lowProfileCode, leadId]);

  return (
    <div dir={dir} className="pago-page flex min-h-screen flex-col bg-[var(--pago-bg)]">
      <header className="border-b border-[var(--pago-border)] bg-[var(--pago-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Arzac Studio" className="h-8 w-8" />
            <span className="hidden items-baseline gap-0.5 sm:flex" style={{ fontFamily: "var(--font-display, system-ui)" }}>
              <span className="text-[0.95rem] font-bold tracking-tight text-[var(--pago-text)]">ARZAC</span>
              <span className="text-[0.6rem] font-medium text-[var(--pago-teal)]">.studio</span>
            </span>
          </a>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        {status === "verifying" && (
          <div className="text-center">
            <span className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-[var(--pago-teal)]/30 border-t-[var(--pago-teal)]" />
            <p className="text-sm text-[var(--pago-text-secondary)]">{t.verifying}</p>
          </div>
        )}

        {status === "success" && (
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pago-success)]/15">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16.5L13.5 22L24 10" stroke="var(--pago-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--pago-text)]">{t.title}</h1>
            <p className="mt-2 text-sm text-[var(--pago-text-secondary)]">{t.subtitle}</p>
            <a
              href="/"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-[var(--pago-teal)] px-6 py-3 text-[0.9rem] font-semibold text-white transition-all hover:opacity-90"
              style={{ textDecoration: "none" }}
            >
              Arzac Studio
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pago-danger)]/15">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M9 9l10 10M19 9L9 19" stroke="var(--pago-danger)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--pago-text)]">{t.errorTitle}</h1>
            <p className="mt-2 text-sm text-[var(--pago-text-secondary)]">{error || t.errorText}</p>
            <a
              href="/onboarding/pago"
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-[var(--pago-border)] bg-[var(--pago-card)] px-6 py-3 text-[0.9rem] font-semibold text-[var(--pago-text)] transition-all hover:bg-[var(--pago-surface)]"
              style={{ textDecoration: "none" }}
            >
              {t.retry}
            </a>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--pago-border)] py-6 text-center text-[0.75rem] text-[var(--pago-text-muted)]">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="pago-page flex min-h-screen items-center justify-center bg-[var(--pago-bg)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pago-teal)]/30 border-t-[var(--pago-teal)]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
