"use client";

import { useState } from "react";
import { INITIAL_AMOUNT, RECURRING_AMOUNT } from "@/lib/pricing";

const CONTRACT_HE = `חוזה לבניית אתרים – תחזוקה ואחסון

בין: Arzac Studio (להלן: "הספק")
לבין: הלקוח (להלן: "המזמין")

הואיל והספק פיתח תשתית טכנולוגית הכוללת אירוח אתרי אינטרנט (SaaS), מערכת הזמנות ומערכת ניהול לקוחות באמצעות CRM המופעלים באמצעות בינה מלאכותית, אחזקתם ואחסון (להלן: "מערכת תבנית מאסטר")

והואיל והלקוח מבקש לשכור את שירותי הספק על מנת לקבל "אתר אישי" במערכת תבנית המאסטר לצורך חשיפת העסק שלו ברשת האינטרנט (ויסיביליות), לדיגיטציה ולניהול תפעולי של העסק שלו. (להלן: "האתר")

לפיכך הוסכם והותנה בין הצדדים, כדלקמן:

1. השירותים:
• פיתוח "אתר אישי" באמצעות מערכת תבנית מאסטר: בהתאם לתבניות הקיימות אצל הספק.
• נראות: ויסיביליות ברשת האינטרנט.
• מערכת מיקרו CRM וגישה לבינה מלאכותית: גישה ל"לוח ניהול אישי" בתוך מערכת תבנית מאסטר לניהול העסק באמצעות מערכת CRM ועוזר וירטואלי המופעל באמצעות בינה מלאכותית. ומערכת דיוור אוטומטית לשליחת מיילים ללקוחות.
• תחזוקה שוטפת של האתר ותמיכה טכנית של תקלות: שינוי פרטיים דינאמיים כגון, תמונות, מחירים, תיקון טקסטים וצבע, פיקוח טכני, תיקון שגיאות וניהול תשתיות בינה מלאכותית, פתרון תקלות. (הסכם זה אינו כולל שינויים בעיצובים המבניים שנבנו במועד פיתוח האתר, שינויים כאמור יעשו רק על ידי הספק, על פי הסכמה בנפרד להסכם זה ובתוספת מחיר.)
• אחסון לאתר: מבוצע על תשתיות של צד ג' בהתאם להחלטת הספק כפי שינהג מעת לעת.
• דומיין: רכישת דומיין עבור הלקוח וביצוע מעקב ותשלום שנתי.

2. התמורה:
• פיתוח אתר אישי: ₪4,200 - תשלום חד פעמי.
• תחזוקה חודשית: ₪500 יועבר מידי חודש.
• אחסון האתר: עלות שנתית, המחיר משתנה משנה לשנה (כפוף לשינויים אצל צד ג') ישולם תוך 7 ימים מיום מתן הדרישה על ידי הספק.
• דומיין: עלות שנתית, המחיר משתנה משנה לשנה (כפוף לשינויים אצד ג') ישולם תוך 7 ימים מיום מתן הדרישה על ידי הספק.
• אי ביצוע תשלום בזמן תגרור הורדת האתר מהאוויר, האתר יימחק תוך 7 ימים מיום אי ביצוע התשלום, וביטול הסכם זה.

3. זמנים:
זמן המסירה של הגרסה הפונקציונלית של האתר יהיה לאחר ביצוע תשלום ראשוני, ותוך 48 שעות מיום מסירת פרטי העיצוב על ידי הלקוח.

4. זכויות / קניין רוחני ורישוי:
• רישיון שימוש: רישיון השימוש על פי הסכם זה ניתן למזמין כל עוד המזמין משלם עבור השירות ועומד בתנאי ההסכם ועל פי המתואר בו בלבד.
• זכויות היוצרים המסחריות והמוסריות של שורות הקוד קבצי המקור וזכויות הקניין הרוחני על העיצוב שייכים לספק. המודולים שיפותחו במסגרת הקמת האתר הן בבעלות הספק ולמזמין ניתן רישיון לשימוש במסגרת אתר בלבד, ועל פי האמור בהסכם זה ואך ורק בזמן שהסכם זה בתוקף.
• הבעלות על הזכויות קניין הרוחני של הלוגו, המותג והתוכן של האתר שנמסרו לספק על ידי המזמין ישמש אך ורק לצורך הסכם זה ולספק אין בעלות על זכויות קניין רוחני של המזמין או על המידע שלו.
• הבעלות על שם הדומיין שייך למזמין.

5. מדיניות שימוש מקובל:
• חל איסור להשתמש באתר לצורך שליחת דואר ספאם, או שמירת חומרים הנוגדים את החוק או תקנות הציבור.
• חל איסור להעלות תוכן מפר זכויות יוצרים, תוכן פוגעני ותוכן האסור על פי כל דין.
• הפרת סעיף זה מהווה הפרה יסודית אשר תהיה עילה להפסקת השירות על ידי הספק, באופן חד צדדי, ומיידי.

6. הגבלת אחריות:
• תוכן המידע שיועלה לאתר יהיה בשליטה, באחריות ובידיעה בלעדית של המזמין.
• הספק לא יהיה אחראי בכל מובן או אופן לתוכן שיועלה או יוכנס לאתר על ידי המזמין או מי מטעמו.
• הספק אינו מבטיח תוצאות מסחריות, עליית מחירים או תשואה כלכלית כלשהי, לספק אין אחריות על התוצאות של הלקוח.
• הספק אינו אחראי על כשלים, תקלות או נזקים שנגרמים בשל תקלות/רשלנות/נזק שנגרם על ידי צד ג' או כוח עליון.
• בשום מקרה הספק לא אחראי לנזק תוצאתי או נסיבתי כלשהו (ללא יוצא מן הכלל, המקרים של הפסד רווחים, הפסקת פעילות עסקית, אבדת מידע עסקי, או אבדות כספיות אחרות), הקשורים במישרין או בעקיפין לאתר ובכל אופן, ככל שגורם מוסמך יקבע אחריות כאמור, גבול האחריות לעולם לא תעלה על הסכום ששולם על פי הסכם זה.

7. סיום/ביטול הסכם:
• המזמין יכול לבטל הסכם זה עם מתן הודעה מוקדמת של 30 ימים, בכתב.
• הספק רשאי לבטל הסכם זה, ללא התראה במידה והופרה מדיניות השימוש המקובל.
• הספק רשאי לבטל הסכם זה, במידה והמזמין לא שילם את התשלום החודשי, תוך מתן התראה מוקדמת למזמין של 7 ימים ובכתב.
• לאחר ביטול ההסכם האתר ירד מהאינטרנט ויאבד את הויסיביליות ברשת.
• שירות אחסון האתר ושירות התחזוקה יתבטלו בהתאם למועד ביטול ההסכם.
• אין זיכוי בגין תשלום שנתי על אחסון.
• בסיום ההסכם, לפי בקשת הלקוח, קוד המקור של האתר הספציפי (HTML, CSS, JS) יימסר, כך שללקוח תהיה מראה ויזואלית של האתר, וקבצי מערכת ה-CRM שמרכזים את נתוני העסק של הלקוח שנאספו לאורך תקופת השירות, בכל אופן למזמין בשום שלב לא תהיה הגישה לכלים פנימיים או גישה לתשתית המנהל.

8. שיפוט:
מקום השיפוט הבלעדי לכל ענין הנוגע להסכם זה הינו בבתי המשפט המוסמכים באיזור תל אביב ישראל על פי הדין הישראלי.`;

