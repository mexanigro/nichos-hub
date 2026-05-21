"use client";

import { useEffect, useState } from "react";
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
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const t = i18n[lang] || i18n.en;
  const dir = lang === "he" ? "rtl" : "ltr";

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
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pago-danger)]/15">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M9 9l10 10M19 9L9 19" stroke="var(--pago-danger)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--pago-text)]">{t.title}</h1>
          <p className="mt-2 text-sm text-[var(--pago-text-secondary)]">{t.subtitle}</p>
          <a
            href="/onboarding/pago"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-[var(--pago-border)] bg-[var(--pago-card)] px-6 py-3 text-[0.9rem] font-semibold text-[var(--pago-text)] transition-all hover:bg-[var(--pago-surface)]"
            style={{ textDecoration: "none" }}
          >
            {t.retry}
          </a>
        </div>
      </main>

      <footer className="border-t border-[var(--pago-border)] py-6 text-center text-[0.75rem] text-[var(--pago-text-muted)]">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}

export default function OnboardingErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="pago-page flex min-h-screen items-center justify-center bg-[var(--pago-bg)]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--pago-teal)]/30 border-t-[var(--pago-teal)]" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
