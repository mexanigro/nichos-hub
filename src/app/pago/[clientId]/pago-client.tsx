"use client";

import { useState } from "react";
import { PLAN_AMOUNT, type PlanType } from "@/lib/pricing";
import { getContract, type ContractLang } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════════════════
 * i18n
 * ═══════════════════════════════════════════════════════════════════════════ */

const i18n = {
  he: {
    greeting: "שלום,",
    planName: "Web + CRM + סוכן WhatsApp",
    perMonth: "/חודש",
    contractTitle: "הסכם שירות",
    expandContract: "קרא את ההסכם המלא",
    collapseContract: "הסתר",
    accept: "קראתי ואני מסכים/ה לתנאי ההסכם",
    pay: "המשך לתשלום",
    processing: "מעבד...",
    error: "שגיאה, נסה שוב",
    securePayment: "תשלום מאובטח",
    monthlyAmount: "סכום חודשי",
    features: [
      "אתר אישי מעוצב",
      "CRM עם עוזר AI",
      "מערכת הזמנות אונליין",
      "סוכן WhatsApp AI 24/7",
      "דומיין + אחסון כלול",
      "תחזוקה ותמיכה 24/7",
      "5 שפות (HE, EN, RU, ES, AR)",
    ],
  },
  en: {
    greeting: "Hello,",
    planName: "Web + CRM + WhatsApp Agent",
    perMonth: "/month",
    contractTitle: "Service Agreement",
    expandContract: "Read full agreement",
    collapseContract: "Collapse",
    accept: "I have read and accept the terms of service",
    pay: "Continue to payment",
    processing: "Processing...",
    error: "An error occurred, please try again",
    securePayment: "Secure payment",
    monthlyAmount: "Monthly amount",
    features: [
      "Custom designed website",
      "CRM with AI assistant",
      "Online booking system",
      "24/7 AI WhatsApp Agent",
      "Domain + hosting included",
      "24/7 maintenance & support",
      "5 languages (HE, EN, RU, ES, AR)",
    ],
  },
  es: {
    greeting: "Hola,",
    planName: "Web + CRM + Agente WhatsApp",
    perMonth: "/mes",
    contractTitle: "Acuerdo de servicio",
    expandContract: "Leer acuerdo completo",
    collapseContract: "Ocultar",
    accept: "Leí y acepto los términos del acuerdo",
    pay: "Continuar al pago",
    processing: "Procesando...",
    error: "Error, intentá de nuevo",
    securePayment: "Pago seguro",
    monthlyAmount: "Monto mensual",
    features: [
      "Sitio web profesional a medida",
      "CRM con asistente IA",
      "Sistema de reservas online",
      "Agente WhatsApp IA 24/7",
      "Dominio + hosting incluido",
      "Mantenimiento y soporte 24/7",
      "5 idiomas (HE, EN, RU, ES, AR)",
    ],
  },
  ru: {
    greeting: "Здравствуйте,",
    planName: "Сайт + CRM + Агент WhatsApp",
    perMonth: "/мес",
    contractTitle: "Договор об оказании услуг",
    expandContract: "Прочитать полный договор",
    collapseContract: "Скрыть",
    accept: "Я прочитал(а) и принимаю условия договора",
    pay: "Перейти к оплате",
    processing: "Обработка...",
    error: "Ошибка, попробуйте снова",
    securePayment: "Безопасная оплата",
    monthlyAmount: "Ежемесячная сумма",
    features: [
      "Индивидуальный профессиональный сайт",
      "CRM с AI-помощником",
      "Система онлайн-бронирования",
      "WhatsApp AI агент 24/7",
      "Домен + хостинг включены",
      "Обслуживание и поддержка 24/7",
      "5 языков (HE, EN, RU, ES, AR)",
    ],
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
  defaultPlan?: PlanType;
  isUpgrade?: boolean;
}

export default function PagoClient({ clientId, clientDocId, businessName, lang }: Props) {
  const selectedPlan: PlanType = "completo";
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contractExpanded, setContractExpanded] = useState(false);
  const t = i18n[lang];
  const { text: contract, version: contractVersion } = getContract(lang as ContractLang, selectedPlan);
  const dir = lang === "he" ? "rtl" : "ltr";

  async function handleContinue() {
    setSending(true);
    setError("");
    try {
      const contractRes = await fetch("/api/payments/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientDocId, contractVersion, plan: selectedPlan }),
      });
      if (!contractRes.ok) {
        const data = await contractRes.json().catch(() => null);
        throw new Error(data?.error || "Contract failed");
      }

      const paymentRes = await fetch("/api/cardcom/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, plan: selectedPlan }),
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
            <p className="text-[0.9rem] font-semibold text-[var(--pg-ink)]">{t.planName}</p>
            <p className="mt-1">
              <span className="text-2xl font-bold text-[var(--pg-ink)]">₪{PLAN_AMOUNT}</span>
              <span className="text-sm text-[var(--pg-ink-2)]">{t.perMonth}</span>
            </p>
            <ul className="mt-4 space-y-1.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[0.8rem] text-[var(--pg-ink-2)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[var(--pg-success)]">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Amount summary */}
        <div className="mb-8 rounded-xl border border-[var(--pg-line)] bg-[var(--pg-paper)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--pg-ink)]">{t.planName}</p>
              <p className="text-xs text-[var(--pg-ink-3)]">{t.monthlyAmount}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--pg-ink)]">₪{PLAN_AMOUNT}</p>
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