const CONTRACT_EN = `Website Development, Maintenance & Hosting Agreement

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

Whereas the Provider has developed a technological infrastructure that includes website hosting (SaaS), a booking system and a customer management system (CRM) powered by artificial intelligence, their maintenance and hosting (hereinafter: "Master Template System")

And whereas the Client wishes to engage the Provider's services in order to receive a "personal website" in the Master Template System for the purpose of exposing their business on the Internet (visibility), digitization and operational management of their business. (hereinafter: "the Website")

Therefore it has been agreed and stipulated between the parties, as follows:

1. Services:
- Development of a "personal website" using the Master Template System: according to templates available with the Provider.
- Visibility: internet presence.
- Micro CRM system and AI access: access to a "personal management dashboard" within the Master Template System for business management via CRM system and virtual assistant powered by artificial intelligence. And automatic mailing system for sending emails to customers.
- Ongoing website maintenance and technical support: changing dynamic details such as images, prices, text and color corrections, technical monitoring, error fixes and AI infrastructure management, troubleshooting. (This agreement does not include changes to structural designs built at the time of website development; such changes will only be made by the Provider, by separate agreement and at an additional cost.)
- Website hosting: performed on third-party infrastructure at the Provider's discretion as practiced from time to time.
- Domain: purchasing a domain for the Client and tracking and annual payment.

2. Compensation:
- Personal website development: ₪4,200 - one-time payment.
- Monthly maintenance: ₪500 transferred monthly.
- Website hosting: annual cost, price varies year to year (subject to third-party changes) to be paid within 7 days of the Provider's demand.
- Domain: annual cost, price varies year to year (subject to third-party changes) to be paid within 7 days of the Provider's demand.
- Failure to make timely payment will result in the website being taken offline; the website will be deleted within 7 days of non-payment, and this agreement will be terminated.

3. Timeline:
Delivery of the functional version of the website will be after the initial payment, and within 48 hours of the Client providing design details.

4. Rights / Intellectual Property and Licensing:
- License: The license under this agreement is granted to the Client as long as the Client pays for the service and meets the terms of the agreement as described herein only.
- Commercial and moral copyrights of code, source files and intellectual property rights of the design belong to the Provider. Modules developed as part of the website creation are owned by the Provider and the Client is granted a license for use within the website only, as stated in this agreement and only while this agreement is in effect.
- Ownership of intellectual property rights of the logo, brand and content of the website provided to the Provider by the Client shall be used solely for the purpose of this agreement and the Provider has no ownership of the Client's intellectual property rights or information.
- Domain name ownership belongs to the Client.

5. Acceptable Use Policy:
- It is prohibited to use the website for sending spam, or storing materials that violate the law or public regulations.
- It is prohibited to upload copyright-infringing content, offensive content and content prohibited by any law.
- Violation of this clause constitutes a fundamental breach that will be grounds for termination of service by the Provider, unilaterally and immediately.

6. Limitation of Liability:
- Content uploaded to the website will be under the exclusive control, responsibility and knowledge of the Client.
- The Provider will not be responsible in any way for content uploaded or entered to the website by the Client or anyone on their behalf.
- The Provider does not guarantee commercial results, price increases or any economic return; the Provider has no responsibility for the Client's results.
- The Provider is not responsible for failures, malfunctions or damages caused by third-party faults/negligence/damage or force majeure.
- In no case will the Provider be liable for any consequential or incidental damage (without exception, cases of loss of profits, business interruption, loss of business information, or other financial losses), related directly or indirectly to the website and in any case, to the extent a competent authority determines such liability, the limit of liability shall never exceed the amount paid under this agreement.

7. Termination/Cancellation:
- The Client may cancel this agreement with 30 days written notice.
- The Provider may cancel this agreement without notice if the acceptable use policy is violated.
- The Provider may cancel this agreement if the Client has not paid the monthly payment, with 7 days written notice to the Client.
- After cancellation, the website will be removed from the Internet and lose its online visibility.
- Website hosting and maintenance services will be cancelled according to the agreement cancellation date.
- No refund for annual hosting payment.
- Upon termination, at the Client's request, the specific website source code (HTML, CSS, JS) will be delivered, so the Client will have a visual appearance of the website, and CRM system files containing the Client's business data collected during the service period; in any case, the Client will at no stage have access to internal tools or admin infrastructure.

8. Jurisdiction:
The exclusive jurisdiction for any matter related to this agreement shall be in the competent courts in the Tel Aviv area, Israel, under Israeli law.`;

