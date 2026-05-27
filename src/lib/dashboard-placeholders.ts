import type { ClientLanguage } from "@/lib/client-language";

/**
 * Diccionario de placeholders/sugerencias para los inputs del dashboard donde
 * Liam edita el CONTENIDO del cliente — separado del chrome del dashboard
 * (labels, botones, headers) que se queda en español porque es la UI de Liam.
 *
 * La key identifica el campo. Si el idioma del cliente no tiene una entrada,
 * caemos a inglés. Nunca caemos a español para clientes extranjeros porque
 * el español dentro de un input de un cliente HE/EN/etc es ruido visual que
 * confunde.
 *
 * Liam puede actualizar este dict cuando quiera ajustar los ejemplos. No es
 * traducción literal — son ejemplos representativos del idioma de destino.
 */
export type PlaceholderKey =
  // Hero
  | "heroTitlePrefix"
  | "heroTitleHighlight"
  | "heroSubtitle"
  | "heroCtaPrimary"
  | "heroCtaSecondary"
  // Sections
  | "servicesTitle"
  | "servicesSubtitle"
  | "whyChooseUsTitle"
  | "whyChooseUsSubtitle"
  | "teamTitle"
  | "teamSubtitle"
  | "testimonialsTitle"
  | "testimonialsSubtitle"
  | "galleryTitle"
  | "gallerySubtitle"
  | "locationTitle"
  | "locationSubtitle"
  | "contactTitle"
  | "contactSubtitle"
  | "bookingTitle"
  | "bookingTagline"
  | "philosophyTitle"
  | "philosophySubtitle"
  | "processTitle"
  | "processSubtitle"
  | "ambienceTitle"
  | "ambienceSubtitle"
  | "portfolioTitle"
  | "portfolioSubtitle"
  | "faqTitle"
  | "faqSubtitle"
  // Brand / business
  | "tagline"
  | "description"
  | "aiPersona"
  // Editor placeholders
  | "benefitTitle"
  | "benefitDesc"
  | "testimonialName"
  | "testimonialTitle"
  | "testimonialText"
  | "serviceName"
  | "faqQuestion"
  | "faqAnswer"
  // AI generation field
  | "businessDescription";

type Dict = Partial<Record<PlaceholderKey, string>>;

const en: Dict = {
  heroTitlePrefix: "Welcome to",
  heroTitleHighlight: "Your Barbershop",
  heroSubtitle: "Short description of the business.",
  heroCtaPrimary: "Book now",
  heroCtaSecondary: "View services",
  servicesTitle: "Our services",
  whyChooseUsTitle: "Why choose us",
  teamTitle: "Our team",
  testimonialsTitle: "What our clients say",
  galleryTitle: "Gallery",
  locationTitle: "Where we are",
  contactTitle: "Contact us",
  bookingTitle: "Book your appointment",
  philosophyTitle: "Our philosophy",
  processTitle: "Our process",
  ambienceTitle: "Our space",
  portfolioTitle: "Our projects",
  faqTitle: "Frequently asked questions",
  faqSubtitle: "What our clients want to know",
  tagline: "Short phrase under the business name",
  description: "1-2 lines that explain what you do",
  aiPersona: "Tone of voice for the AI agent (e.g. friendly, professional).",
  benefitTitle: "Ex: 15 years of experience",
  benefitDesc: "One line explaining why it matters",
  testimonialName: "Ex: Maria R.",
  testimonialTitle: "Client for 2 years",
  testimonialText: "Best service I've had.",
  serviceName: "Service name",
  faqQuestion: "Ex: Do I need to book in advance?",
  faqAnswer: "Recommended, but we also take walk-ins.",
  businessDescription:
    "Describe the business in a paragraph: what they do, who their clients are, what makes them different…",
};

