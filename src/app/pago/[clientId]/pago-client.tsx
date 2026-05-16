"use client";

import { useState } from "react";
import { WEB_CRM_AMOUNT, COMPLETO_AMOUNT, type PlanType } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════════════════════
 * CONTRACTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const CONTRACT_HE = `חוזה לשירותי אתר, CRM וסוכן WhatsApp – תחזוקה ואחסון

בין: Arzac Studio (להלן: "הספק")
לבין: הלקוח (להלן: "המזמין")

הואיל והספק פיתח תשתית טכנולוגית הכוללת אירוח אתרי אינטרנט (SaaS), מערכת הזמנות, מערכת ניהול לקוחות (CRM) ומערכת סוכן WhatsApp המופעלים באמצעות בינה מלאכותית, אחזקתם ואחסון (להלן: "מערכת תבנית מאסטר")

והואיל והלקוח מבקש לשכור את שירותי הספק על מנת לקבל "אתר אישי" במערכת תבנית המאסטר לצורך חשיפת העסק שלו ברשת האינטרנט (ויסיביליות), לדיגיטציה ולניהול תפעולי של העסק שלו. (להלן: "האתר")

לפיכך הוסכם והותנה בין הצדדים, כדלקמן:

1. השירותים:

תוכנית Web+CRM (₪790/חודש):
• פיתוח "אתר אישי" באמצעות מערכת תבנית מאסטר: בהתאם לתבניות הקיימות אצל הספק.
• נראות: ויסיביליות ברשת האינטרנט (SEO).
• מערכת מיקרו CRM עם בינה מלאכותית: גישה ל"לוח ניהול אישי" בתוך מערכת תבנית מאסטר לניהול העסק הכולל ניהול לקוחות, מערכת תורים/הזמנות, ניהול מלאי/סטוק, מדור שאלות נפוצות הניתן לעריכה.
• תמיכה ב-3 שפות (עברית, אנגלית, רוסית).
• תחזוקה שוטפת של האתר ותמיכה טכנית: שינוי פרטים דינמיים כגון תמונות, מחירים, טקסטים, פיקוח טכני, תיקון שגיאות וניהול תשתיות. (הסכם זה אינו כולל שינויים בעיצובים המבניים; שינויים כאמור יעשו רק על ידי הספק בהסכמה נפרדת ובתוספת מחיר.)
• אחסון לאתר: מבוצע על תשתיות של צד ג' בהתאם להחלטת הספק.
• דומיין: רכישת דומיין עבור הלקוח וביצוע מעקב ותשלום שנתי.

תוכנית Completo (₪990/חודש):
• כל מה שכלול בתוכנית Web+CRM.
• סוכן WhatsApp עם בינה מלאכותית 24/7: תשובות אוטומטיות מותאמות אישית, לכידת לידים דרך WhatsApp, קביעת תורים/הזמנות דרך WhatsApp, אינטגרציה מלאה עם מערכת ה-CRM.

2. התמורה:
• תוכנית Web+CRM: ₪790 לחודש, מועבר מדי חודש, החל מיום ההפעלה.
• תוכנית Completo: ₪990 לחודש, מועבר מדי חודש, החל מיום ההפעלה.
• אחסון האתר: עלות שנתית, המחיר משתנה (כפוף לשינויים אצל צד ג') ישולם תוך 7 ימים מיום מתן הדרישה.
• דומיין: עלות שנתית, המחיר משתנה (כפוף לשינויים אצל צד ג') ישולם תוך 7 ימים מיום מתן הדרישה.
• אי ביצוע תשלום בזמן תגרור הורדת האתר מהאוויר, האתר יימחק תוך 7 ימים מיום אי ביצוע התשלום, וביטול הסכם זה.

3. זמנים:
זמן המסירה של הגרסה הפונקציונלית של האתר יהיה לאחר ביצוע התשלום הראשון של המנוי, ותוך 48 שעות מיום מסירת פרטי העיצוב על ידי הלקוח.

4. זכויות / קניין רוחני ורישוי:
• רישיון שימוש: רישיון השימוש על פי הסכם זה ניתן למזמין כל עוד המזמין משלם עבור השירות ועומד בתנאי ההסכם.
• זכויות היוצרים המסחריות והמוסריות של שורות הקוד, קבצי המקור וזכויות הקניין הרוחני על העיצוב שייכים לספק. המודולים שיפותחו במסגרת הקמת האתר הן בבעלות הספק ולמזמין ניתן רישיון לשימוש במסגרת אתר בלבד, ואך ורק בזמן שהסכם זה בתוקף.
• הבעלות על הזכויות קניין הרוחני של הלוגו, המותג והתוכן של האתר שנמסרו לספק על ידי המזמין ישמש אך ורק לצורך הסכם זה ולספק אין בעלות על זכויות קניין רוחני של המזמין.
• הבעלות על שם הדומיין שייך למזמין.

5. מדיניות שימוש מקובל:
• חל איסור להשתמש באתר לצורך שליחת דואר ספאם, או שמירת חומרים הנוגדים את החוק.
• חל איסור להעלות תוכן מפר זכויות יוצרים, תוכן פוגעני ותוכן האסור על פי כל דין.
• הפרת סעיף זה מהווה הפרה יסודית אשר תהיה עילה להפסקת השירות על ידי הספק, באופן חד צדדי ומיידי.

6. הגבלת אחריות:
• תוכן המידע שיועלה לאתר יהיה בשליטה, באחריות ובידיעה בלעדית של המזמין.
• הספק לא יהיה אחראי בכל מובן או אופן לתוכן שיועלה או יוכנס לאתר על ידי המזמין או מי מטעמו.
• הספק אינו מבטיח תוצאות מסחריות, עליית מחירים או תשואה כלכלית כלשהי.
• הספק אינו אחראי על כשלים, תקלות או נזקים שנגרמים בשל תקלות/רשלנות/נזק שנגרם על ידי צד ג' או כוח עליון.
• בשום מקרה הספק לא אחראי לנזק תוצאתי או נסיבתי כלשהו, וגבול האחריות לעולם לא תעלה על הסכום ששולם על פי הסכם זה.

7. סיום/ביטול הסכם:
• המזמין יכול לבטל הסכם זה עם מתן הודעה מוקדמת של 30 ימים, בכתב.
• הספק רשאי לבטל הסכם זה, ללא התראה במידה והופרה מדיניות השימוש המקובל.
• הספק רשאי לבטל הסכם זה, במידה והמזמין לא שילם את התשלום החודשי, תוך מתן התראה מוקדמת של 7 ימים ובכתב.
• לאחר ביטול ההסכם האתר ירד מהאינטרנט.
• אין זיכוי בגין תשלום שנתי על אחסון.
• בסיום ההסכם, לפי בקשת הלקוח, קוד המקור של האתר (HTML, CSS, JS) יימסר וקבצי מערכת ה-CRM שמרכזים את נתוני העסק; בשום שלב למזמין לא תהיה גישה לכלים פנימיים או לתשתית המנהל.

8. שיפוט:
מקום השיפוט הבלעדי לכל ענין הנוגע להסכם זה הינו בבתי המשפט המוסמכים באיזור תל אביב ישראל על פי הדין הישראלי.`;

