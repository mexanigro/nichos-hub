export type Locale = "en" | "es" | "ru" | "he";

export interface Translations {
  nav: {
    features: string;
    pricing: string;
    howItWorks: string;
    contact: string;
    getStarted: string;
    home?: string;
  };
  hero: {
    badge?: string;
    headline: string;
    subheadline: string;
    cta: string;
    trustedBy: string;
    serviceIcons?: { web: string; crm: string; agent: string };
  };
  socialProof: {
    activeBusinesses: string;
    avgBookingsPerMonth: string;
    whatsappAgents: string;
    satisfaction: string;
  };
  pillars: {
    title: string;
    subtitle: string;
    web: { title: string; description: string };
    crm: { title: string; description: string };
    whatsapp: { title: string; description: string };
  };
  howItWorks: {
    badge?: string;
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  features: {
    badge?: string;
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  pricing: {
    badge?: string;
    title: string;
    subtitle: string;
    monthly: string;
    popular: string;
    cta: string;
    plans: {
      name: string;
      price: string;
      features: string[];
    }[];
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  webShowcase: {
    badge: string;
    title: string;
    subtitle: string;
    niches?: { barberia: string; estetica: string; cafeteria: string };
  };
  whyItMatters: {
    badge: string;
    title: string;
    subtitle: string;
    pillars: Array<{
      title: string;
      stat: string;
      description: string;
    }>;
  };
  crmDemo: {
    badge: string;
    title: string;
    subtitle: string;
    videoAlt: string;
    chips: string[];
  };
  whatsappAgent: {
    badge: string;
    title: string;
    description: string;
    reasons: string[];
    online: string;
    conversation: { from: "client" | "bot"; text: string }[];
  };
  preview: {
    title: string;
    subtitle: string;
    cta: string;
    ctaSub: string;
    loading: string;
    error: string;
    retry: string;
    noData: string;
    startOver: string;
  };
  status: {
    building: string;
    buildingSub: string;
    ready: string;
    readySub: string;
    viewSite: string;
    error: string;
    errorSub: string;
    contact: string;
  };
  showcase: {
    badge?: string;
    title: string;
    subtitle: string;
    scrollHint?: string;
    bookButton?: string;
    niches: {
      barberia: string;
      estetica: string;
      cafeteria: string;
    };
    nicheContent?: {
      barberia: { heroText: string; services: string[] };
      estetica: { heroText: string; services: string[] };
      cafeteria: { heroText: string; services: string[] };
    };
  };
  auth: {
    login: string;
    register: string;
    googleButton: string;
    orEmail: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    submitLogin: string;
    submitRegister: string;
    processing: string;
    close: string;
    errorNameRequired: string;
    errorWrongPassword: string;
    errorEmailExists: string;
    errorWeakPassword: string;
    errorInvalidEmail: string;
    errorUserNotFound: string;
    errorGeneric: string;
  };
  footer: {
    rights: string;
    privacy: string;
    terms: string;
  };
}

export const RTL_LOCALES: Locale[] = ["he"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
  he: "עברית",
};
