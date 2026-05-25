export type Locale = "en" | "es" | "he" | "ru" | "ar";

export interface Translations {
  nav: { work: string; crm: string; agent: string; how?: string; pricing: string; faq: string; start: string };
  hero: { eyebrow: string; h1a: string; h1b: string; h1c: string; sub: string; cta: string; ghost: string };
  showcase: {
    eyebrow: string; title: string; titleEm: string; sub: string; why: string;
    pickHint: string; open: string;
    sites: Record<"barber" | "tattoo" | "nails" | "cafe" | "estetica" | "remod", { name?: string; tagline: string; blurb?: string }>;
  };
  crm: {
    eyebrow: string; title: string; titleEm: string; sub: string; why: string;
    bullets: string[];
    dashboard: { title: string; bookings: string; leads: string; revenue: string; agendaTitle: string; inboxTitle: string };
  };
  agent: {
    eyebrow: string; title: string; titleEm: string; sub: string; why: string;
    reasons: { t: string; d: string }[];
    chat: { from: "client" | "agent"; text: string }[];
  };
  everything: {
    eyebrow: string; title: string; titleEm: string; sub: string;
    items: { t: string; d: string }[];
    whyTitle: string; whyTitleEm: string; whyBody: string;
    whyPoints: { k: string; v: string }[];
  };
  manifesto: {
    eyebrow: string; h: string; hEm: string; body: string;
    points: { k: string; v: string }[];
  };
  process: {
    eyebrow: string; title: string; titleEm: string;
    steps: { t: string; d: string; time: string }[];
  };
  pricing: {
    eyebrow: string; title: string; titleEm: string; sub: string; monthlyAbbr: string;
    plans: { tag: string; name: string; price: number; tagline: string; highlight?: boolean; items: string[] }[];
    setupLabel: string; setupValue: string; cta: string; ctaSecondary: string; note: string;
  };
  faq: {
    eyebrow: string; title: string; titleEm: string;
    items: { q: string; a: string }[];
  };
  final: { a: string; b: string; cta: string; ctaHref?: string; note: string };
  founder: {
    eyebrow: string; h: string; hName: string; hRest: string; body: string;
    role: string; location: string;
    stats: { k: string; v: string }[];
    cta: string;
  };
  foot: { rights: string; legal: string[] };
  statusLine: string;
  pago: {
    title: string; back: string; step: string; of: string;
    planLabel: string; planChange: string; includes: string; monthlyAbbr: string;
    yourInfo: string; yourInfoSub: string;
    nameLabel: string; namePh: string; emailLabel: string; emailPh: string;
    phoneLabel: string; phonePh: string; businessLabel: string; businessPh: string;
    nicheLabel: string; nichePh: string; niches: string[];
    contract: string; contractExpand: string; contractCollapse: string; contractBody: string;
    accept: string; acceptShort: string;
    paymentTitle: string; paymentSub: string; cardPlaceholder: string;
    cta: string; ctaProcessing: string; footerSecurity: string;
    summary: string; total: string; whyTrust: string; whyTrustItems: string[];
  };
  pagoOk: {
    eyebrow: string; title: string; sub: string; next: string;
    steps: { t: string; d: string }[];
    cta: string; receipt: string; dashboard: string;
  };
  pagoErr: {
    eyebrow: string; title: string; sub: string;
    tips: string[];
    cta: string; ctaSecondary: string; ref: string;
  };
  pagoExpired: {
    eyebrow: string; title: string; sub: string;
    cta: string; ctaSecondary: string;
  };
  // PRESERVED — used by onboarding/preview and onboarding/status pages
  preview: {
    title: string; subtitle: string; cta: string; ctaSub: string;
    loading: string; error: string; retry: string; noData: string; startOver: string;
  };
  status: {
    building: string; buildingSub: string; ready: string; readySub: string;
    viewSite: string; error: string; errorSub: string; contact: string;
  };
  wizard: {
    next: string; back: string; skip: string; buildSite: string; submitInfo: string;
    nicheTitle: string; nicheSub: string;
    modeTitle: string; modeSub: string;
    businessTitle: string; businessSub: string;
    contactTitle: string; contactSub: string;
    styleTitle: string; styleSub: string;
    logoTitle: string; logoSub: string;
    brandTitle: string; brandSub: string;
    servicesTitle: string; servicesSub: string;
    hoursTitle: string; hoursSub: string;
    ownerTitle: string; ownerSub: string;
    galleryTitle: string; gallerySub: string;
    reviewTitle: string; reviewSub: string; reviewSubPaid: string;
    niches: Record<string, string>;
    customNicheLabel: string; customNichePh: string;
    solo: string; soloDesc: string; team: string; teamDesc: string;
    businessNameLabel: string; businessNamePh: string;
    taglineLabel: string; taglinePh: string;
    descLabel: string; descPh: string;
    whatsappLabel: string; emailLabel: string; phoneLabel: string;
    instagramLabel: string; facebookLabel: string;
    addressLabel: string; districtLabel: string; cityLabel: string;
    optional: string;
    colorsLabel: string; colorsPh: string;
    logoCreateLabel: string; logoCreateDesc: string;
    uploadDrop: string; uploadHint: string; uploadRemove: string;
    logoLightLabel: string; logoDarkLabel: string;
    accentLabel: string; styleKeywords: string;
    addService: string; serviceName: string; servicePrice: string; serviceDuration: string;
    dayNames: string[]; closed: string;
    ownerNameLabel: string; ownerRoleLabel: string; ownerBioLabel: string;
    ownerPhotoLabel: string; staffPhotos: string;
    heroImage: string; galleryImages: string;
    nicheTypeLabel: string; modeLabel: string;
    sectionBusiness: string; sectionContact: string; sectionStyle: string;
    sectionBrand: string; sectionServices: string; sectionHours: string;
    sectionOwner: string; sectionGallery: string; edit: string;
    errNiche: string; errCustomNiche: string; errMode: string;
    errBusinessName: string; errContact: string; errEmail: string;
    noClientId: string; noClientIdSub: string;
  };
  // PRESERVED — used by AuthModal in mi-cuenta and onboarding/preview
  auth: {
    login: string; register: string; googleButton: string; orEmail: string;
    name: string; namePlaceholder: string; email: string; emailPlaceholder: string;
    password: string; passwordPlaceholder: string;
    submitLogin: string; submitRegister: string; processing: string; close: string;
    errorNameRequired: string; errorWrongPassword: string; errorEmailExists: string;
    errorWeakPassword: string; errorInvalidEmail: string; errorUserNotFound: string; errorGeneric: string;
  };
}

export const RTL_LOCALES: Locale[] = ["he", "ar"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ru: "Русский",
  he: "עברית",
  ar: "العربية",
};

export const LOCALE_CODES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "ru", label: "RU" },
  { code: "he", label: "HE" },
  { code: "ar", label: "AR" },
];
