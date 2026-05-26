/**
 * Valores por defecto por nicho — features, temas, splash.
 * Fuente única de verdad para onboarding y provision.
 */

export type BusinessNiche = "barberia" | "estetica" | "tattoo" | "nails" | "cafeteria" | "remodelaciones";

export const VALID_NICHES: BusinessNiche[] = ["barberia", "estetica", "tattoo", "nails", "cafeteria", "remodelaciones"];

export function buildFeatures(niche: string, mode: "solo" | "team"): Record<string, boolean> {
  const base: Record<string, boolean> = {
    showHero: true,
    showServices: true,
    showWhyChooseUs: true,
    showBooking: true,
    showGallery: true,
    showTeam: mode === "team",
    enableStaffPages: mode === "team",
    showAbout: mode === "solo",
    enableAboutPage: mode === "solo",
    showTestimonials: true,
    showInquiry: true,
    showLocation: true,
    showBusinessHours: true,
    showInstagram: true,
    showWhatsAppInChat: true,
  };

  if (niche === "cafeteria") {
    base.showBooking = false;
    base.showPhilosophy = true;
    base.showProcess = true;
    base.showAmbience = true;
  } else if (niche === "remodelaciones") {
    base.showBooking = false;
    base.showPortfolio = true;
    base.showProcess = true;
  }

  return base;
}

export function getDefaultTheme(niche: string): string {
  const map: Record<string, string> = {
    barberia: "classic-dark",
    estetica: "elegance-light",
    tattoo: "ink-dark",
    nails: "pastel-soft",
    cafeteria: "warm-cream",
    remodelaciones: "pro-slate",
  };
  return map[niche] || "classic-dark";
}

/**
 * Must mirror master-template's `NICHE_SPLASH` map in
 * src/components/layout/SplashScreen.tsx so new clients deploy with the
 * variant their niche was designed for.
 */
export function getDefaultSplash(niche: string): number {
  const map: Record<string, number> = {
    barberia: 1,         // Classic
    estetica: 4,         // Typewriter
    tattoo: 5,           // Vortex
    nails: 3,            // Pulse
    cafeteria: 6,        // Cafeteria — was 3 (Pulse), template uses 6
    remodelaciones: 7,   // Remodelaciones — was 1 (Classic), template uses 7
  };
  return map[niche] || 1;
}
