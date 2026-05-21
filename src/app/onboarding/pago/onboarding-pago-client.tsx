"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { WEB_CRM_AMOUNT, COMPLETO_AMOUNT, type PlanType } from "@/lib/pricing";
import { getContract, isContractLang, type ContractLang } from "@/lib/contracts";

/* ═══════════════════════════════════════════════════════════════════════════
 * i18n para la pagina de onboarding
 * ═══════════════════════════════════════════════════════════════════════════ */

const i18n: Record<
  ContractLang,
  {
    title: string;
    subtitle: string;
    planWebCrm: string;
    planCompleto: string;
    perMonth: string;
    popular: string;
    contractTitle: string;
    expandContract: string;
    collapseContract: string;
    accept: string;
    continueWithGoogle: string;
    processing: string;
    redirecting: string;
    error: string;
    securePayment: string;
    monthlyAmount: string;
    webCrmFeatures: string[];
    completoFeatures: string[];
  }
> = {
  he: {
    title: "הצטרפו ל-Arzac Studio",
    subtitle: "בחרו תוכנית והתחילו",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/חודש",
    popular: "פופולרי",
    contractTitle: "הסכם שירות",
    expandContract: "קרא את ההסכם המלא",
    collapseContract: "הסתר",
    accept: "קראתי ואני מסכים/ה לתנאי ההסכם",
    continueWithGoogle: "המשך עם Google",
    processing: "מעבד...",
    redirecting: "מעביר ל-WhatsApp...",
    error: "שגיאה, נסה שוב",
    securePayment: "תהליך מאובטח",
    monthlyAmount: "סכום חודשי",
    webCrmFeatures: [
      "אתר אישי מעוצב",
      "CRM עם עוזר AI",
      "מערכת הזמנות אונליין",
      "ניהול מלאי/סטוק",
      "דומיין + אחסון כלול",
      "תחזוקה ותמיכה",
    ],
    completoFeatures: [
      "הכל מתוכנית Web+CRM",
      "סוכן WhatsApp AI 24/7",
      "תשובות אוטומטיות מותאמות",
      "לכידת לידים ב-WhatsApp",
      "תורים/הזמנות ב-WhatsApp",
    ],
  },
  en: {
    title: "Join Arzac Studio",
    subtitle: "Choose your plan and get started",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/month",
    popular: "Popular",
    contractTitle: "Service Agreement",
    expandContract: "Read full agreement",
    collapseContract: "Collapse",
    accept: "I have read and accept the terms of service",
    continueWithGoogle: "Continue with Google",
    processing: "Processing...",
    redirecting: "Redirecting to WhatsApp...",
    error: "An error occurred, please try again",
    securePayment: "Secure process",
    monthlyAmount: "Monthly amount",
    webCrmFeatures: [
      "Custom designed website",
      "CRM with AI assistant",
      "Online booking system",
      "Inventory management",
      "Domain + hosting included",
      "Maintenance & support",
    ],
    completoFeatures: [
      "Everything in Web+CRM",
      "24/7 AI WhatsApp Agent",
      "Custom automatic responses",
      "WhatsApp lead capture",
      "Appointments via WhatsApp",
    ],
  },
  es: {
    title: "Unite a Arzac Studio",
    subtitle: "Elegí tu plan y empezá",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/mes",
    popular: "Popular",
    contractTitle: "Acuerdo de servicio",
    expandContract: "Leer acuerdo completo",
    collapseContract: "Ocultar",
    accept: "Leí y acepto los términos del acuerdo",
    continueWithGoogle: "Continuar con Google",
    processing: "Procesando...",
    redirecting: "Redirigiendo a WhatsApp...",
    error: "Error, intentá de nuevo",
    securePayment: "Proceso seguro",
    monthlyAmount: "Monto mensual",
    webCrmFeatures: [
      "Sitio web profesional",
      "CRM con asistente IA",
      "Sistema de reservas online",
      "Gestión de inventario",
      "Dominio + hosting incluido",
      "Mantenimiento y soporte",
    ],
    completoFeatures: [
      "Todo del plan Web+CRM",
      "Agente WhatsApp IA 24/7",
      "Respuestas automáticas",
      "Captura de leads por WhatsApp",
      "Turnos/reservas por WhatsApp",
    ],
  },
  ru: {
    title: "Присоединяйтесь к Arzac Studio",
    subtitle: "Выберите план и начните",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/мес",
    popular: "Популярный",
    contractTitle: "Договор об оказании услуг",
    expandContract: "Прочитать полный договор",
    collapseContract: "Скрыть",
    accept: "Я прочитал(а) и принимаю условия договора",
    continueWithGoogle: "Продолжить с Google",
    processing: "Обработка...",
    redirecting: "Перенаправление в WhatsApp...",
    error: "Ошибка, попробуйте снова",
    securePayment: "Безопасный процесс",
    monthlyAmount: "Ежемесячная сумма",
    webCrmFeatures: [
      "Профессиональный сайт",
      "CRM с AI-помощником",
      "Система онлайн-бронирования",
      "Управление инвентарём",
      "Домен + хостинг включены",
      "Обслуживание и поддержка",
    ],
    completoFeatures: [
      "Всё из плана Web+CRM",
      "WhatsApp AI агент 24/7",
      "Персонализированные автоответы",
      "Захват лидов через WhatsApp",
      "Запись через WhatsApp",
    ],
  },
};

