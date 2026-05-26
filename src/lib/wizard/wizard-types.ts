import type { SerializedFile } from "@/lib/builder-storage";

/* ── Niche ── */
export const WIZARD_NICHES = [
  "barberia",
  "estetica",
  "tattoo",
  "nails",
  "cafeteria",
  "remodelaciones",
  "otro",
] as const;
export type WizardNiche = (typeof WIZARD_NICHES)[number];

/* ── Service entry (editable in paid wizard) ── */
export interface WizardService {
  id: string;
  label: string;
  price: string;
  duration: string;
  visible: boolean;
}

/* ── Day schedule ── */
export interface DaySchedule {
  isOpen: boolean;
  open: string; // "09:00"
  close: string; // "18:00"
}

/* ── Benefit (whyChooseUs) ── */
export interface WizardBenefit {
  title: string;
  desc: string;
  iconName: string; // Lucide icon name (default "Star")
}

/* ── Testimonial ── */
export interface WizardTestimonial {
  name: string;
  title: string;
  text: string;
  rating: number; // 1-5
}

/* ── FAQ item ── */
export interface WizardFaq {
  q: string;
  a: string;
}

/* ── Wizard data (union of all fields for both variants) ── */
export interface WizardData {
  // Step 1: Niche
  niche: WizardNiche | "";
  customNiche: string;

  // Step 2: Mode
  businessMode: "solo" | "team" | "";

  // Step 3: Business basics
  businessName: string;
  tagline: string;
  description: string;

  // Step 4: Contact
  phone: string;
  email: string;
  address: string;
  district: string;
  city: string;
  instagram: string;
  facebook: string;
  whatsapp: string;

  // Step 5: Style / Brand
  colors: string;
  logoCreate: boolean;
  accentColor: string;
  themePreset: string;

  // Step 6: Logo upload (free) / Brand uploads (paid)
  logo: SerializedFile | null;
  logoDark: SerializedFile | null;

  // Step 6 (paid): Services
  services: WizardService[];

  // Step 7 (paid): Hours
  hours: Record<string, DaySchedule>;

  // Step 8 (paid): Owner / Team
  ownerName: string;
  ownerRole: string;
  ownerBio: string;
  ownerPhoto: SerializedFile | null;
  staffPhotos: SerializedFile[];

  // Step 9 (paid): Gallery
  heroImage: SerializedFile | null;
  galleryImages: SerializedFile[];

  // Step 10+ (paid): Diferenciación
  benefits: WizardBenefit[];

  // Step 11 (paid): Confianza social
  testimonials: WizardTestimonial[];

  // Step 12 (paid): Preguntas frecuentes
  faqItems: WizardFaq[];

  // Step 13 (paid): Branding micro
  faviconEmoji: string;

  // Meta
  locale: string;
}

/* ── Step config ── */
export interface StepConfig {
  id: string;
  component: React.ComponentType<StepProps>;
  validate?: (data: WizardData) => string | null;
  skip?: (data: WizardData) => boolean;
  fields?: string[];
}

/* ── Props passed to each step component ── */
export interface StepProps {
  data: WizardData;
  updateField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  updateNested: (path: string, value: unknown) => void;
  isRTL: boolean;
  variant: "free" | "paid";
  errors: string[];
}

/* ── Initial empty state ── */
export function createEmptyWizardData(locale = "en"): WizardData {
  return {
    niche: "",
    customNiche: "",
    businessMode: "",
    businessName: "",
    tagline: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    district: "",
    city: "",
    instagram: "",
    facebook: "",
    whatsapp: "",
    colors: "",
    logoCreate: false,
    accentColor: "",
    themePreset: "",
    logo: null,
    logoDark: null,
    services: [],
    hours: {
      sunday: { isOpen: true, open: "09:00", close: "18:00" },
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "14:00" },
      saturday: { isOpen: false, open: "09:00", close: "18:00" },
    },
    ownerName: "",
    ownerRole: "",
    ownerBio: "",
    ownerPhoto: null,
    staffPhotos: [],
    heroImage: null,
    galleryImages: [],
    benefits: [],
    testimonials: [],
    faqItems: [],
    faviconEmoji: "",
    locale,
  };
}
