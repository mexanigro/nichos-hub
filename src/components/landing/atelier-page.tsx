"use client";
import { useEffect } from "react";
import { LandingI18nProvider, useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { Header } from "./header";
import { Hero } from "./hero";
import { Showcase } from "./showcase";
import { CrmSection } from "./crm-section";
import { Everything } from "./everything";
import { Process } from "./process";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { WhatsappFab } from "./whatsapp-fab";

function AtelierInner() {
  const { locale, t } = useT();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  // El HTML del servidor queda en hebreo (SEO); la pestaña del navegador sigue al idioma elegido. Next vuelve a
  // escribir el <title> de la metadata después de hidratar, así que se vigila el <head> y se repone (LANDING-01).
  useEffect(() => {
    const titulo = t.meta.title;
    const reponer = () => { if (document.title !== titulo) document.title = titulo; };
    reponer();
    const mo = new MutationObserver(reponer);
    mo.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => mo.disconnect();
  }, [t]);

  return (
    <div className="at" dir={dir} lang={locale}>
      {/* Sin JS las animaciones reveal dejarían todo en opacity:0 — forzamos visible. */}
      <noscript>
        <style>{`[data-reveal],[data-stagger]>*{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <a href="#main-content" className="at-skip-link">{t.a11y.skip}</a>
      <Header />
      <main id="main-content">
        <Hero />
        <Showcase />
        <CrmSection />
        <Everything />
        <Process />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <WhatsappFab />
    </div>
  );
}

export function AtelierPage() {
  return (
    <LandingI18nProvider>
      <AtelierInner />
    </LandingI18nProvider>
  );
}
