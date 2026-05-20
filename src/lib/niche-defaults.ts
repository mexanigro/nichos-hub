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

export function getDefaultSplash(niche: string): number {
  const map: Record<string, number> = {
    barberia: 1,
    estetica: 4,
    tattoo: 5,
    nails: 3,
    cafeteria: 3,
    remodelaciones: 1,
  };
  return map[niche] || 1;
}
