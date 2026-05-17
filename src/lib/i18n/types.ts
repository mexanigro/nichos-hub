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
    badge?: string;
    headline: string;
    subheadline: string;
    cta: string;
    trustedBy: string;
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
  builder: {
    badge?: string;
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
      otroPlaceholder?: string;
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
      modeTitle?: string;
      solo?: string;
      team?: string;
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
