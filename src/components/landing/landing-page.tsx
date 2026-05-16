"use client";

import { LandingI18nProvider } from "@/lib/i18n";
import { Header } from "./header";
import { Hero } from "./hero";
import { SocialProof } from "./social-proof";
import { Pillars } from "./pillars";
import { HowItWorks } from "./how-it-works";
import { FeaturesGrid } from "./features-grid";
import { Pricing } from "./pricing";
import { FAQ } from "./faq";
import { FinalCTA } from "./final-cta";
import { Footer } from "./footer";
import { WhatsAppWidget } from "./whatsapp-widget";
import { BuilderSection } from "./builder/builder-section";
import { AnimatedSection } from "./animated-section";

export function LandingPage() {
  return (
    <LandingI18nProvider>
      <div className="landing">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--l-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:outline-none"
        >
          Saltar al contenido
        </a>
        <Header />
        <main id="main-content">
          <Hero />
          <AnimatedSection>
            <SocialProof />
          </AnimatedSection>
          <AnimatedSection>
            <Pillars />
          </AnimatedSection>
          <AnimatedSection>
            <HowItWorks />
          </AnimatedSection>
          <AnimatedSection>
            <FeaturesGrid />
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
      </div>
    </LandingI18nProvider>
  );
}
