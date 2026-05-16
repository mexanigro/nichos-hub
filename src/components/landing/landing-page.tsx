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
        <Header />
        <main>
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
