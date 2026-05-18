"use client";

import { useState } from "react";
import { LandingI18nProvider } from "@/lib/i18n";
import { useTheme } from "@/hooks/useTheme";
import { Header } from "./header";
import { Hero } from "./hero";
import { TemplateShowcase } from "./template-showcase";
import { HowItWorks } from "./how-it-works";
import { Features } from "./features";
import { Pricing } from "./pricing";
import { FAQ } from "./faq";
import { FinalCTA } from "./final-cta";
import { Footer } from "./footer";
import { WhatsAppWidget } from "./whatsapp-widget";
import { MobileDock } from "./mobile-dock";
import { AuthModal } from "./auth-modal";
import { BuilderSection } from "./builder/builder-section";
import { AnimatedSection } from "./animated-section";

export function LandingPage() {
  const { theme, toggle } = useTheme();
  const [dockAuthOpen, setDockAuthOpen] = useState(false);

  return (
    <LandingI18nProvider>
      <div className="landing" data-theme={theme}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--l-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
        >
          Saltar al contenido
        </a>
        <Header theme={theme} toggleTheme={toggle} />
        <main id="main-content">
          <Hero />
          <TemplateShowcase />
          <AnimatedSection>
            <Features />
          </AnimatedSection>
          <AnimatedSection>
            <HowItWorks />
          </AnimatedSection>
          <AnimatedSection>
            <Pricing />
          </AnimatedSection>
          <AnimatedSection>
            <BuilderSection />
          </AnimatedSection>
          <AnimatedSection>
            <FAQ />
          </AnimatedSection>
          <AnimatedSection>
            <FinalCTA />
          </AnimatedSection>
        </main>
        <Footer />
        <WhatsAppWidget />
        <MobileDock onAuthClick={() => setDockAuthOpen(true)} />
        <AuthModal open={dockAuthOpen} onClose={() => setDockAuthOpen(false)} />
      </div>
    </LandingI18nProvider>
  );
}
