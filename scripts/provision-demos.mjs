#!/usr/bin/env node
/**
 * Provisiona 4 webs demo de tattoo para prospectos.
 * Crea los documentos en Firestore (hub_clients, clients, config)
 * SIN deploy a Vercel (eso se hace después cuando Liam esté en la PC).
 *
 * Uso: node scripts/provision-demos.mjs
 *
 * Requiere las env vars de Firebase Admin SDK (.env o .env.local).
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    console.error("No se pudo leer .env.local — asegurate de tener las env vars de Firebase");
    process.exit(1);
  }
}

loadEnv();

let cleanKey = (process.env.FIREBASE_PRIVATE_KEY || "").trim();
if (/^["'`]/.test(cleanKey) && cleanKey[0] === cleanKey[cleanKey.length - 1]) {
  cleanKey = cleanKey.slice(1, -1);
}
cleanKey = cleanKey.replace(/\\n/g, "\n").replace(/\\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: cleanKey,
  }),
});

const databaseId = process.env.FIREBASE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
try { db.settings({ preferRest: true }); } catch {};

// ═══════════════════════════════════════════════════════════════
// DEMO DATA — 4 tattoo artists
// ═══════════════════════════════════════════════════════════════

const demos = [
  {
    slug: "demo-igal-tattz",
    businessName: "Igal Tattz",
    artistName: "Igal Alexi",
    mode: "solo",
    instagram: "https://instagram.com/igal.tattz",
    waLink: "https://wa.link/igaltattz",
    specialty: "Pointillism Realism",
    location: "תל אביב",
    description: "קעקועי פוינטיליזם וריאליזם ברמה הגבוהה ביותר. כל יצירה היא שילוב של אלפי נקודות שיוצרות תמונה שלמה — דיוק, סבלנות ואמנות טהורה.",
    tagline: "כשנקודות הופכות לאמנות",
    heroTitle: { prefix: "נקודה אחרי נקודה,", highlight: "אמנות נצחית", suffix: "פוינטיליזם על העור" },
    heroSubtitle: "כל פרויקט מתחיל בפגישת ייעוץ חינם. נפגשים, מדברים על החזון, ורק אז קובעים סשן. ללא התחייבות.",
    logoIconName: "CircleDot",
    branding: {
      colors: {
        accent: "#c2654a",
        accentLight: "#d4836a",
        surfaceDark: "#0c0a09",
        background: "#0c0a09",
        foreground: "#ede8e4",
        muted: "#1c1a19",
        mutedForeground: "#9a9490",
      },
      fonts: {
        display: "Playfair Display",
        body: "DM Sans",
      },
    },
    heroVariant: "standard",
    galleryVariant: "bento-stats",
    servicesVariant: "list-with-icons",
    whyChooseUsVariant: "standard",
    globalAmbientParticles: { enabled: true, type: "smoke", density: "subtle" },
    variantConfigs: {
      galleryBentoStats: {
        stats: [
          { value: "5,000+", label: "נקודות ליצירה" },
          { value: "8+", label: "שנות ניסיון" },
          { value: "100%", label: "מחטים חד-פעמיות" },
        ],
      },
    },
    aiPersona: "אתם היועץ הוירטואלי של Igal Tattz. איגל מתמחה בפוינטיליזם — אלפי נקודות זעירות שיוצרות תמונה שלמה. עזרו ללקוחות להבין את הטכניקה, לבחור שירות ולקבוע ייעוץ. דברו כמו מי שמבין אמנות — ברגישות, בסקרנות ובמקצועיות.",
    splashVariant: 5,
    services: [
      { id: "consultation", name: "ייעוץ חינם", description: "פגישה של 30-60 דקות לדון ברעיון, בסגנון ובמיקום. ללא עלות וללא התחייבות.", duration: 60, price: 0 },
      { id: "pointillism", name: "פוינטיליזם", description: "הטכניקה המיוחדת של איגל — אלפי נקודות זעירות שיוצרות תמונה מפורטת להפליא. עבודה סבלנית שדורשת מיומנות יוצאת דופן.", duration: 240, price: 250 },
      { id: "realism", name: "ריאליזם", description: "דיוקנות, בעלי חיים וסצנות ריאליסטיות בשחור-אפור. רמת פירוט גבוהה שנראית כמו צילום על העור.", duration: 180, price: 200 },
      { id: "custom", name: "עיצוב מותאם", description: "יצירה מקורית לגמרי, מותאמת לחזון שלכם. שילוב סגנונות, רעיונות ומשמעות אישית.", duration: 180, price: 200 },
      { id: "fine-line", name: "קו עדין", description: "עבודה עדינה ומדויקת עם מחט בודדת. מינימליזם שמדבר בשקט.", duration: 120, price: 150 },
      { id: "cover-up", name: "כיסוי קעקוע", description: "הפיכת קעקוע ישן ליצירה חדשה. ייעוץ חובה לפני.", duration: 180, price: 180 },
    ],
    staff: [{
      id: "igal", slug: "igal-alexi", name: "Igal Alexi",
      photoUrl: "",
      specialty: "Pointillism & Realism",
      bio: "אמן קעקועים מתל אביב, מתמחה בפוינטיליזם וריאליזם. כל יצירה בנויה מאלפי נקודות קטנות שיוצרות תמונה שלמה — סגנון ייחודי שדורש סבלנות, דיוק ואהבה לפרטים.",
      portfolio: [],
      social: { instagram: "https://instagram.com/igal.tattz" },
    }],
    testimonials: [
      { name: "דניאל כ.", title: "", text: "הפוינטיליזם של איגל ברמה אחרת לגמרי. כל מי שרואה את הקעקוע לא מאמין שזה עשוי מנקודות.", rating: 5 },
      { name: "מיכל ר.", title: "", text: "מקצוען אמיתי. הקשיב לרעיון שלי, שיפר אותו, והתוצאה מושלמת.", rating: 5 },
      { name: "אורי ב.", title: "", text: "שווה כל שקל. הסבלנות והדיוק של איגל מטורפים.", rating: 5 },
    ],
  },
  {
    slug: "demo-gooli-ink",
    businessName: "Gooli Ink",
    artistName: "Gooli",
    mode: "solo",
    instagram: "https://instagram.com/gooli_ink",
    waLink: "",
    specialty: "Japanese Style",
    location: "תל אביב",
    description: "קעקועים בסגנון יפני מסורתי — דרקונים, גלים, פרחי דובדבן, אותיות קאנג׳י ועבודות גב שלמות. אמנות שמכבדת מסורת של מאות שנים.",
    tagline: "אמנות יפנית על העור",
    heroTitle: { prefix: "מסורת יפנית,", highlight: "אמנות נצחית", suffix: "Irezumi בתל אביב" },
    heroSubtitle: "סגנון יפני אותנטי — מדרקונים ונמרים ועד גלים ופרחי דובדבן. כל פרויקט מתחיל בייעוץ חינם.",
    logoIconName: "Waves",
    branding: {
      colors: {
        accent: "#c9a84c",
        accentLight: "#dfc06f",
        surfaceDark: "#0b0c14",
        background: "#0b0c14",
        foreground: "#f0ead6",
        muted: "#161827",
        mutedForeground: "#9b9688",
      },
      fonts: {
        display: "Noto Serif",
        body: "Noto Sans",
      },
    },
    heroVariant: "slider",
    galleryVariant: "standard",
    servicesVariant: "card-stack-tabs",
    whyChooseUsVariant: "standard",
    globalAmbientParticles: { enabled: true, type: "sparkles", density: "subtle" },
    variantConfigs: {
      servicesCardStackTabs: {
        filters: [
          { key: "all", label: "הכל" },
          { key: "irezumi", label: "Irezumi" },
          { key: "motif", label: "מוטיבים" },
          { key: "kanji", label: "קאנג׳י" },
        ],
        layout: "stack-carousel",
      },
    },
    aiPersona: "אתם היועץ הוירטואלי של Gooli Ink. גולי מתמחה בסגנון יפני מסורתי — Irezumi. דרקונים, נמרים, גלים, פרחי דובדבן ומוטיבים מיתולוגיים. עזרו ללקוחות לבחור מוטיב, להבין את המסורת ולקבוע ייעוץ. דברו בהערכה לאמנות ולמסורת, בחום ובמקצועיות.",
    splashVariant: "impact-split",
    services: [
      { id: "consultation", name: "ייעוץ חינם", description: "פגישה לדון בפרויקט, סגנון ומיקום. ללא עלות וללא התחייבות.", duration: 60, price: 0 },
      { id: "irezumi", name: "Irezumi — סגנון יפני מלא", description: "עבודות גדולות בסגנון יפני מסורתי — גב שלם, שרוול מלא או חצי שרוול. דרקונים, נמרים, קוי, גלים ומוטיבים קלאסיים.", duration: 300, price: 300 },
      { id: "japanese-motif", name: "מוטיב יפני", description: "יצירה בודדת בסגנון יפני — דרקון, גל קאנגאווה, פרח דובדבן, מסכת אוני או דמות מיתולוגית.", duration: 180, price: 200 },
      { id: "kanji", name: "קאנג׳י ואותיות", description: "כתב יפני עם משמעות — אותיות קאנג׳י, היראגנה וקטאקנה. דיוק בכל קו.", duration: 90, price: 120 },
      { id: "custom-japanese", name: "עיצוב מותאם", description: "שילוב של אלמנטים יפניים עם סגנון אישי. מותאם לחלוטין לחזון שלכם.", duration: 180, price: 220 },
      { id: "cover-up", name: "כיסוי קעקוע", description: "הפיכת קעקוע ישן ליצירה חדשה בסגנון יפני. ייעוץ חובה.", duration: 180, price: 200 },
    ],
    staff: [{
      id: "gooli", slug: "gooli", name: "Gooli",
      photoUrl: "",
      specialty: "Japanese Traditional (Irezumi)",
      bio: "אמן קעקועים בסגנון יפני מסורתי. מתמחה ב-Irezumi — דרקונים, נמרים, גלים ודמויות מיתולוגיות. כל יצירה מכבדת את המסורת של מאות שנים של אמנות קעקוע יפנית.",
      portfolio: [],
      social: { instagram: "https://instagram.com/gooli_ink" },
    }],
    testimonials: [
      { name: "יונתן ש.", title: "", text: "השרוול היפני שגולי עשה לי הוא יצירת מופת. כל פרט במקום.", rating: 5 },
      { name: "נועה ד.", title: "", text: "חיפשתי אמן שבאמת מבין את הסגנון היפני ומכבד את המסורת. מצאתי.", rating: 5 },
      { name: "Tom R.", title: "", text: "Incredible Japanese style work. Worth flying to Tel Aviv for.", rating: 5 },
    ],
  },
  {
    slug: "demo-future-tattoo",
    businessName: "Future Tattoo Studio",
    artistName: "Future Tattoo",
    mode: "team",
    instagram: "https://instagram.com/future_tattoo_studio",
    waLink: "https://api.whatsapp.com/send?phone=9720549758414",
    specialty: "Multi-Artist Studio + Piercing",
    location: "תרמ״ב 13, ראשון לציון",
    description: "סטודיו לקעקועים ופירסינג עם צוות אמנים מגוון — כל סגנון, כל רעיון. מריאליזם ועד ניו סקול, מקווים עדינים ועד כיסויים. המקום שבו האמנות שלכם מתגשמת.",
    tagline: "כל סגנון. כל חזון. מקום אחד.",
    heroTitle: { prefix: "הסטודיו של", highlight: "העתיד", suffix: "קעקועים ופירסינג בראשל״צ" },
    heroSubtitle: "צוות אמנים מקצועי, כל הסגנונות תחת קורת גג אחת. ייעוץ חינם — בואו לדבר על הרעיון שלכם.",
    logoIconName: "Zap",
    branding: {
      colors: {
        accent: "#8b5cf6",
        accentLight: "#a78bfa",
        surfaceDark: "#100f14",
        background: "#100f14",
        foreground: "#eeeaf2",
        muted: "#1c1b24",
        mutedForeground: "#918d99",
      },
      fonts: {
        display: "Space Grotesk",
        body: "Inter",
      },
    },
    heroVariant: "slider",
    galleryVariant: "grid-with-filters",
    servicesVariant: "treatment-card-grid",
    whyChooseUsVariant: "standard",
    globalAmbientParticles: { enabled: true, type: "sparkles", density: "medium" },
    variantConfigs: {
      galleryGridWithFilters: {
        filters: [
          { key: "all", label: "הכל" },
          { key: "realism", label: "ריאליזם" },
          { key: "fine-line", label: "קו עדין" },
          { key: "color", label: "צבע" },
          { key: "cover-up", label: "כיסוי" },
        ],
      },
    },
    aiPersona: "אתם היועץ הוירטואלי של Future Tattoo Studio. סטודיו עם צוות אמנים מגוון בראשון לציון — כל סגנון תחת קורת גג אחת, כולל פירסינג. עזרו ללקוחות לבחור אמן לפי סגנון, להבין מה מתאים להם ולקבוע ייעוץ. נעימים, אנרגטיים ומקצועיים.",
    splashVariant: "impact-scale",
    services: [
      { id: "consultation", name: "ייעוץ חינם", description: "פגישה עם אחד האמנים שלנו לדון בפרויקט. ללא עלות.", duration: 45, price: 0 },
      { id: "custom-design", name: "עיצוב מותאם", description: "קעקוע מקורי שמעוצב בדיוק עבורכם. האמן ייצור סקיצה ייחודית לפי החזון שלכם.", duration: 180, price: 180 },
      { id: "realism", name: "ריאליזם", description: "דיוקנות, בעלי חיים וסצנות ריאליסטיות. שחור-אפור או צבע מלא.", duration: 180, price: 200 },
      { id: "fine-line", name: "קו עדין ומינימליזם", description: "עבודה עדינה במחט בודדת. מינימליזם, גיאומטריה ועיצובים קטנים.", duration: 120, price: 150 },
      { id: "cover-up", name: "כיסוי ושיפור", description: "הפיכת קעקוע ישן ליצירה חדשה. ייעוץ חובה לפני.", duration: 180, price: 170 },
      { id: "flash", name: "פלאש וקטנים", description: "עיצובים מוכנים במחיר קבוע. מושלם למתחילים או כתוספת לקולקציה.", duration: 60, price: 120 },
      { id: "piercing", name: "פירסינג מקצועי", description: "פירסינג בכל המיקומים — מלובים ועד סחוס. תכשיטים איכותיים מטיטניום.", duration: 30, price: 80 },
    ],
    staff: [
      { id: "shay", slug: "shay", name: "Shay", photoUrl: "", specialty: "ריאליזם וצבע", bio: "מתמחה בריאליזם צבעוני ושחור-אפור.", portfolio: [], social: {} },
      { id: "liela", slug: "liela", name: "Liela", photoUrl: "", specialty: "קו עדין ומינימליזם", bio: "עבודה עדינה ומדויקת — קווים דקים, פרחים ועיצובים מינימליסטיים.", portfolio: [], social: {} },
      { id: "einav", slug: "einav", name: "Einav", photoUrl: "", specialty: "ניו סקול ועיצוב מותאם", bio: "סגנון צבעוני ונועז. עיצובים מותאמים שמפציצים.", portfolio: [], social: {} },
    ],
    testimonials: [
      { name: "רון מ.", title: "", text: "סטודיו מקצועי ונקי. שאי עשה לי שרוול מטורף — מומלץ בחום.", rating: 5 },
      { name: "הילה כ.", title: "", text: "עשיתי פירסינג ושני קעקועים קטנים. צוות מדהים ואווירה נעימה.", rating: 5 },
      { name: "אלון ג.", title: "", text: "הכי טוב בראשון. נקי, מקצועי, ותוצאות ברמה גבוהה.", rating: 5 },
    ],
  },
  {
    slug: "demo-marganink",
    businessName: "Marganink",
    artistName: "Liron Margani",
    mode: "solo",
    instagram: "https://instagram.com/marganink",
    waLink: "https://wa.me/message/XJF7A4BOQPJBN1",
    specialty: "Fine Line & Minimalism",
    location: "סטודיו פרטי, ישראל",
    description: "קעקועים מדויקים ואיכותיים — קווים דקים ונקיים בסגנון יפני ומינימליסטי. סטודיו פרטי עם אווירה אינטימית ומקצועית.",
    tagline: "קווים דקים, נקיים, ויפניים",
    heroTitle: { prefix: "דיוק בכל", highlight: "קו", suffix: "קעקועים מינימליסטיים" },
    heroSubtitle: "קווים דקים ונקיים, סגנון יפני ומינימליזם. כל קעקוע הוא יצירה מדויקת שנשארת יפה לאורך זמן. ייעוץ חינם.",
    logoIconName: "Feather",
    branding: {
      colors: {
        accent: "#c4917e",
        accentLight: "#d4a997",
        surfaceDark: "#100e0f",
        background: "#100e0f",
        foreground: "#eae5e2",
        muted: "#1e1b1a",
        mutedForeground: "#9b9492",
      },
      fonts: {
        display: "Cormorant Garamond",
        body: "Lato",
      },
    },
    heroVariant: "standard",
    galleryVariant: "standard",
    servicesVariant: "standard",
    whyChooseUsVariant: "standard",
    globalAmbientParticles: { enabled: true, type: "pearls", density: "subtle" },
    aiPersona: "אתם היועצת הוירטואלית של Marganink — הסטודיו הפרטי של לירון מרגני. לירון מתמחה בקווים דקים ונקיים, סגנון יפני מינימליסטי ועבודות בוטניות עדינות. עזרו ללקוחות לבחור סגנון, לדמיין את הקעקוע ולקבוע ייעוץ. דברו בנעימות, ברגישות ובשקט — כמו הסגנון עצמו.",
    splashVariant: 4,
    services: [
      { id: "consultation", name: "ייעוץ חינם", description: "פגישה בסטודיו הפרטי לדון ברעיון ולתכנן את הקעקוע. ללא עלות.", duration: 45, price: 0 },
      { id: "fine-line", name: "קו עדין", description: "קעקועים בקו דק ומדויק — מינימליזם, גיאומטריה, פרחים ואלמנטים עדינים.", duration: 120, price: 150 },
      { id: "japanese-fine", name: "סגנון יפני עדין", description: "אלמנטים יפניים בקו דק — פרחי לוטוס, גלים, דגי קוי ואותיות קאנג׳י בגישה מינימליסטית.", duration: 150, price: 180 },
      { id: "botanical", name: "בוטני ופרחים", description: "פרחים, עלים ואלמנטים בוטניים עדינים. כל פרט מצויר בדיוק.", duration: 120, price: 150 },
      { id: "custom", name: "עיצוב מותאם", description: "יצירה ייחודית שמשלבת את הסגנון של לירון עם החזון שלכם.", duration: 150, price: 170 },
      { id: "small-tattoo", name: "קעקועים קטנים", description: "עיצובים קטנים ועדינים. מושלם כקעקוע ראשון או כתוספת לקולקציה.", duration: 60, price: 100 },
    ],
    staff: [{
      id: "liron", slug: "liron-margani", name: "Liron Margani",
      photoUrl: "",
      specialty: "Fine Line & Japanese Minimalism",
      bio: "אמנית קעקועים מתמחה בקווים דקים ונקיים, סגנון יפני מינימליסטי ועבודות בוטניות עדינות. סטודיו פרטי עם אווירה אינטימית ומקצועית.",
      portfolio: [],
      social: { instagram: "https://instagram.com/marganink" },
    }],
    testimonials: [
      { name: "שירה ל.", title: "", text: "לירון עשתה לי לוטוס על הזרוע — מושלם. הקווים כל כך דקים ונקיים.", rating: 5 },
      { name: "יואב ת.", title: "", text: "הסטודיו הפרטי מרגיש כמו בבית. מקצועית ברמה גבוהה מאוד.", rating: 5 },
      { name: "Anna K.", title: "", text: "Best fine-line work I've seen in Israel. Clean, precise, beautiful.", rating: 5 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// Build Firestore config per demo
// ═══════════════════════════════════════════════════════════════

function buildConfig(d) {
  const scheduleDefault = {
    monday: { isOpen: false, hours: { start: "00:00", end: "00:00" }, breaks: [] },
    tuesday: { isOpen: true, hours: { start: "11:00", end: "20:00" }, breaks: [{ start: "14:00", end: "15:00", label: "הפסקה" }] },
    wednesday: { isOpen: true, hours: { start: "11:00", end: "20:00" }, breaks: [{ start: "14:00", end: "15:00", label: "הפסקה" }] },
    thursday: { isOpen: true, hours: { start: "11:00", end: "20:00" }, breaks: [{ start: "14:00", end: "15:00", label: "הפסקה" }] },
    friday: { isOpen: true, hours: { start: "11:00", end: "20:00" }, breaks: [{ start: "15:00", end: "16:00", label: "הפסקה" }] },
    saturday: { isOpen: true, hours: { start: "10:00", end: "18:00" }, breaks: [] },
    sunday: { isOpen: false, hours: { start: "00:00", end: "00:00" }, breaks: [] },
  };

  return {
    business: { type: "tattoo", mode: d.mode, name: d.businessName },
    brand: {
      name: d.businessName,
      tagline: d.tagline,
      description: d.description,
      logoIconName: d.logoIconName || "Pen",
      faviconEmoji: "🖊️",
      aiPersona: d.aiPersona || `אתם מומחה וירטואלי של ${d.businessName}. עזרו ללקוחות לבחור שירות, לתכנן את הקעקוע ולקבוע ייעוץ. חמים, מקצועיים ויודעים.`,
    },
    contact: {
      phone: "",
      email: "",
      address: { street: d.location },
      social: { instagram: d.instagram },
    },
    features: {
      showHero: true,
      showServices: true,
      showTeam: d.mode === "team",
      showBooking: true,
      showGallery: true,
      showTestimonials: true,
      showContact: true,
      showLocation: true,
      showFaq: true,
      showInstagram: true,
      showWhyChooseUs: true,
      showAdmin: true,
      showChatbot: false,
      beforeAfter: false,
    },
    activeTheme: "ink-dark",
    splash: { enabled: true, variant: d.splashVariant || 5 },
    ...(d.heroVariant ? { heroVariant: d.heroVariant } : {}),
    ...(d.galleryVariant ? { galleryVariant: d.galleryVariant } : {}),
    ...(d.servicesVariant ? { servicesVariant: d.servicesVariant } : {}),
    ...(d.whyChooseUsVariant ? { whyChooseUsVariant: d.whyChooseUsVariant } : {}),
    ...(d.globalAmbientParticles ? { globalAmbientParticles: d.globalAmbientParticles } : {}),
    ...(d.variantConfigs ? { variantConfigs: d.variantConfigs } : {}),
    language: "he",
    // Client-level branding overrides — colors, fonts
    ...(d.branding ? { branding: d.branding } : {}),
    hero: {
      titlePrefix: d.heroTitle.prefix,
      titleHighlight: d.heroTitle.highlight,
      titleSuffix: d.heroTitle.suffix,
      subtitle: d.heroSubtitle,
      ctaPrimary: "קבעו ייעוץ חינם",
      ctaSecondary: "לתיק עבודות",
      backgroundImage: "",
    },
    services: d.services,
    staff: d.staff.map(s => ({ ...s, schedule: scheduleDefault })),
    testimonials: d.testimonials,
    gallery: [],
    hours: {
      tuesday: { start: "11:00", end: "20:00" },
      wednesday: { start: "11:00", end: "20:00" },
      thursday: { start: "11:00", end: "20:00" },
      friday: { start: "11:00", end: "20:00" },
      saturday: { start: "10:00", end: "18:00" },
      monday: null,
      sunday: null,
    },
    sections: {
      services: { title: "השירותים", subtitle: "מה אנחנו מציעים", images: [] },
      team: { title: "האמנים", subtitle: d.mode === "team" ? "הכירו את הצוות" : "האמן", description: "" },
      whyChooseUs: {
        title: "למה אנחנו",
        subtitle: "הסטנדרט שלנו",
        mainImage: "",
        badge: "",
        benefits: [
          { iconName: "ShieldCheck", title: "היגיינה ברמת רפואה", desc: "מחטים חד-פעמיות, ציוד מעוקר וחיטוי מלא אחרי כל לקוח." },
          { iconName: "Clock", title: "ייעוץ לפני הכול", desc: "כל פרויקט מתחיל בפגישת ייעוץ ללא עלות — להבין את החזון לפני שמתחילים." },
          { iconName: "Award", title: "מקצועיות", desc: "שנים של ניסיון, אלפי לקוחות מרוצים ותיק עבודות שמדבר בעד עצמו." },
          { iconName: "Zap", title: "אמנות מותאמת", desc: "כל קעקוע הוא יצירה מקורית, מעוצבת במיוחד עבורכם." },
        ],
      },
      testimonials: { title: "מה אומרים עלינו", subtitle: "ביקורות" },
      gallery: { title: "תיק עבודות", subtitle: "היצירות שלנו" },
      location: { title: "מגיעים אלינו", subtitle: "איפה אנחנו" },
      contact: { title: "צרו קשר", subtitle: "בואו נדבר", description: "מוכנים? שלחו הודעה ונחזור אליכם לתאם ייעוץ." },
      booking: {
        title: "קביעת תור",
        tagline: "מתחילים בייעוץ חינם",
        steps: { service: "שירות", staff: "אמן", datetime: "תזמון", details: "אישור", payment: "תשלום" },
        aiConsultant: {
          title: "עוזר וירטואלי",
          subtitle: "לא בטוחים מאיפה?",
          description: "תארו את הרעיון ונמליץ על שירות וסגנון מתאים.",
          agentLabel: "יועץ",
          placeholder: "תארו את הרעיון שלכם...",
        },
        success: { title: "הצלחה", confirmed: "אושר!", requestSaved: "הבקשה נשמרה!", cancelled: "בוטל" },
      },
      instagram: {
        title: "עקבו אחרינו",
        handle: `@${d.instagram.split("/").pop()}`,
        url: d.instagram,
        images: [],
      },
      faq: {
        title: "שאלות נפוצות",
        subtitle: "לפני שעושים קעקוע",
        items: [
          { question: "איך להתכונן לסשן?", answer: "לישון טוב, לאכול היטב, לשתות מים ולהימנע מאלכוהול 24 שעות לפני." },
          { question: "כמה עולה קעקוע?", answer: "המחיר משתנה לפי גודל, פירוט ומיקום. קבעו ייעוץ לקבלת הצעת מחיר מדויקת." },
          { question: "כמה זמן לוקח להחלים?", answer: "ריפוי שטחי 2-3 שבועות. החלמה מלאה 4-6 שבועות עם טיפול נכון." },
          { question: "אתם עושים כיסויים?", answer: "כן! הביאו את הקעקוע הקיים לייעוץ." },
        ],
      },
      admin: {
        staff: {
          title: "צוות אמנים",
          scheduleTitle: "לוח זמנים שבועי",
          commitButton: "שמור",
          enforcementTitle: "אכיפת לוח זמנים",
          enforcementDesc: "מנוע ההזמנות אוכף את לוחות האמנים אוטומטית.",
        },
      },
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Provision
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Provisioning 4 tattoo demo sites");
  console.log("═══════════════════════════════════════════\n");

  for (const d of demos) {
    process.stdout.write(`▸ ${d.businessName} (${d.slug})... `);

    // Check if already exists
    const existing = await db.collection("config").doc(d.slug).get();
    if (existing.exists) {
      console.log("⚠ already exists — updating config only");
      await db.collection("config").doc(d.slug).set(buildConfig(d));
      continue;
    }

    // 1. hub_clients
    const hubRef = db.collection("hub_clients").doc();
    await hubRef.set({
      businessName: d.businessName,
      niche: "tattoo",
      businessMode: d.mode,
      clientId: d.slug,
      status: "demo",
      deployUrl: "",
      domain: "",
      adminEmail: "",
      createdAt: new Date(),
      activationDate: new Date(),
      contact: {
        phone: "",
        email: "",
        address: d.location,
        instagram: d.instagram,
      },
      description: d.description,
      language: "he",
      notes: "Demo para prospecto — sin deploy todavía",
    });

    // 2. clients/{slug}
    await db.collection("clients").doc(d.slug).set({ status: "active" });

    // 3. config/{slug}
    await db.collection("config").doc(d.slug).set(buildConfig(d));

    console.log("✓");
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Done! 4 demos provisioned in Firestore.");
  console.log("  Next steps:");
  console.log("  1. Add logos + images from Instagram");
  console.log("  2. Deploy to Vercel from the dashboard");
  console.log("═══════════════════════════════════════════\n");

  process.exit(0);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