const CONTRACT_EN = `Website, CRM & WhatsApp Agent Service Agreement

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

Whereas the Provider has developed a technological infrastructure that includes website hosting (SaaS), a booking system, a customer management system (CRM) and a WhatsApp agent system powered by artificial intelligence, their maintenance and hosting (hereinafter: "Master Template System")

And whereas the Client wishes to engage the Provider's services in order to receive a "personal website" in the Master Template System for internet visibility, digitization and operational management of their business. (hereinafter: "the Website")

Therefore it has been agreed between the parties, as follows:

1. Services:

Web+CRM Plan (₪790/month):
- Development of a "personal website" using the Master Template System.
- Visibility: internet presence and SEO.
- Micro CRM system with AI: access to a personal management dashboard including customer management, booking/appointment system, inventory/stock management, editable FAQ section.
- Support for 3 languages (Hebrew, English, Russian).
- Ongoing maintenance and technical support: dynamic content updates (images, prices, text), technical monitoring, bug fixes, infrastructure management. (This agreement does not include structural design changes; such changes require separate agreement at additional cost.)
- Website hosting: on third-party infrastructure at the Provider's discretion.
- Domain: purchase, tracking and annual renewal for the Client.

Completo Plan (₪990/month):
- Everything included in the Web+CRM plan.
- 24/7 AI WhatsApp Agent: personalized automatic responses, WhatsApp lead capture, appointment booking via WhatsApp, full CRM integration.

2. Compensation:
- Web+CRM Plan: ₪790 per month, starting from activation day.
- Completo Plan: ₪990 per month, starting from activation day.
- Website hosting: annual cost (subject to third-party changes), payable within 7 days of demand.
- Domain: annual cost (subject to third-party changes), payable within 7 days of demand.
- Failure to make timely payment will result in the website being taken offline; the website will be deleted within 7 days of non-payment, and this agreement will be terminated.

3. Timeline:
Delivery of the functional version within 48 hours of the Client providing design details, after first payment.

4. Rights / Intellectual Property and Licensing:
- License granted to the Client as long as payment is maintained and agreement terms are met.
- Commercial and moral copyrights of code, source files and design belong to the Provider. All modules are owned by the Provider; the Client receives a use license only while this agreement is in effect.
- Client's logo, brand and content intellectual property remains the Client's and is used solely for this agreement.
- Domain name ownership belongs to the Client.

5. Acceptable Use Policy:
- No spam, illegal materials or content violating the law.
- No copyright-infringing, offensive or prohibited content.
- Violation constitutes fundamental breach allowing immediate unilateral termination.

6. Limitation of Liability:
- Content is under the Client's exclusive control and responsibility.
- The Provider does not guarantee commercial results or economic return.
- The Provider is not responsible for third-party failures or force majeure.
- Liability shall never exceed the total amount paid under this agreement.

7. Termination:
- Client: 30 days written notice.
- Provider: immediate termination for policy violation.
- Provider: 7 days written notice for non-payment.
- After termination, the website goes offline.
- No refund for annual hosting payment.
- Upon termination, at Client's request: website source code (HTML, CSS, JS) and CRM data files delivered. Client never gets access to internal tools or admin infrastructure.

8. Jurisdiction:
Exclusive jurisdiction in Tel Aviv, Israel under Israeli law.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * i18n
 * ═══════════════════════════════════════════════════════════════════════════ */

const i18n = {
  he: {
    greeting: "שלום,",
    choosePlan: "בחר תוכנית",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/חודש",
    popular: "פופולרי",
    contractTitle: "הסכם שירות",
    expandContract: "קרא את ההסכם המלא",
    collapseContract: "הסתר",
    accept: "קראתי ואני מסכים/ה לתנאי ההסכם",
    pay: "המשך לתשלום",
    processing: "מעבד...",
    error: "שגיאה, נסה שוב",
    securePayment: "תשלום מאובטח",
    webCrmFeatures: [
      "אתר אישי מעוצב",
      "CRM עם עוזר AI",
      "מערכת הזמנות אונליין",
      "ניהול מלאי/סטוק",
      "מדור שאלות נפוצות",
      "3 שפות (HE, EN, RU)",
      "דומיין + אחסון כלול",
      "תחזוקה ותמיכה 24/7",
    ],
    completoFeatures: [
      "הכל מתוכנית Web+CRM",
      "סוכן WhatsApp AI 24/7",
      "תשובות אוטומטיות מותאמות",
      "לכידת לידים ב-WhatsApp",
      "תורים/הזמנות ב-WhatsApp",
    ],
  },
  en: {
    greeting: "Hello,",
    choosePlan: "Choose your plan",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/month",
    popular: "Popular",
    contractTitle: "Service Agreement",
    expandContract: "Read full agreement",
    collapseContract: "Collapse",
    accept: "I have read and accept the terms of service",
    pay: "Continue to payment",
    processing: "Processing...",
    error: "An error occurred, please try again",
    securePayment: "Secure payment",
    webCrmFeatures: [
      "Custom designed website",
      "CRM with AI assistant",
      "Online booking system",
      "Inventory/stock management",
      "Editable FAQ section",
      "3 languages (HE, EN, RU)",
      "Domain + hosting included",
      "24/7 maintenance & support",
    ],
    completoFeatures: [
      "Everything in Web+CRM",
      "24/7 AI WhatsApp Agent",
      "Custom automatic responses",
      "WhatsApp lead capture",
      "Appointments via WhatsApp",
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  clientId: string;
  clientDocId: string;
  businessName: string;
  lang: "he" | "en";
  defaultPlan?: PlanType;
  isUpgrade?: boolean;
}

export default function PagoClient({ clientId, clientDocId, businessName, lang, defaultPlan, isUpgrade }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(defaultPlan || "completo");
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contractExpanded, setContractExpanded] = useState(false);
  const t = i18n[lang];
  const contract = lang === "he" ? CONTRACT_HE : CONTRACT_EN;
  const dir = lang === "he" ? "rtl" : "ltr";
  const amount = selectedPlan === "completo" ? COMPLETO_AMOUNT : WEB_CRM_AMOUNT;

  async function handleContinue() {
    setSending(true);
    setError("");
    try {
      const contractRes = await fetch("/api/payments/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientDocId, contractVersion: "2.0", plan: selectedPlan }),
      });
      if (!contractRes.ok) {
        const data = await contractRes.json().catch(() => null);
        throw new Error(data?.error || "Contract failed");
      }

      const paymentRes = await fetch("/api/cardcom/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, plan: selectedPlan }),
      });
      if (!paymentRes.ok) {
        const data = await paymentRes.json().catch(() => null);
        throw new Error(data?.error || "Payment setup failed");
      }
      const { url } = await paymentRes.json();
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("No payment URL received");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    }
    setSending(false);
  }

  return (
    <div dir={dir} className="min-h-screen bg-[var(--l-bg,#fafafa)]">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Arzac Studio" className="h-8 w-8 rounded-md object-cover" />
            <img src="/logo.png" alt="Arzac Studio" className="hidden h-4 object-contain sm:block" />
          </a>
          <div className="flex items-center gap-1.5 text-[0.78rem] text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {t.securePayment}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">{t.greeting}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{businessName}</h1>
        </div>

        {/* Plan Selection */}
        {!isUpgrade && (
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">{t.choosePlan}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Web+CRM */}
              <button
                type="button"
                onClick={() => setSelectedPlan("web_crm")}
                className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                  selectedPlan === "web_crm"
                    ? "border-gray-900 bg-white shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-[0.9rem] font-semibold text-gray-900">{t.planWebCrm}</p>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-gray-900">₪{WEB_CRM_AMOUNT}</span>
                  <span className="text-sm text-gray-500">{t.perMonth}</span>
                </p>
                <ul className="mt-4 space-y-1.5">
                  {t.webCrmFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.8rem] text-gray-600">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "web_crm" && (
                  <div className="absolute -top-px end-4 top-4">
                    <div className="h-5 w-5 rounded-full border-[5px] border-gray-900" />
                  </div>
                )}
              </button>

              {/* Completo */}
              <button
                type="button"
                onClick={() => setSelectedPlan("completo")}
                className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                  selectedPlan === "completo"
                    ? "border-gray-900 bg-white shadow-md"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[0.9rem] font-semibold text-gray-900">{t.planCompleto}</p>
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    {t.popular}
                  </span>
                </div>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-gray-900">₪{COMPLETO_AMOUNT}</span>
                  <span className="text-sm text-gray-500">{t.perMonth}</span>
                </p>
                <ul className="mt-4 space-y-1.5">
                  {t.completoFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.8rem] text-gray-600">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "completo" && (
                  <div className="absolute end-4 top-4">
                    <div className="h-5 w-5 rounded-full border-[5px] border-gray-900" />
                  </div>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Upgrade note */}
        {isUpgrade && (
          <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-[0.88rem] font-medium text-blue-900">
              Upgrade a Completo — ₪{COMPLETO_AMOUNT}/mes
            </p>
            <p className="mt-1 text-[0.8rem] text-blue-700">
              Tu plan se actualizará inmediatamente con el agente WhatsApp IA.
            </p>
          </div>
        )}

        {/* Amount summary */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                {selectedPlan === "completo" ? t.planCompleto : t.planWebCrm}
              </p>
              <p className="text-xs text-gray-400">Monto mensual</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">₪{amount}</p>
          </div>
        </div>

        {/* Contract */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.9rem] font-semibold text-gray-900">{t.contractTitle}</h2>
            <button
              type="button"
              onClick={() => setContractExpanded(!contractExpanded)}
              className="flex items-center gap-1.5 text-[0.8rem] font-medium text-gray-500 transition-colors hover:text-gray-800"
            >
              <span>{contractExpanded ? t.collapseContract : t.expandContract}</span>
              <svg
                width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{ transform: contractExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease" }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div
            className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${
              contractExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-28"
            }`}
            style={{ direction: dir }}
          >
            <div className="whitespace-pre-line text-[0.78rem] leading-relaxed text-gray-600">
              {contract}
            </div>
            {!contractExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" style={{ position: "relative", marginTop: "-4rem" }} />
            )}
          </div>

          {/* Accept checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => !sending && setAccepted(!accepted)}
            className={`mt-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-all ${
              accepted ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                accepted ? "border-green-600 bg-green-600" : "border-gray-300"
              }`}
            >
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-[0.82rem] text-gray-700">{t.accept}</span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-[0.82rem] text-red-600">{error}</p>
          )}

          {/* Pay button */}
          <button
            onClick={handleContinue}
            disabled={!accepted || sending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-4 text-[0.9rem] font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span>{t.pay}</span>
              </>
            )}
          </button>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-[0.75rem] text-gray-400">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}