function detectLang(): ContractLang {
  if (typeof navigator === "undefined") return "en";
  const browserLang = navigator.language?.toLowerCase() || "";
  if (browserLang.startsWith("he")) return "he";
  if (browserLang.startsWith("ru")) return "ru";
  if (browserLang.startsWith("es")) return "es";
  return "en";
}

/* ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  defaultPlan: PlanType;
}

export function OnboardingPagoClient({ defaultPlan }: Props) {
  const { data: session, status } = useSession();

  const [lang, setLang] = useState<ContractLang>("en");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(defaultPlan);
  const [accepted, setAccepted] = useState(false);
  const [contractExpanded, setContractExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLang(detectLang());
  }, []);

  const t = i18n[lang];
  const { text: contractText, version: contractVersion } = getContract(lang, selectedPlan);
  const dir = lang === "he" ? "rtl" : "ltr";
  const amount = selectedPlan === "completo" ? COMPLETO_AMOUNT : WEB_CRM_AMOUNT;

  async function handleContinue() {
    // Si no esta autenticado, login con Google
    if (status !== "authenticated" || !session?.user?.email) {
      signIn("google", { callbackUrl: `/onboarding/pago?plan=${selectedPlan}` });
      return;
    }

    setSending(true);
    setError("");

    try {
      // Registrar lead con contrato aceptado
      const res = await fetch("/api/contract-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          lang,
          email: session.user.email,
          name: session.user.name || "",
          contractVersion,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Error");
      }

      // Redirigir a WhatsApp
      const waNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
      const planLabel = selectedPlan === "completo" ? "Completo (₪990)" : "Web+CRM (₪790)";
      const waText = encodeURIComponent(
        `Hola! Acabo de aceptar el contrato para el plan ${planLabel}. Mi email es ${session.user.email}. Me gustaría empezar.`,
      );

      setDone(true);

      // Dar tiempo a que se vea el "redirecting..."
      setTimeout(() => {
        window.location.href = `https://wa.me/${waNumber}?text=${waText}`;
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setSending(false);
    }
  }

  return (
    <div dir={dir} className="pago-page min-h-screen bg-[var(--pago-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--pago-border)] bg-[var(--pago-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Arzac Studio" className="h-8 w-8" />
            <span
              className="hidden items-baseline gap-0.5 sm:flex"
              style={{ fontFamily: "var(--font-display, system-ui)" }}
            >
              <span className="text-[0.95rem] font-bold tracking-tight text-[var(--pago-text)]">
                ARZAC
              </span>
              <span className="text-[0.6rem] font-medium text-[var(--pago-teal)]">
                .studio
              </span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            {/* Language selector */}
            <select
              value={lang}
              onChange={(e) => {
                const newLang = e.target.value;
                if (isContractLang(newLang)) {
                  setLang(newLang);
                  setAccepted(false);
                }
              }}
              className="rounded-md border border-[var(--pago-border)] bg-[var(--pago-surface)] px-2 py-1 text-[0.75rem] text-[var(--pago-text-secondary)] focus:outline-none"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="he">עברית</option>
              <option value="ru">Русский</option>
            </select>
            <div className="flex items-center gap-1.5 text-[0.78rem] text-[var(--pago-text-muted)]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              {t.securePayment}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--pago-text)]">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--pago-text-secondary)]">
            {t.subtitle}
          </p>
        </div>

        {/* Plan Selection */}
        <section className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Web+CRM */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("web_crm");
                setAccepted(false);
              }}
              className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                selectedPlan === "web_crm"
                  ? "border-[var(--pago-teal)] bg-[var(--pago-card)] shadow-md"
                  : "border-[var(--pago-border)] bg-[var(--pago-card)] hover:border-[var(--pago-border)]"
              }`}
            >
              <p className="text-[0.9rem] font-semibold text-[var(--pago-text)]">
                {t.planWebCrm}
              </p>
              <p className="mt-1">
                <span className="text-2xl font-bold text-[var(--pago-text)]">
                  ₪{WEB_CRM_AMOUNT}
                </span>
                <span className="text-sm text-[var(--pago-text-secondary)]">
                  {t.perMonth}
                </span>
              </p>
              <ul className="mt-4 space-y-1.5">
                {t.webCrmFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[0.8rem] text-[var(--pago-text-secondary)]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0 text-[var(--pago-success)]"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {selectedPlan === "web_crm" && (
                <div className="absolute end-4 top-4">
                  <div className="h-5 w-5 rounded-full border-[5px] border-[var(--pago-teal)]" />
                </div>
              )}
            </button>

            {/* Completo */}
            <button
              type="button"
              onClick={() => {
                setSelectedPlan("completo");
                setAccepted(false);
              }}
              className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                selectedPlan === "completo"
                  ? "border-[var(--pago-teal)] bg-[var(--pago-card)] shadow-md"
                  : "border-[var(--pago-border)] bg-[var(--pago-card)] hover:border-[var(--pago-border)]"
              }`}
            >
              <div className="flex items-center gap-2">
                <p className="text-[0.9rem] font-semibold text-[var(--pago-text)]">
                  {t.planCompleto}
                </p>
                <span className="rounded-full bg-[var(--pago-teal)] px-2 py-0.5 text-[0.65rem] font-bold text-white">
                  {t.popular}
                </span>
              </div>
              <p className="mt-1">
                <span className="text-2xl font-bold text-[var(--pago-text)]">
                  ₪{COMPLETO_AMOUNT}
                </span>
                <span className="text-sm text-[var(--pago-text-secondary)]">
                  {t.perMonth}
                </span>
              </p>
              <ul className="mt-4 space-y-1.5">
                {t.completoFeatures.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[0.8rem] text-[var(--pago-text-secondary)]"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0 text-[var(--pago-success)]"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {selectedPlan === "completo" && (
                <div className="absolute end-4 top-4">
                  <div className="h-5 w-5 rounded-full border-[5px] border-[var(--pago-teal)]" />
                </div>
              )}
            </button>
          </div>
        </section>

        {/* Amount summary */}
        <div className="mb-8 rounded-xl border border-[var(--pago-border)] bg-[var(--pago-card)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--pago-text)]">
                {selectedPlan === "completo" ? t.planCompleto : t.planWebCrm}
              </p>
              <p className="text-xs text-[var(--pago-text-muted)]">
                {t.monthlyAmount}
              </p>
            </div>
            <p className="text-2xl font-bold text-[var(--pago-text)]">
              ₪{amount}
            </p>
          </div>
        </div>

        {/* Contract */}
        <section className="rounded-2xl border border-[var(--pago-border)] bg-[var(--pago-card)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.9rem] font-semibold text-[var(--pago-text)]">
              {t.contractTitle}
            </h2>
            <button
              type="button"
              onClick={() => setContractExpanded(!contractExpanded)}
              className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--pago-text-secondary)] transition-colors hover:text-[var(--pago-text)]"
            >
              <span>
                {contractExpanded ? t.collapseContract : t.expandContract}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: contractExpanded
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.25s ease",
                }}
              >
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div
            className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
              contractExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-28"
            }`}
            style={{ direction: dir }}
          >
            <div className="whitespace-pre-line text-[0.78rem] leading-relaxed text-[var(--pago-text-secondary)]">
              {contractText}
            </div>
            {!contractExpanded && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--pago-card)] to-transparent"
                style={{ position: "relative", marginTop: "-4rem" }}
              />
            )}
          </div>

          {/* Accept checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => !sending && setAccepted(!accepted)}
            className={`mt-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-all ${
              accepted
                ? "border-[var(--pago-success)]/30 bg-[var(--pago-success)]/10"
                : "border-[var(--pago-border)] bg-[var(--pago-surface)] hover:bg-[var(--pago-surface)]"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                accepted
                  ? "border-[var(--pago-success)] bg-[var(--pago-success)]"
                  : "border-[var(--pago-border)]"
              }`}
            >
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.5L5 9L9.5 3.5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-[0.82rem] text-[var(--pago-text)]">
              {t.accept}
            </span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-[var(--pago-danger)]/10 px-4 py-2.5 text-[0.82rem] text-[var(--pago-danger)]">
              {error}
            </p>
          )}

          {/* CTA button */}
          <button
            onClick={handleContinue}
            disabled={!accepted || sending || done}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pago-teal)] px-6 py-4 text-[0.9rem] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {done ? (
              <span>{t.redirecting}</span>
            ) : sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>{t.processing}</span>
              </>
            ) : status === "authenticated" ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>WhatsApp</span>
              </>
            ) : (
              <>
                {/* Google icon */}
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{t.continueWithGoogle}</span>
              </>
            )}
          </button>
        </section>
      </main>

      <footer className="border-t border-[var(--pago-border)] py-6 text-center text-[0.75rem] text-[var(--pago-text-muted)]">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}