const i18n = {
  he: {
    greeting: "שלום,",
    paymentFor: "תשלום עבור",
    initialLabel: "הקמת אתר",
    recurringLabel: "תחזוקה חודשית",
    oneTime: "תשלום חד פעמי",
    monthly: "חודשי",
    contractTitle: "הסכם שירות",
    expandContract: "קרא את ההסכם המלא",
    collapseContract: "הסתר",
    accept: "קראתי ואני מסכים/ה לתנאי ההסכם",
    pay: "המשך לתשלום",
    processing: "מעבד...",
    contractAccepted: "ההסכם נחתם בהצלחה",
    error: "שגיאה, נסה שוב",
    cardcomPlaceholder: "טופס התשלום יופיע כאן",
    confirmPayment: "אשר תשלום",
    securePayment: "תשלום מאובטח",
    includes: "השירות כולל",
    includesWebsite: "אתר אישי מעוצב",
    includesCRM: "מערכת ניהול לקוחות",
    includesAI: "עוזר וירטואלי AI",
    includesMaintenance: "תחזוקה ותמיכה טכנית",
    includesHosting: "אחסון ודומיין",
  },
  en: {
    greeting: "Hello,",
    paymentFor: "Payment for",
    initialLabel: "Website setup",
    recurringLabel: "Monthly maintenance",
    oneTime: "One-time payment",
    monthly: "Monthly",
    contractTitle: "Service Agreement",
    expandContract: "Read full agreement",
    collapseContract: "Collapse",
    accept: "I have read and accept the terms of service",
    pay: "Continue to payment",
    processing: "Processing...",
    contractAccepted: "Agreement signed successfully",
    error: "An error occurred, please try again",
    cardcomPlaceholder: "Payment form will appear here",
    confirmPayment: "Confirm payment",
    securePayment: "Secure payment",
    includes: "Service includes",
    includesWebsite: "Custom designed website",
    includesCRM: "Customer management system",
    includesAI: "AI virtual assistant",
    includesMaintenance: "Maintenance & technical support",
    includesHosting: "Hosting & domain",
  },
};

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Arzac Studio">
      <rect width="40" height="40" rx="10" fill="oklch(0.52 0.08 192)" />
      <text x="20" y="27" textAnchor="middle" fill="oklch(0.98 0.005 192)" fontFamily="var(--font-display), sans-serif" fontWeight="700" fontSize="18" letterSpacing="-0.5">
        AS
      </text>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="pago-check-icon">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="oklch(0.52 0.08 192)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2s2.5 1.12 2.5 2.5V6M3.5 6h7a1 1 0 011 1v4.5a1 1 0 01-1 1h-7a1 1 0 01-1-1V7a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Props {
  clientId: string;
  clientDocId: string;
  businessName: string;
  isInitial: boolean;
  lang: "he" | "en";
}