const he: Dict = {
  heroTitlePrefix: "ברוכים הבאים ל",
  heroTitleHighlight: "המספרה שלך",
  heroSubtitle: "תיאור קצר של העסק.",
  heroCtaPrimary: "הזמן עכשיו",
  heroCtaSecondary: "ראה שירותים",
  servicesTitle: "השירותים שלנו",
  whyChooseUsTitle: "למה לבחור בנו",
  teamTitle: "הצוות שלנו",
  testimonialsTitle: "מה לקוחותינו אומרים",
  galleryTitle: "גלריה",
  locationTitle: "איפה אנחנו",
  contactTitle: "צור קשר",
  bookingTitle: "הזמן את התור שלך",
  philosophyTitle: "הפילוסופיה שלנו",
  processTitle: "התהליך שלנו",
  ambienceTitle: "המרחב שלנו",
  portfolioTitle: "הפרויקטים שלנו",
  faqTitle: "שאלות נפוצות",
  faqSubtitle: "מה לקוחותינו רוצים לדעת",
  tagline: "משפט קצר מתחת לשם העסק",
  description: "1-2 שורות שמסבירות מה אתה עושה",
  aiPersona: "טון הדיבור של סוכן ה-AI (לדוגמה: ידידותי, מקצועי).",
  benefitTitle: "לדוגמה: 15 שנות ניסיון",
  benefitDesc: "שורה שמסבירה למה זה חשוב",
  testimonialName: "לדוגמה: מאיה כהן",
  testimonialTitle: "לקוחה כבר שנתיים",
  testimonialText: "השירות הכי טוב שקיבלתי.",
  serviceName: "שם השירות",
  faqQuestion: "לדוגמה: צריך לתאם תור מראש?",
  faqAnswer: "מומלץ, אבל מקבלים גם בלי תור.",
  businessDescription:
    "תאר את העסק בפסקה: מה אתם עושים, מי הלקוחות שלכם, מה מבדיל אתכם...",
};

const ru: Dict = {
  heroTitlePrefix: "Добро пожаловать в",
  heroTitleHighlight: "Ваш барбершоп",
  heroSubtitle: "Короткое описание бизнеса.",
  heroCtaPrimary: "Записаться",
  heroCtaSecondary: "Посмотреть услуги",
  servicesTitle: "Наши услуги",
  whyChooseUsTitle: "Почему выбирают нас",
  teamTitle: "Наша команда",
  testimonialsTitle: "Что говорят клиенты",
  galleryTitle: "Галерея",
  locationTitle: "Где мы",
  contactTitle: "Связаться",
  bookingTitle: "Запишитесь на приём",
  philosophyTitle: "Наша философия",
  processTitle: "Наш процесс",
  ambienceTitle: "Наше пространство",
  portfolioTitle: "Наши проекты",
  faqTitle: "Частые вопросы",
  faqSubtitle: "Что хотят знать наши клиенты",
  tagline: "Короткая фраза под названием бизнеса",
  description: "1-2 строки о том, что вы делаете",
  aiPersona: "Тон AI-агента (например: дружелюбный, профессиональный).",
  benefitTitle: "Напр.: 15 лет опыта",
  benefitDesc: "Одна строка, почему это важно",
  testimonialName: "Напр.: Мария Р.",
  testimonialTitle: "Клиентка уже 2 года",
  testimonialText: "Лучший сервис, что у меня был.",
  serviceName: "Название услуги",
  faqQuestion: "Напр.: Нужно ли записываться заранее?",
  faqAnswer: "Рекомендуем, но принимаем и без записи.",
  businessDescription:
    "Опишите бизнес в одном абзаце: чем занимаются, кто их клиенты, чем выделяются…",
};

