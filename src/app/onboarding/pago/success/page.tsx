"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";
import { LangSwitch } from "@/components/landing/lang-switch";

const REDIRECT_DELAY_MS = 3000;

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

function SuccessContent() {
  const params = useSearchParams();
  const router = useRouter();
  const lowProfileCode = params.get("LowProfileCode") || params.get("lowProfileCode");
  const leadId = params.get("ReturnValue") || params.get("returnValue");

  const { t, locale } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");
  const [nextChargeAt, setNextChargeAt] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const planObj = useMemo(() => t.pricing.plans[1] || t.pricing.plans[0], [t]);

  useEffect(() => {
    if (!lowProfileCode || !leadId) {
      setStatus("error");
      setError("Missing payment data");
      return;
    }

    let cancelled = false;

    fetch("/api/cardcom/verify-onboarding-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lowProfileCode, leadId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setStatus("error");
          setError(data.error || "Verification failed");
          return;
        }
        setNextChargeAt(data.nextChargeAt || null);
        setStatus("success");

        // Decidir destino del redirect:
        //  - infoSubmitted=true  → /mi-cuenta (ya completo el wizard)
        //  - false               → /onboarding/info?token=... (precarga server-side)
        const target = data.infoSubmitted
          ? "/mi-cuenta"
          : `/onboarding/info?token=${encodeURIComponent(data.onboardingToken || "")}`;
        setRedirectUrl(target);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setError("Network error");
      });

    return () => { cancelled = true; };
  }, [lowProfileCode, leadId]);

  // Auto-redirect 3 segundos despues de verificar OK
  useEffect(() => {
    if (status !== "success" || !redirectUrl) return;
    const id = setTimeout(() => router.push(redirectUrl), REDIRECT_DELAY_MS);
    return () => clearTimeout(id);
  }, [status, redirectUrl, router]);

  if (status === "verifying") {
    return (
      <div className="pago" dir={dir}>
        <main className="pago-main" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <span className="pago-spinner" />
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="pago" dir={dir}>
        <header className="pago-header">
          <div className="container pago-header-inner">
            <a href="/" className="pago-brand">
              <LogoMark size={20} color="var(--pg-ink)" />
              <span className="wm">Arzac <em>studio</em></span>
            </a>
            <LangSwitch />
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
              <p>{error || t.pagoErr.sub}</p>
              <div className="pgerr-actions">
                <a href="/onboarding/pago" className="pago-btn" style={{ textDecoration: "none" }}>{t.pagoErr.cta} <span className="pago-btn-arrow">→</span></a>
                <a href="/" className="pago-btn pago-btn-ghost" style={{ textDecoration: "none" }}>{t.pagoErr.ctaSecondary}</a>
              </div>
            </div>
          </div>
          <div className="container pago-foot">{t.pago.footerSecurity}</div>
        </main>
      </div>
    );
  }

  // Success — 3 segundos visibles, luego auto-redirect.
  const nextChargeLabel = formatDate(nextChargeAt, locale);

  return (
    <div className="pago pgok" dir={dir}>
      <header className="pago-header">
        <div className="container pago-header-inner">
          <a href="/" className="pago-brand">
            <LogoMark size={20} color="var(--pg-ink)" />
            <span className="wm">Arzac <em>studio</em></span>
          </a>
          <LangSwitch />
        </div>
      </header>
      <main className="pago-main">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div className="pgok-hero">
            <span className="ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 12 10 17 19 8"/></svg>
            </span>
            <div className="eyebrow">{t.pagoOk.eyebrow}</div>
            <h1>{t.pagoOk.title.replace(/(\.|\!)$/, "")}<em>.</em></h1>
            <p>
              {planObj.name} · ₪{planObj.price}{t.pago.monthlyAbbr}
              {nextChargeLabel && (
                <>
                  <br />
                  <span style={{ fontSize: 13, color: "var(--pg-ink-3)" }}>
                    {locale === "es"
                      ? `Próximo cobro: ${nextChargeLabel}`
                      : locale === "en"
                        ? `Next charge: ${nextChargeLabel}`
                        : locale === "he"
                          ? `החיוב הבא: ${nextChargeLabel}`
                          : locale === "ru"
                            ? `Следующее списание: ${nextChargeLabel}`
                            : `الدفعة القادمة: ${nextChargeLabel}`}
                  </span>
                </>
              )}
            </p>
          </div>

          <p style={{ fontSize: 14, color: "var(--pg-ink-2)", margin: 0 }}>
            {locale === "es"
              ? "En 3 segundos te llevamos a completar la info de tu sitio…"
              : locale === "en"
                ? "Taking you to complete your site info in 3 seconds…"
                : locale === "he"
                  ? "מעבירים אותך למילוי פרטי האתר בעוד 3 שניות…"
                  : locale === "ru"
                    ? "Через 3 секунды перейдём к заполнению данных сайта…"
                    : "ننقلك إلى إكمال بيانات موقعك خلال 3 ثوانٍ…"}
          </p>

          {redirectUrl && (
            <a
              href={redirectUrl}
              className="pago-btn"
              style={{ textDecoration: "none", marginTop: 4 }}
            >
              {locale === "es"
                ? "Continuar ahora"
                : locale === "en"
                  ? "Continue now"
                  : locale === "he"
                    ? "להמשיך עכשיו"
                    : locale === "ru"
                      ? "Продолжить сейчас"
                      : "تابع الآن"}
              <span className="pago-btn-arrow">→</span>
            </a>
          )}
        </div>
        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}

export default function OnboardingSuccessPage() {
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
