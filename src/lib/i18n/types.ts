export type Locale = "en" | "es" | "ru" | "he";

export interface Translations {
  nav: {
    features: string;
    pricing: string;
    howItWorks: string;
    contact: string;
    getStarted: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    trustedBy: string;
  };
  socialProof: {
    activeBusinesses: string;
    avgBookingsPerMonth: string;
    clientSatisfaction: string;
  };
  pillars: {
    title: string;
    subtitle: string;
    web: { title: string; description: string };
    crm: { title: string; description: string };
    whatsapp: { title: string; description: string };
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  features: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  pricing: {
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
  builder: {
    title: string;
    subtitle: string;
    steps: {
      niche: string;
      photos: string;
      details: string;
      branding: string;
    };
    niche: {
      title: string;
      subtitle: string;
    };
    photos: {
      title: string;
      subtitle: string;
      business: string;
      staff: string;
      dragDrop: string;
    };
    details: {
      title: string;
      subtitle: string;
      businessName: string;
      description: string;
      whatsapp: string;
      email: string;
      address: string;
      instagram: string;
    };
    branding: {
      title: string;
      subtitle: string;
      logo: string;
      logoUpload: string;
      logoCreate: string;
      colors: string;
    };
    submit: string;
    generating: string;
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