export default function PagoClient({ clientId, clientDocId, businessName, isInitial, lang }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [contractExpanded, setContractExpanded] = useState(false);
  const t = i18n[lang];
  const contract = lang === "he" ? CONTRACT_HE : CONTRACT_EN;
  const dir = lang === "he" ? "rtl" : "ltr";
  const amount = isInitial ? INITIAL_AMOUNT : RECURRING_AMOUNT;

  async function handleContinue() {
    setSending(true);
    setError("");
    try {
      const contractRes = await fetch("/api/payments/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientDocId, contractVersion: "1.0" }),
      });
      if (!contractRes.ok) {
        const data = await contractRes.json().catch(() => null);
        throw new Error(data?.error || "Contract failed");
      }

      const paymentRes = await fetch("/api/cardcom/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
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

  const includesList = [
    t.includesWebsite,
    t.includesCRM,
    t.includesAI,
    t.includesMaintenance,
    t.includesHosting,
  ];

  return (
    <div dir={dir} className="pago-root">
      <header className="pago-header">
        <div className="pago-header-inner">
          <LogoMark />
          <span className="pago-logo-text">arzac.studio</span>
        </div>
      </header>

      <main className="pago-main">
        {/* Greeting + Amount */}
        <section className="pago-hero">
          <p className="pago-greeting">{t.greeting}</p>
          <h1 className="pago-business-name">{businessName}</h1>

          <div className="pago-amount-card">
            <div className="pago-amount-meta">
              <span className="pago-amount-label">{isInitial ? t.initialLabel : t.recurringLabel}</span>
              <span className="pago-amount-badge">{isInitial ? t.oneTime : t.monthly}</span>
            </div>
            <div className="pago-amount-value">
              <span className="pago-currency">₪</span>
              <span className="pago-number">{amount.toLocaleString("en-IL")}</span>
            </div>
          </div>
        </section>

        {/* What's included (initial only) */}
        {isInitial && (
          <section className="pago-includes">
            <h3 className="pago-includes-title">{t.includes}</h3>
            <ul className="pago-includes-list">
              {includesList.map((item) => (
                <li key={item} className="pago-includes-item">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contract */}
        <section className="pago-contract">
          <div className="pago-contract-header">
            <h2 className="pago-contract-title">{t.contractTitle}</h2>
            <button
              type="button"
              onClick={() => setContractExpanded(!contractExpanded)}
              className="pago-contract-toggle"
            >
              <span>{contractExpanded ? t.collapseContract : t.expandContract}</span>
              <ChevronIcon expanded={contractExpanded} />
            </button>
          </div>

          <div
            className={`pago-contract-body ${contractExpanded ? "pago-contract-expanded" : ""}`}
            style={{ direction: dir }}
          >
            <div className="pago-contract-text">{contract}</div>
            {!contractExpanded && <div className="pago-contract-fade" />}
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => !sending && setAccepted(!accepted)}
            className={`pago-checkbox-label ${sending ? "pago-checkbox-disabled" : ""}`}
          >
            <span className={`pago-checkbox-custom ${accepted ? "pago-checkbox-checked" : ""}`}>
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="pago-checkbox-text">{t.accept}</span>
          </button>

          {error && <p className="pago-error">{error}</p>}

          <button
            onClick={handleContinue}
            disabled={!accepted || sending}
            className="pago-btn-primary"
          >
            {sending ? (
              <>
                <span className="pago-spinner" />
                <span>{t.processing}</span>
              </>
            ) : (
              <>
                <LockIcon />
                <span>{t.pay}</span>
              </>
            )}
          </button>
        </section>
      </main>

      <footer className="pago-footer">
        <p>&copy; {new Date().getFullYear()} Arzac Studio</p>
      </footer>
    </div>
  );
}
