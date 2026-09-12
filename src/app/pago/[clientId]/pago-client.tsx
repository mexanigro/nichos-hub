"use client";

import { useState } from "react";
import { MONTHLY_AMOUNT } from "@/lib/pricing";
import { getContract, type ContractLang } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════════════════
 * i18n
 * ═══════════════════════════════════════════════════════════════════════════ */

const i18n = {
  he: {
    greeting: "שלום,",
    perMonth: "/חודש",
    contractTitle: "הסכם שירות",
    expandContract: "קרא את ההסכם המלא",
    collapseContract: "הסתר",
    accept: "קראתי ואני מסכים/ה לתנאי ההסכם",
    pay: "המשך לתשלום",
    processing: "מעבד...",
    error: "שגיאה, נסה שוב",
    securePayment: "תשלום מאובטח",
    planName: "אתר + CRM + התראות במייל",
    setupLabel: "דמי הקמה (תשלום חד-פעמי)",
    monthlyLabel: "דמי מנוי חודשיים",
    payNow: "לתשלום עכשיו",
    thenMonthly: "ולאחר מכן",
    features: [
      "אתר אישי מעוצב, אחסון ודומיין",
      "CRM ללקוחות ולידים",
      "יומן תורים אונליין",
      "התראות במייל לבעל העסק וללקוחות",
      "תחזוקה ותמיכה שוטפת",
      "5 שפות (HE, EN, RU, ES, AR)",
    ],
    optional: "WhatsApp, בינה מלאכותית ושיחות קוליות — שירותים אופציונליים בהצעת מחיר נפרדת.",
  },
  en: {
    greeting: "Hello,",
    perMonth: "/month",
    contractTitle: "Service Agreement",
    expandContract: "Read full agreement",
    collapseContract: "Collapse",
    accept: "I have read and accept the terms of service",
    pay: "Continue to payment",
    processing: "Processing...",
    error: "An error occurred, please try again",
    securePayment: "Secure payment",
    planName: "Website + CRM + Email notifications",
    setupLabel: "Setup fee (one-time)",
    monthlyLabel: "Monthly subscription",
    payNow: "Due now",
    thenMonthly: "then",
    features: [
      "Custom designed website, hosting and domain",
      "CRM for customers and leads",
      "Online booking calendar",
      "Email notifications to the owner and customers",
      "Maintenance & support",
      "5 languages (HE, EN, RU, ES, AR)",
    ],
    optional: "WhatsApp, AI and voice calls are optional services, quoted separately.",
  },
  es: {
    greeting: "Hola,",
    perMonth: "/mes",
    contractTitle: "Acuerdo de servicio",
    expandContract: "Leer acuerdo completo",
    collapseContract: "Ocultar",
    accept: "Lei y acepto los terminos del acuerdo",
    pay: "Continuar al pago",
    processing: "Procesando...",
    error: "Error, intenta de nuevo",
    securePayment: "Pago seguro",
    planName: "Web + CRM + Notificaciones por email",
    setupLabel: "Alta (pago unico)",
    monthlyLabel: "Suscripcion mensual",
    payNow: "A pagar ahora",
    thenMonthly: "luego",
    features: [
      "Sitio web profesional, hosting y dominio",
      "CRM de clientes y leads",
      "Reservas online",
      "Notificaciones por email al dueño y a los clientes",
      "Mantenimiento y soporte",
      "5 idiomas (HE, EN, RU, ES, AR)",
    ],
    optional: "WhatsApp, IA y llamadas de voz son servicios opcionales, a cotizar aparte.",
  },
  ru: {
    greeting: "Здравствуйте,",
    perMonth: "/мес",
    contractTitle: "Договор об оказании услуг",
    expandContract: "Прочитать полный договор",
    collapseContract: "Скрыть",
    accept: "Я прочитал(а) и принимаю условия договора",
    pay: "Перейти к оплате",
    processing: "Обработка...",
    error: "Ошибка, попробуйте снова",
    securePayment: "Безопасная оплата",
    planName: "Сайт + CRM + Email-уведомления",
    setupLabel: "Подключение (разовый платёж)",
    monthlyLabel: "Ежемесячная подписка",
    payNow: "К оплате сейчас",
    thenMonthly: "затем",
    features: [
      "Индивидуальный сайт, хостинг и домен",
      "CRM для клиентов и лидов",
      "Онлайн-запись",
      "Email-уведомления владельцу и клиентам",
      "Обслуживание и поддержка",
      "5 языков (HE, EN, RU, ES, AR)",
    ],
    optional: "WhatsApp, ИИ и голосовые звонки — дополнительные услуги, рассчитываются отдельно.",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  clientId: string;
  clientDocId: string;
  businessName: string;
  lang: "he" | "en" | "es" | "ru";
  /** Alta negociada en persona (1000–1500), ya validada por el servidor; 1500 por defecto. */
  setupAmount: number;
}

export default function PagoClient({ clientId, clientDocId, businessName, lang, setupAmount }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contractExpanded, setContractExpanded] = useState(false);
  const t = i18n[lang];
  const planName = t.planName;
  const features = t.features;
  // Mismo formato que el contrato (fmt de contracts.ts): 1,500 / 1.500 / 1 500 según idioma, no el locale del navegador.
  const setupFmt = setupAmount.toLocaleString(lang === "es" ? "es-ES" : lang === "ru" ? "ru-RU" : "en-US");
  const { text: contract, version: contractVersion } = getContract(lang as ContractLang, { setupAmount });
  const dir = lang === "he" ? "rtl" : "ltr";

  async function handleContinue() {
    setSending(true);
    setError("");
    try {
      const contractRes = await fetch("/api/payments/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientDocId, contractVersion }),
      });
      if (!contractRes.ok) {
        const data = await contractRes.json().catch(() => null);
        throw new Error(data?.error || "Contract failed");
      }

      const paymentRes = await fetch("/api/cardcom/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (!paymentRes.ok) {
        const data = await paymentRes.json().catch(() => null);
        throw new Error(data?.error || "Payment setup failed");
      }
      const { url } = await paymentRes.json();
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("No payment URL received");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
    setSending(false);
  }

  return (
    <div dir={dir} className="pago min-h-screen bg-[var(--pg-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--pg-line)] bg-[var(--pg-paper)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Arzac Studio" className="h-8 w-8" />
            <span className="hidden items-baseline gap-0.5 sm:flex" style={{ fontFamily: "var(--pg-serif, system-ui)" }}>
              <span className="text-[0.95rem] font-bold tracking-tight text-[var(--pg-ink)]">ARZAC</span>
              <span className="text-[0.6rem] font-medium text-[var(--pg-accent)]">.studio</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5 text-[0.78rem] text-[var(--pg-ink-3)]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {t.securePayment}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-sm text-[var(--pg-ink-2)]">{t.greeting}</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--pg-ink)]">{businessName}</h1>
        </div>

        {/* Plan overview */}
        <section className="mb-8">
          <div className="rounded-2xl border-2 border-[var(--pg-accent)] bg-[var(--pg-paper)] p-5 shadow-md">
            <p className="text-[0.9rem] font-semibold text-[var(--pg-ink)]">{planName}</p>
            <p className="mt-1">
              <span className="text-2xl font-bold text-[var(--pg-ink)]">₪{setupFmt}</span>
              <span className="text-sm text-[var(--pg-ink-2)]"> {t.setupLabel.toLowerCase()} · {t.thenMonthly} ₪{MONTHLY_AMOUNT}{t.perMonth}</span>
            </p>
            <ul className="mt-4 space-y-1.5">
              {features.map((f: string) => (
                <li key={f} className="flex items-start gap-2 text-[0.8rem] text-[var(--pg-ink-2)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[var(--pg-success)]">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.75rem] text-[var(--pg-ink-3)]">{t.optional}</p>
          </div>
        </section>

        {/* Amount summary: alta ahora, cuota después */}
        <div className="mb-8 rounded-xl border border-[var(--pg-line)] bg-[var(--pg-paper)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--pg-ink)]">{t.setupLabel}</p>
              <p className="text-xs text-[var(--pg-ink-3)]">{t.payNow}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--pg-ink)]">₪{setupFmt}</p>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[var(--pg-line)] pt-3">
            <p className="text-sm text-[var(--pg-ink-2)]">{t.monthlyLabel}</p>
            <p className="text-base font-semibold text-[var(--pg-ink)]">₪{MONTHLY_AMOUNT}<span className="text-xs font-normal text-[var(--pg-ink-2)]">{t.perMonth}</span></p>
          </div>
        </div>

        {/* Contract */}
        <section className="rounded-2xl border border-[var(--pg-line)] bg-[var(--pg-paper)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.9rem] font-semibold text-[var(--pg-ink)]">{t.contractTitle}</h2>
            <button
              type="button"
              onClick={() => setContractExpanded(!contractExpanded)}
              className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--pg-ink-2)] transition-colors hover:text-[var(--pg-ink)]"
            >
              <span>{contractExpanded ? t.collapseContract : t.expandContract}</span>
              <svg
                width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{ transform: contractExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div
            className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
              contractExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-28"
            }`}
            style={{ direction: dir }}
          >
            <div className="whitespace-pre-line text-[0.78rem] leading-relaxed text-[var(--pg-ink-2)]">
              {contract}
            </div>
            {!contractExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--pg-paper)] to-transparent" style={{ position: "relative", marginTop: "-4rem" }} />
            )}
          </div>

          {/* Accept checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => !sending && setAccepted(!accepted)}
            className={`mt-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-all ${
              accepted ? "border-[var(--pg-success)]/30 bg-[var(--pg-success)]/10" : "border-[var(--pg-line)] bg-[var(--pg-paper)] hover:bg-[var(--pg-paper)]"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                accepted ? "border-[var(--pg-success)] bg-[var(--pg-success)]" : "border-[var(--pg-line)]"
              }`}
            >
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-[0.82rem] text-[var(--pg-ink)]">{t.accept}</span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-[var(--pg-danger)]/10 px-4 py-2.5 text-[0.82rem] text-[var(--pg-danger)]">{error}</p>
          )}

          {/* Pay button */}
          <button
            onClick={handleContinue}
            disabled={!accepted || sending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pg-accent)] px-6 py-4 text-[0.9rem] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>{t.pay}</span>
              </>
            )}
          </button>
        </section>
      </main>

      <footer className="border-t border-[var(--pg-line)] py-6 text-center text-[0.75rem] text-[var(--pg-ink-3)]">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}