const ar: Dict = {
  heroTitlePrefix: "أهلاً بكم في",
  heroTitleHighlight: "صالونك",
  heroSubtitle: "وصف قصير للعمل.",
  heroCtaPrimary: "احجز الآن",
  heroCtaSecondary: "اطلع على الخدمات",
  servicesTitle: "خدماتنا",
  whyChooseUsTitle: "لماذا تختارنا",
  teamTitle: "فريقنا",
  testimonialsTitle: "ما يقوله عملاؤنا",
  galleryTitle: "المعرض",
  locationTitle: "أين نحن",
  contactTitle: "تواصل معنا",
  bookingTitle: "احجز موعدك",
  philosophyTitle: "فلسفتنا",
  processTitle: "طريقة عملنا",
  ambienceTitle: "مكاننا",
  portfolioTitle: "مشاريعنا",
  faqTitle: "الأسئلة الشائعة",
  faqSubtitle: "ما يريد عملاؤنا معرفته",
  tagline: "عبارة قصيرة تحت اسم العمل",
  description: "سطر أو سطران يشرحان ما تقدّمه",
  aiPersona: "نبرة وكيل الذكاء الاصطناعي (مثلاً: ودود، مهني).",
  benefitTitle: "مثلاً: 15 سنة خبرة",
  benefitDesc: "سطر يشرح لماذا هذا مهم",
  testimonialName: "مثلاً: مريم ر.",
  testimonialTitle: "زبونة منذ سنتين",
  testimonialText: "أفضل خدمة حصلت عليها.",
  serviceName: "اسم الخدمة",
  faqQuestion: "مثلاً: هل أحتاج للحجز مسبقًا؟",
  faqAnswer: "موصى به، لكننا نستقبل أيضًا بدون موعد.",
  businessDescription:
    "صف العمل في فقرة: ماذا يفعلون، من هم عملاؤهم، ما يميّزهم…",
};

const es: Dict = {
  heroTitlePrefix: "Bienvenidos a",
  heroTitleHighlight: "Tu barbería",
  heroSubtitle: "Descripción breve del negocio.",
  heroCtaPrimary: "Reservar ahora",
  heroCtaSecondary: "Ver servicios",
  servicesTitle: "Nuestros servicios",
  whyChooseUsTitle: "Por qué elegirnos",
  teamTitle: "Nuestro equipo",
  testimonialsTitle: "Lo que dicen nuestros clientes",
  galleryTitle: "Galería",
  locationTitle: "Dónde estamos",
  contactTitle: "Contactanos",
  bookingTitle: "Reservá tu turno",
  philosophyTitle: "Nuestra filosofía",
  processTitle: "Nuestro proceso",
  ambienceTitle: "Nuestro espacio",
  portfolioTitle: "Nuestros proyectos",
  faqTitle: "Preguntas frecuentes",
  faqSubtitle: "Lo que nuestros clientes quieren saber",
  tagline: "Frase corta debajo del nombre del negocio",
  description: "1-2 líneas que explican lo que hacen",
  aiPersona: "Tono del agente IA (ej: amable, profesional).",
  benefitTitle: "Ej: 15 años de experiencia",
  benefitDesc: "Una línea explicando por qué importa",
  testimonialName: "Ej: María R.",
  testimonialTitle: "Cliente hace 2 años",
  testimonialText: "El mejor servicio que tuve.",
  serviceName: "Nombre del servicio",
  faqQuestion: "Ej: ¿Hace falta sacar turno antes?",
  faqAnswer: "Recomendado, pero también atendemos walk-in.",
  businessDescription:
    "Describí el negocio en un párrafo: qué hacen, quiénes son sus clientes, qué los diferencia…",
};

const ALL: Record<ClientLanguage, Dict> = { en, he, ru, ar, es };

/**
 * Devuelve el placeholder para una clave en el idioma del cliente. Si la clave
 * no está definida para ese idioma, devuelve el equivalente en inglés (no en
 * español — evitamos contaminar inputs de clientes extranjeros con español).
 */
export function placeholderFor(
  lang: ClientLanguage,
  key: PlaceholderKey,
): string {
  return ALL[lang][key] ?? en[key] ?? "";
}

/**
 * Helper para obtener todos los placeholders para un idioma dado. Útil cuando
 * un componente necesita un objeto completo (ej. mapear sobre un dict).
 */
export function placeholdersForLanguage(lang: ClientLanguage): Dict {
  return { ...en, ...ALL[lang] };
}
