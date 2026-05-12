"use client";

import { useRef, useState } from "react";
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
• דומיין: עלות שנתית, המחיר משתנה משנה לשנה (כפוף לשינויים אצל צד ג') ישולם תוך 7 ימים מיום מתן הדרישה על ידי הספק.
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
    welcome: "ברוך הבא,",
    contractTitle: "הסכם שירות",
    accept: "קראתי ואני מסכים/ה לתנאי השירות",
    continueToPayment: "המשך לתשלום",
    paymentTitle: "תשלום",
    initialLabel: "תשלום ראשוני - הקמת אתר",
    recurringLabel: "תשלום חודשי - תחזוקה",
    cardcomPlaceholder: "כאן יופיע טופס התשלום של Cardcom",
    confirmPayment: "אשר תשלום",
    processing: "מעבד...",
    contractAccepted: "החוזה נקלט בהצלחה",
    error: "שגיאה, נסה שוב",
  },
  en: {
    welcome: "Welcome,",
    contractTitle: "Service Agreement",
    accept: "I have read and accept the terms of service",
    continueToPayment: "Continue to payment",
    paymentTitle: "Payment",
    initialLabel: "Initial payment - Website setup",
    recurringLabel: "Monthly payment - Maintenance",
    cardcomPlaceholder: "Cardcom payment form will appear here",
    confirmPayment: "Confirm payment",
    processing: "Processing...",
    contractAccepted: "Contract accepted successfully",
    error: "An error occurred, please try again",
  },
};

interface Props {
  clientId: string;
  clientDocId: string;
  businessName: string;
  isInitial: boolean;
  lang: "he" | "en";
}

export default function PagoClient({ clientId, clientDocId, businessName, isInitial, lang }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [contractSent, setContractSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const paymentRef = useRef<HTMLDivElement>(null);
  const t = i18n[lang];
  const contract = lang === "he" ? CONTRACT_HE : CONTRACT_EN;
  const dir = lang === "he" ? "rtl" : "ltr";
  const amount = isInitial ? INITIAL_AMOUNT : RECURRING_AMOUNT;

  async function handleContinue() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/payments/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientDocId,
          contractVersion: "1.0",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed");
      }
      setContractSent(true);
      setTimeout(() => {
        paymentRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch {
      setError(t.error);
    }
    setSending(false);
  }

  return (
    <div dir={dir} className="min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight" style={{ color: "#2a7f8a" }}>
            Arzac Studio
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <p className="text-sm text-gray-500">{t.welcome}</p>
          <h1 className="text-2xl font-bold text-gray-900">{businessName}</h1>
        </div>

        {/* Contract */}
        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t.contractTitle}</h2>
          <div
            className="mb-6 max-h-96 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap"
            style={{ direction: dir }}
          >
            {contract}
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={contractSent}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#2a7f8a]"
            />
            <span className="text-sm text-gray-700">{t.accept}</span>
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}

          {!contractSent && (
            <button
              onClick={handleContinue}
              disabled={!accepted || sending}
              className="mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: accepted && !sending ? "#2a7f8a" : "#94a3b8" }}
            >
              {sending ? t.processing : t.continueToPayment}
            </button>
          )}

          {contractSent && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              {t.contractAccepted}
            </p>
          )}
        </section>

        {/* Payment */}
        <section ref={paymentRef} className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-opacity duration-300 ${contractSent ? "opacity-100" : "pointer-events-none opacity-40"}`}>
          <h2 className="mb-4 text-base font-semibold text-gray-900">{t.paymentTitle}</h2>

          <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              {isInitial ? t.initialLabel : t.recurringLabel}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {"₪"}{amount.toLocaleString()}
            </p>
          </div>

          {/* Cardcom placeholder */}
          <div className="mb-6 flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            <p className="text-sm text-gray-400">{t.cardcomPlaceholder}</p>
          </div>

          <button
            disabled
            className="w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 text-sm font-semibold text-gray-500"
          >
            {t.confirmPayment}
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Arzac Studio
        </p>
      </footer>
    </div>
  );
}
