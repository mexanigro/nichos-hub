"use client";
import { useState, useEffect } from "react";
import { LandingI18nProvider, useT } from "@/lib/i18n/context";
import { RTL_LOCALES } from "@/lib/i18n/types";
import { Header } from "./header";
import { Hero } from "./hero";
import { Showcase } from "./showcase";
import { CrmSection } from "./crm-section";
import { AgentSection } from "./agent-section";
import { Everything } from "./everything";
import { Manifesto } from "./manifesto";
import { Process } from "./process";
import { Pricing } from "./pricing";
import { Faq } from "./faq";
import { Founder } from "./founder";
import { FinalCta } from "./final-cta";
import { Footer } from "./footer";
import { WhatsappFab } from "./whatsapp-fab";

function useViewport() {
  const [vp, setVp] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setVp(mq.matches ? "desktop" : "mobile");
    const h = (e: MediaQueryListEvent) => setVp(e.matches ? "desktop" : "mobile");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return vp;
}

function AtelierInner() {
  const { locale } = useT();
  const vp = useViewport();
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <div className="at" data-vp={vp} dir={dir} lang={locale}>
      <a href="#main-content" className="at-skip-link">Skip to content</a>
      <Header />
      <main id="main-content">
        <Hero />
        <Showcase />
        <CrmSection />
        <AgentSection />
        <Everything />
        <Manifesto />
        <Process />
        <Pricing />
        <Faq />
        {/* <Founder /> — oculto hasta tener foto real del fundador */}
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
