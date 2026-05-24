"use client";

import { useState, useMemo } from "react";
import { useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { LogoMark } from "@/components/landing/logo-mark";
import { LangSwitch } from "@/components/landing/lang-switch";
import { type PlanType } from "@/lib/pricing";
import { getContract, type ContractLang } from "@/lib/contracts";

interface Props {
  defaultPlan: PlanType;
}

export function OnboardingPagoClient({ defaultPlan }: Props) {
  const { t, locale } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [biz, setBiz] = useState("");
  const [niche, setNiche] = useState("");
  const [contractOpen, setContractOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Pick plan from pricing
  const planObj = useMemo(() => {
    const plans = t.pricing.plans;
    if (defaultPlan === "web_crm") return plans[0];
    return plans[1] || plans[0];
  }, [t, defaultPlan]);

  // Map PlanType to contract lang
  const contractLang: ContractLang = (["he", "en", "es", "ru"].includes(locale) ? locale : "en") as ContractLang;
  const { version: contractVersion } = getContract(contractLang, defaultPlan);

  const formValid = name && email && phone && biz && niche && agreed;

  async function handleSubmit() {
    if (!formValid) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/cardcom/create-onboarding-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: defaultPlan,
          lang: contractLang,
          email,
          name,
          phone,
          businessName: biz,
          niche,
          contractVersion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data?.error || "Error");
      }

      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setSending(false);
    }
  }

  return (
    <div className="pago" dir={dir}>
      {/* Header */}
      <header className="pago-header">
        <div className="container pago-header-inner">
          <a href="/" className="pago-back">{t.pago.back}</a>
          <a href="/" className="pago-brand">
            <LogoMark size={20} color="var(--pg-ink)" />
            <span className="wm">Arzac <em>studio</em></span>
          </a>
          <LangSwitch />
        </div>
      </header>

      <main className="pago-main">
        <div className="container pago-intro">
          <h1 className="pago-title">{t.pago.title}</h1>
          <p className="pago-subtitle" style={{ marginTop: 8 }}>{t.pago.yourInfoSub}</p>
        </div>

        <div className="container pago-body">
          {/* Plan Card */}
          <div className={`pago-card ${planObj.highlight ? "dark" : ""} pago-plan ${planObj.highlight ? "" : "light"}`}>
            <div className="top">
              <span className="tag">{t.pago.planLabel} · {planObj.tag}</span>
            </div>
            <h3>{planObj.name}</h3>
            <div className="amount">
              <span className="currency">₪</span>
              <span className="num">{planObj.price}</span>
              <span className="per">{t.pago.monthlyAbbr}</span>
            </div>
            <div className="includes">
              <h4>{t.pago.includes}</h4>
              <ul>
                {planObj.items.slice(0, 4).map((it, i) => <li key={i}><span>{it}</span></li>)}
              </ul>
            </div>
          </div>

          {/* Form Card */}
          <div className="pago-card">
            <div className="pago-card-head">
              <h3>{t.pago.yourInfo}</h3>
              <span className="step-of">01</span>
            </div>
            <div className="pago-form">
              <div className="pago-field">
                <label>{t.pago.nameLabel}</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder={t.pago.namePh} />
              </div>
              <div className="pago-field-row">
                <div className="pago-field">
                  <label>{t.pago.emailLabel}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.pago.emailPh} />
                </div>
                <div className="pago-field">
                  <label>{t.pago.phoneLabel}</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.pago.phonePh} />
                </div>
              </div>
              <div className="pago-field">
                <label>{t.pago.businessLabel}</label>
                <input value={biz} onChange={e => setBiz(e.target.value)} placeholder={t.pago.businessPh} />
              </div>
              <div className="pago-field">
                <label>{t.pago.nicheLabel}</label>
                <select value={niche} onChange={e => setNiche(e.target.value)}>
                  <option value="">{t.pago.nichePh}</option>
                  {t.pago.niches.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contract Card */}
          <div className="pago-card">
            <div className="pago-card-head">
              <h3>{t.pago.contract}</h3>
              <span className="step-of">02</span>
            </div>
            <div className={`pago-contract ${contractOpen ? "open" : ""}`}>
              {t.pago.contractBody}
            </div>
            <button className="pago-contract-toggle" onClick={() => setContractOpen(!contractOpen)}>
              {contractOpen ? t.pago.contractCollapse : t.pago.contractExpand} {contractOpen ? "↑" : "↓"}
            </button>
            <label className="pago-check">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span className="box" />
              <span className="lbl">{t.pago.accept}</span>
            </label>
          </div>

          {/* Payment Card */}
          <div className={`pago-card locked ${agreed ? "unlocked" : ""}`}>
            <div className="pago-card-head">
              <h3>{t.pago.paymentTitle}</h3>
              <span className="step-of">03</span>
            </div>
            <p className="pago-subtitle" style={{ margin: 0 }}>{t.pago.paymentSub}</p>
            <div className="pago-payment-area">
              <span className="ico">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 11h20"/></svg>
              </span>
              <span>{t.pago.cardPlaceholder}</span>
            </div>
            {error && (
              <p style={{ color: "var(--pg-danger)", fontSize: 13, margin: 0 }}>{error}</p>
            )}
            <button className="pago-btn" disabled={!formValid || sending} onClick={handleSubmit}>
              {sending ? t.pago.ctaProcessing : t.pago.cta} {!sending && <span className="pago-btn-arrow">→</span>}
              {sending && <span className="pago-spinner" />}
            </button>
          </div>

          {/* Trust Card */}
          <div className="pago-trust">
            <h4>{t.pago.whyTrust}</h4>
            <ul>
              {t.pago.whyTrustItems.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
          </div>
        </div>

        <div className="container pago-foot">{t.pago.footerSecurity}</div>
      </main>
    </div>
  );
}
