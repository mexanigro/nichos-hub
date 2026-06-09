import { type PlanType } from "./pricing";

export type ContractLang = "en" | "es" | "ru" | "he" | "ar";

const CONTRACT_VERSION = "7.0";

/* ═══════════════════════════════════════════════════════════════════════════
 * PLAN DETAILS (shared across all languages)
 * ═══════════════════════════════════════════════════════════════════════════ */

const PLAN_TABLE = {
  solo_web: { price: 480, bookings: null },
  base: { price: 770, bookings: 100 },
  pro: { price: 960, bookings: 300 },
  enterprise: { price: 1270, bookings: "unlimited" },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
 * ENGLISH CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function EN(plan: PlanType): string {
  return `SERVICE AGREEMENT — WEBSITE, CRM & AI AGENTS
Arzac Studio — Subscription Plans

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

WHEREAS the Provider has developed a technological infrastructure including website hosting (SaaS), a CRM system, an AI-powered WhatsApp agent, AI voice calling, and AI-powered tools, maintenance, and storage (the "Master Template System");

AND WHEREAS the Client wishes to subscribe to the Service for online visibility, digitalisation, and business management;

THE PARTIES AGREE AS FOLLOWS:

1. Service Plans

The Provider offers the following subscription tiers. All plans include zero setup fee.

1.0. Solo Web Plan — ₪480/month
  (a) Custom website using the Master Template System, including landing page, services, gallery, contact page, and AI-powered website chatbot.
  (b) Online visibility: presence on the internet, domain purchase and annual renewal.
  (c) Email notifications via Gmail: automated notifications to the business owner and to customers/leads. Optionally, email notifications to staff members.
  (d) Ongoing maintenance and technical support: content updates, bug fixes.
  (e) Website hosting on third-party infrastructure.

  This plan does NOT include: CRM dashboard access, WhatsApp agent, WhatsApp notifications, AI voice calls, or booking management system.

1.1. Base Plan — ₪770/month
  (a) Custom website using the Master Template System.
  (b) Online visibility: presence on the internet, domain purchase and annual renewal.
  (c) Micro-CRM with AI access: management dashboard, AI virtual assistant, and automated email marketing.
  (d) AI-Powered WhatsApp Agent: automated bot integrated with the Client's business. Responds to messages, manages bookings/cancellations, and answers questions based on the Client's data. Operates 24/7.
  (e) Up to 100 bookings per month.
  (f) Ongoing maintenance and technical support: content updates, bug fixes, AI infrastructure management.
  (g) Website hosting on third-party infrastructure.

1.2. Pro Plan — ₪960/month
  Everything in the Base Plan, plus:
  (a) AI Voice Calls: inbound and outbound calls using cloned voice technology, integrated with the booking calendar. The Client authorises the Provider to generate and use a synthetic voice based on samples provided by the Client.
  (b) Up to 300 bookings per month.

1.3. Enterprise Plan — ₪1,270/month
  Everything in the Pro Plan, plus:
  (a) Unlimited bookings per month.
  (b) Unlimited AI voice calls.
  (c) Priority support: response within 2 business hours during business days.

2. Automatic Tier Upgrade

2.1. Sections 2.2 through 2.5 apply only to the Base, Pro, and Enterprise plans. The Solo Web plan is not subject to automatic tier upgrades.
2.2. If the Client reaches the booking limit of the current plan during a billing cycle, the system will automatically upgrade the Client to the next available tier starting from the following billing cycle.
2.3. The Client will be notified of the upgrade via WhatsApp and/or email within 24 hours.
2.4. The new tier pricing applies from the next billing date.
2.5. By signing this agreement, the Client expressly consents to automatic tier upgrades and the corresponding price adjustments as described above.
2.6. If the Client wishes to revert to a lower tier, they may request a downgrade with 30 days' written notice, effective at the next billing cycle, provided their usage falls within the lower tier limits.

3. Pricing & Payment

3.1. Subscription fees per plan:
  - Solo Web: ₪480/month
  - Base: ₪770/month
  - Pro: ₪960/month
  - Enterprise: ₪1,270/month
3.2. Setup fee: ₪0 (zero). No setup or onboarding charges.
3.3. Payments are processed monthly via Cardcom, Israel's payment processor. The Provider never stores the Client's card details.
3.4. Annual hosting fee: variable amount per year. May change annually subject to third-party costs. Payable within 7 days of the Provider's demand.
3.5. Domain fee: variable amount per year. May change annually. Payable within 7 days of the Provider's demand.
3.6. Late payment will result in the website and all AI agents being suspended. Permanent deletion occurs 7 days after the missed payment and this agreement is terminated.
3.7. No refunds or credits are issued for annual hosting or domain fees upon early termination.

4. Delivery Timeline

4.1. A functional website is delivered within 48 hours of receiving the Client's design materials. The WhatsApp agent is activated within 5 business days of receiving business information and WhatsApp account access.
4.2. AI voice calls (Pro/Enterprise) are activated within 5 business days of receiving voice samples and calendar configuration.

5. Intellectual Property & Licensing

5.1. The Client receives a non-exclusive licence for the duration of this agreement.
5.2. Source code, PSD files, and all IP rights to the website design remain the sole property of the Provider.
5.3. Logos, brand assets, and content provided by the Client remain the Client's exclusive IP and are used by the Provider solely for this agreement.
5.4. The domain name is owned by the Client.
5.5. WhatsApp agent configuration data (responses and business information) entered by the Client belongs to the Client and will be provided upon request at termination.
5.6. Voice samples provided by the Client remain the Client's property. The Provider may retain synthetic voice models only for the duration of this agreement.

6. Acceptable Use Policy

6.1. The website and AI agents may not be used to send spam or store illegal material.
6.2. Uploading or configuring offensive, misleading, or legally prohibited content is strictly prohibited.
6.3. AI voice calls may not be used for unsolicited cold calling, harassment, or deceptive practices.
6.4. Breach of this section constitutes a material breach entitling the Provider to terminate services immediately and unilaterally.

7. Limitation of Liability

7.1. The Client bears sole responsibility for all content on the website and all information configured in the AI agents.
7.2. The Provider is not liable for damages arising from AI responses based on incorrect or incomplete data provided by the Client.
7.3. The Provider does not guarantee any commercial results, sales, or financial returns.
7.4. The Provider is not liable for failures caused by third-party platforms (including WhatsApp/Meta) or force majeure.
7.5. In no event shall the Provider's liability exceed the total amount paid under this agreement.

8. Termination

8.1. The Client may cancel with 30 days' written notice.
8.2. The Provider may terminate immediately for breach of the Acceptable Use Policy.
8.3. The Provider may terminate for non-payment after 7 days' written notice.
8.4. Upon termination the website and all AI agents will be taken offline.
8.5. No annual fee refunds will be issued.
8.6. Upon request, the Provider will deliver the website source code (HTML/CSS/JS), the Client's CRM data, agent configuration, and voice call logs. No access to internal infrastructure will be granted.

9. Governing Law & Jurisdiction

This agreement is governed by Israeli law. Exclusive jurisdiction: competent courts of the Tel Aviv district.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * HEBREW CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function HE(plan: PlanType): string {
  return `הסכם מתן שירות בניית אתרים, תחזוקה, אירוח וסוכני בינה מלאכותית

שנערך ונחתם ביום _____ לחודש _____ שנת _____

בין: _____ (ח"פ/ע.מ: _____), מרח' _____, טלפון: _____, דוא"ל: _____ (להלן: "החברה")

לבין: חברת _____ (ח"פ: _____), ו/או _____ ת.ז: _____, מרח' _____, טלפון: _____, דוא"ל: _____ (להלן: "המזמין")

הואיל והחברה פיתחה תשתית טכנולוגית הכוללת אירוח אתרי אינטרנט (SaaS), מערכת ניהול לקוחות (CRM), סוכן WhatsApp אוטומטי מבוסס בינה מלאכותית, מערכת שיחות קוליות עם בינה מלאכותית וכלים נלווים (להלן: "מערכת תבנית מאסטר");

והואיל והמזמין מעוניין לרכוש מהחברה שירות לצורך נוכחות באינטרנט, דיגיטציה וניהול תפעולי של עסקו;

לפיכך הוסכם, הותנה והוצהר בין הצדדים כדלקמן:

השירותים

1. פיתוח "אתר אישי" באמצעות מערכת תבנית מאסטר — החברה תפתח עבור המזמין אתר אינטרנט מותאם אישית על בסיס מערכת תבנית מאסטר, בהתאם לניש העסקי של המזמין ולחומרי העיצוב שיסופקו על ידו.

2. נראות באינטרנט — החברה תעניק למזמין נוכחות דיגיטלית ברשת האינטרנט, לרבות רכישת דומיין וחידושו השנתי.

3. מערכת מיקרו CRM ומנוע AI — לוח ניהול דיגיטלי, עוזר וירטואלי מבוסס בינה מלאכותית ודיוור אלקטרוני אוטומטי (תוכניות Base ומעלה בלבד).

4. סוכן WhatsApp מבוסס בינה מלאכותית — בוט אוטומטי המשולב בעסק המזמין באמצעות פלטפורמת WhatsApp. הסוכן מגיב להודעות, מנהל קביעת תורים וביטולם, ועונה על שאלות על בסיס המידע העסקי של המזמין. הסוכן פעיל 24 שעות ביממה, 7 ימים בשבוע (תוכניות Base ומעלה בלבד).

5. שיחות קוליות עם בינה מלאכותית (תוכניות Pro ו-Enterprise בלבד) — שיחות נכנסות ויוצאות באמצעות טכנולוגיית שכפול קול, המשולבות עם יומן התורים של המזמין. המזמין מאשר בזאת לחברה ליצור ולהשתמש בקול סינתטי על בסיס דגימות קול שיסופקו על ידי המזמין.

6. תחזוקה שוטפת — עדכוני תוכן, תיקון תקלות, תמיכה טכנית וניהול תשתיות הבינה המלאכותית.

7. אחסון לאתר — אחסון האתר וסוכני הבינה המלאכותית על גבי תשתיות צד שלישי.

8. דומיין — רכישת שם מתחם (דומיין) עבור המזמין וחידושו השנתי.

8א. צ׳אטבוט AI באתר — ווידג׳ט צ׳אט מבוסס בינה מלאכותית המוטמע באתר האינטרנט של המזמין (כלול בכל התוכניות).

8ב. התראות דוא"ל — הודעות אוטומטיות באמצעות Gmail לבעל העסק וללקוחות/לידים. לפי בקשת המזמין, גם לאנשי צוות (כלול בכל התוכניות).

תוכניות שירות

החברה מציעה את תוכניות המנוי הבאות. כל התוכניות כוללות אפס דמי הקמה.

8ג. תוכנית Solo Web — ₪480 לחודש: כוללת את השירותים המפורטים בסעיפים 1, 2, 6, 7, 8, 8א ו-8ב לעיל. תוכנית זו אינה כוללת: גישה ללוח ניהול CRM, סוכן WhatsApp, התראות WhatsApp, שיחות קוליות עם בינה מלאכותית או מערכת ניהול תורים.

9. תוכנית Base — ₪770 לחודש: כוללת את השירותים המפורטים בסעיפים 1 עד 4 ו-6 עד 8ב לעיל, עם מכסה של עד 100 תורים בחודש.

10. תוכנית Pro — ₪960 לחודש: כוללת את כל הכלול בתוכנית Base, בנוסף לשירות שיחות קוליות עם בינה מלאכותית כמפורט בסעיף 5, עם מכסה של עד 300 תורים בחודש.

11. תוכנית Enterprise — ₪1,270 לחודש: כוללת את כל הכלול בתוכנית Pro, עם תורים ללא הגבלה, שיחות קוליות עם בינה מלאכותית ללא הגבלה ותמיכה בעדיפות — מענה תוך 2 שעות עסקיות בימי עבודה.

התמורה

12. דמי הקמה: ₪0 (אפס). אין כל חיוב בגין הקמת האתר, הגדרת סוכני הבינה המלאכותית או הצטרפות לשירות.

13. דמי מנוי חודשיים בהתאם לתוכנית הנבחרת כמפורט בסעיפים 8ג עד 11, ישולמו מדי חודש באמצעות מערכת הסליקה Cardcom. החברה אינה שומרת פרטי כרטיס אשראי של המזמין.

14. אחסון אתר: עלות שנתית משתנה. העלות עשויה להשתנות בהתאם לעלויות צד שלישי. ישולם תוך 7 ימים מדרישת החברה.

15. דומיין: עלות שנתית משתנה. עשויה להשתנות בהתאם לתנאי ספקי שמות המתחם. ישולם תוך 7 ימים מדרישת החברה.

16. לא שולמה התמורה במועדה, יושבת האתר וכל סוכני הבינה המלאכותית. אם לא שולמה התמורה תוך 7 ימים ממועד התשלום, יימחק האתר לצמיתות ויבוטל הסכם זה.

17. החברה לא תעניק זיכוי בגין תשלומים שנתיים ששולמו (אחסון ודומיין) אם ההסכם מבוטל לפני תום השנה.

שדרוג אוטומטי

17א. סעיפים 18 עד 21 חלים על תוכניות Base, Pro ו-Enterprise בלבד. תוכנית Solo Web אינה כפופה לשדרוג אוטומטי.

18. אם המזמין יגיע למכסת התורים החודשית של תוכניתו הנוכחית במהלך תקופת חיוב, המערכת תשדרג אוטומטית את תוכנית המזמין לתוכנית הבאה הזמינה, מתחילת תקופת החיוב הבאה.

19. הודעה על השדרוג תישלח למזמין באמצעות WhatsApp ו/או דואר אלקטרוני תוך 24 שעות ממועד ההחלטה על השדרוג.

20. תמחור התוכנית החדשה יחול מתאריך החיוב הבא.

21. בחתימתו על הסכם זה, המזמין מסכים במפורש ובאופן בלתי חוזר לשדרוגים אוטומטיים ולתמחור המתעדכן בהתאם, כמפורט בסעיפים 18 עד 20.

22. אם המזמין מעוניין לחזור לתוכנית ברמה נמוכה יותר, עליו להגיש בקשה בכתב בהודעה מוקדמת של 30 יום, אשר תיכנס לתוקף בתחילת תקופת החיוב הבאה, ובתנאי שהשימוש בפועל תואם את מגבלות התוכנית הנמוכה.

זמנים

23. אתר אינטרנט פונקציונלי יימסר תוך 48 שעות ממועד קבלת חומרי העיצוב מהמזמין.

24. סוכן ה-WhatsApp יופעל תוך 5 ימי עסקים ממועד קבלת המידע העסקי וגישה לחשבון ה-WhatsApp של המזמין.

25. שיחות קוליות עם בינה מלאכותית (תוכניות Pro ו-Enterprise) יופעלו תוך 5 ימי עסקים ממועד קבלת דגימות הקול ותצורת יומן התורים.

זכויות / קניין רוחני ורישוי

26. המזמין יקבל רישיון שימוש לא בלעדי, שאינו ניתן להעברה, אך ורק לתקופת ההסכם.

27. קוד המקור (PSD) וכל זכויות הקניין הרוחני על עיצוב האתר הם ויישארו קניינה הבלעדי של החברה. המזמין מקבל רישיון שימוש באתר בלבד.

28. לוגו, סימן מסחרי וכל תוכן שסיפק המזמין לחברה הם קניינו הבלעדי של המזמין. החברה תשתמש בהם אך ורק לצורך הסכם זה.

29. שם המתחם (דומיין) הוא בבעלות המזמין.

30. נתוני תצורת סוכן ה-WhatsApp (תגובות ומידע עסקי שהוזנו על ידי המזמין) שייכים למזמין ויועברו לבקשתו עם סיום ההסכם.

31. דגימות קול שסיפק המזמין נשארות קניינו הבלעדי. החברה רשאית לשמור את מודלי הקול הסינתטיים שנוצרו על בסיסן אך ורק לתקופת ההסכם. עם סיום ההסכם, המודלים הסינתטיים יימחקו.

מדיניות שימוש מקובל

32. אין להשתמש באתר ובסוכני הבינה המלאכותית לשליחת דואר זבל (ספאם) או לאחסון חומרים בלתי חוקיים.

33. אין להעלות, לפרסם או להגדיר בסוכני הבינה המלאכותית תוכן הפוגע בזכויות יוצרים של צד שלישי.

34. אין להשתמש בשיחות קוליות עם בינה מלאכותית לצורך שיחות קרות לא מבוקשות (cold calling), הטרדה, או פרקטיקות מטעות או הונאה.

35. הפרת מדיניות שימוש מקובל מהווה הפרה יסודית של הסכם זה, המקנה לחברה את הזכות לסיים את ההסכם לאלתר ובאופן חד-צדדי, ללא כל הודעה מוקדמת.

הגבלת אחריות

36. כל תוכן המועלה לאתר ולסוכני הבינה המלאכותית הוא באחריותו הבלעדית של המזמין.

37. החברה אינה נושאת באחריות לכל תוכן שהועלה לאתר או הוגדר בסוכני הבינה המלאכותית על ידי המזמין או מי מטעמו, לרבות תשובות שהפיקו מנועי הבינה המלאכותית על בסיס מידע שגוי, חלקי או מטעה שסופק על ידי המזמין.

38. החברה אינה מתחייבת לתוצאות מסחריות, מכירות, הכנסות או כל תשואה כלכלית אחרת.

39. החברה אינה אחראית לכשלים, תקלות או הפסקות שירות הנובעים מפלטפורמות צד שלישי (לרבות WhatsApp, Meta, ספקי אחסון וכיוצא בזה) או מאירועי כוח עליון.

40. בכל מקרה, סך אחריותה הכוללת של החברה על פי הסכם זה לא תעלה על הסכום הכולל ששולם בפועל על ידי המזמין לחברה במסגרת הסכם זה.

סיום / ביטול הסכם

41. המזמין רשאי לבטל את ההסכם בהודעה מוקדמת בכתב של 30 יום.

42. החברה רשאית לבטל את ההסכם לאלתר ובאופן חד-צדדי במקרה של הפרת מדיניות השימוש המקובל על ידי המזמין, ללא כל הודעה מוקדמת.

43. החברה רשאית לבטל את ההסכם בגין אי-תשלום, בהודעה מוקדמת בכתב של 7 ימים.

44. עם סיום ההסכם, מכל סיבה שהיא, האתר וכל סוכני הבינה המלאכותית יורדו מהאוויר, והמזמין יאבד את הנראות באינטרנט.

45. שירותי אחסון ותחזוקה יבוטלו בהתאם למועד סיום ההסכם.

46. לא יינתן זיכוי בגין תשלום שנתי לאחסון או דומיין ששולם מראש.

47. עם סיום ההסכם, לבקשת המזמין בכתב: יועברו קוד המקור של האתר (HTML, CSS, JS), נתוני ה-CRM שנאספו במהלך תקופת השירות, נתוני תצורת סוכן ה-WhatsApp ויומני שיחות קוליות. לא תינתן גישה לכלים פנימיים של החברה, למערכת תבנית מאסטר או לתשתית הפנימית.

שיפוט

הסכם זה כפוף לדין הישראלי. סמכות השיפוט הבלעדית מוקנית לבתי המשפט המוסמכים במחוז תל אביב.

ולראיה באו הצדדים על החתום:

הספק: _____________________
המזמין: _____________________
תאריך: _____________________`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * RUSSIAN CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function RU(plan: PlanType): string {
  return `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ — САЙТ, CRM И ИИ-АГЕНТЫ
Arzac Studio — Тарифные планы

Между: Arzac Studio (далее — «Исполнитель»)
И: Заказчик (далее — «Заказчик»)

Принимая во внимание, что Исполнитель разработал технологическую инфраструктуру, включая хостинг сайтов (SaaS), CRM, АИ-агента WhatsApp, голосовые вызовы с ИИ и инструменты на базе ИИ (далее — «Система Мастер-Шаблона»);

И принимая во внимание, что Заказчик желает подключиться к Сервису;

Стороны договорились о нижеследующем:

1. Тарифные планы

Исполнитель предлагает следующие уровни подписки. Все планы без платы за подключение.

1.0. Plan Solo Web — ₪480/мес
  (а) Персональный сайт на основе Мастер-Шаблона, включая лендинг, услуги, галерею, контакты и ИИ-чатбот на сайте.
  (б) Интернет-присутствие: видимость в сети, покупка и ежегодное продление домена.
  (в) Email-уведомления через Gmail: автоматические уведомления владельцу бизнеса и клиентам/лидам. По желанию — уведомления сотрудникам.
  (г) Техническое обслуживание и поддержка: обновление контента, исправление ошибок.
  (д) Хостинг на сторонней инфраструктуре.

  Данный план НЕ включает: доступ к CRM-панели, WhatsApp-агента, WhatsApp-уведомления, голосовые звонки с ИИ или систему управления записями.

1.1. Plan Base — ₪770/мес
  (а) Персональный сайт на основе Мастер-Шаблона.
  (б) Интернет-присутствие: видимость в сети, покупка и ежегодное продление домена.
  (в) Микро-CRM с ИИ: панель управления, виртуальный ИИ-ассистент и автоматическая рассылка.
  (г) ИИ-агент WhatsApp: автоматизированный бот, интегрированный в бизнес. Отвечает на сообщения, управляет записью/отменой, отвечает на вопросы. Работает 24/7.
  (д) До 100 записей в месяц.
  (е) Техническое обслуживание и поддержка: обновление контента, исправление ошибок, управление ИИ-инфраструктурой.
  (ж) Хостинг на сторонней инфраструктуре.

1.2. Plan Pro — ₪960/мес
  Всё из плана Base, плюс:
  (а) Голосовые вызовы с ИИ: входящие и исходящие звонки с технологией клонирования голоса, интегрированные с календарём записей. Заказчик разрешает создание синтетического голоса на основе предоставленных образцов.
  (б) До 300 записей в месяц.

1.3. Plan Enterprise — ₪1 270/мес
  Всё из плана Pro, плюс:
  (а) Неограниченное количество записей.
  (б) Неограниченные голосовые вызовы с ИИ.
  (в) Приоритетная поддержка: ответ в течение 2 рабочих часов в рабочие дни.

2. Автоматическое повышение уровня

2.0. Пункты 2.1–2.4 применяются только к планам Base, Pro и Enterprise. План Solo Web не подлежит автоматическому повышению.
2.1. Если Заказчик достигнет лимита записей текущего плана в течение расчётного периода, система автоматически переведёт его на следующий уровень с начала следующего расчётного периода.
2.2. Уведомление об изменении направляется через WhatsApp и/или email в течение 24 часов.
2.3. Стоимость нового уровня применяется с даты следующего платежа.
2.4. Подписывая настоящий договор, Заказчик выражает согласие на автоматическое повышение уровня и соответствующее изменение стоимости.
2.5. Для перехода на более низкий уровень Заказчик может запросить понижение с уведомлением за 30 дней, при условии что использование соответствует лимитам более низкого уровня.

3. Стоимость и порядок оплаты

3.1. Абонентская плата по планам:
  - Solo Web: ₪480/мес
  - Base: ₪770/мес
  - Pro: ₪960/мес
  - Enterprise: ₪1 270/мес
3.2. Плата за подключение: ₪0 (ноль). Без платы за настройку или подключение.
3.3. Платежи обрабатываются ежемесячно через Cardcom. Исполнитель не хранит данные карт.
3.4. Хостинг: переменная сумма в год. Может изменяться. Оплата в течение 7 дней с момента запроса.
3.5. Домен: переменная сумма в год. Оплата в течение 7 дней с момента запроса.
3.6. Просрочка оплаты повлечёт остановку сайта и всех ИИ-агентов. Удаление через 7 дней, расторжение договора.
3.7. Возврат ежегодных платежей не производится.

4. Сроки исполнения

4.1. Сайт передаётся в течение 48 часов после получения дизайн-материалов. Агент WhatsApp активируется в течение 5 рабочих дней.
4.2. Голосовые вызовы с ИИ (Pro/Enterprise) активируются в течение 5 рабочих дней после предоставления образцов голоса и настройки календаря.

5. Интеллектуальная собственность и лицензирование

5.1. Неисключительная лицензия на срок действия договора.
5.2. Исходный код, PSD-файлы и права на дизайн — собственность Исполнителя.
5.3. Логотип, бренд и контент Заказчика — его исключительная собственность.
5.4. Доменное имя принадлежит Заказчику.
5.5. Конфигурация агента WhatsApp принадлежит Заказчику и передаётся по запросу.
5.6. Образцы голоса остаются собственностью Заказчика. Исполнитель хранит синтетические модели только на период действия договора.

6. Политика допустимого использования

6.1. Запрещается использовать сайт и ИИ-агентов для спама или хранения незаконных материалов.
6.2. Запрещается размещать оскорбительный, вводящий в заблуждение или противоправный контент.
6.3. Запрещается использовать голосовые вызовы для нежелательных холодных звонков, преследования или обмана.
6.4. Нарушение даёт Исполнителю право немедленного одностороннего расторжения.

7. Ограничение ответственности

7.1. Заказчик несёт исключительную ответственность за контент и данные в ИИ-агентах.
7.2. Исполнитель не несёт ответственности за некорректные ответы ИИ при неточных данных.
7.3. Коммерческие результаты не гарантируются.
7.4. Исполнитель не отвечает за сбои сторонних платформ или форс-мажор.
7.5. Ответственность Исполнителя не превышает сумму, уплаченную по договору.

8. Расторжение договора

8.1. Заказчик вправе расторгнуть с уведомлением за 30 дней.
8.2. Исполнитель вправе расторгнуть немедленно при нарушении политики использования.
8.3. Исполнитель вправе расторгнуть при неоплате после 7-дневного предупреждения.
8.4. После расторжения сайт и все ИИ-агенты деактивируются.
8.5. Возврат ежегодных платежей не производится.
8.6. По запросу передаются исходный код, данные CRM, конфигурация агента и журналы голосовых вызовов. Доступ к инфраструктуре не предоставляется.

9. Применимое право и юрисдикция

Договор регулируется законодательством Израиля. Исключительная юрисдикция: суды округа Тель-Авива.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SPANISH CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function ES(plan: PlanType): string {
  return `ACUERDO DE SERVICIOS — SITIO WEB, CRM Y AGENTES IA
Arzac Studio — Planes de Suscripcion

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnologica que incluye hosting de sitios web (SaaS), un sistema CRM, un agente de WhatsApp impulsado por IA, llamadas de voz con IA y herramientas con inteligencia artificial, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Servicio para visibilidad en internet, digitalizacion y gestion operativa de su negocio;

LAS PARTES ACUERDAN LO SIGUIENTE:

1. Planes de Servicio

El Proveedor ofrece los siguientes niveles de suscripcion. Todos los planes incluyen cero costo de setup.

1.0. Plan Solo Web — ₪480/mes
  (a) Sitio web personalizado usando el Sistema de Plantilla Maestra, incluyendo landing, servicios, galeria, contacto y chatbot AI integrado en el sitio.
  (b) Visibilidad online: presencia en internet, compra de dominio y renovacion anual.
  (c) Notificaciones por email via Gmail: notificaciones automaticas al dueño del negocio y a clientes/leads. Opcionalmente, notificaciones por email al staff.
  (d) Mantenimiento continuo y soporte tecnico: actualizaciones de contenido, correccion de errores.
  (e) Hosting en infraestructura de terceros.

  Este plan NO incluye: acceso al dashboard CRM, agente WhatsApp, notificaciones por WhatsApp, llamadas de voz con IA ni sistema de gestion de turnos.

1.1. Plan Base — ₪770/mes
  (a) Sitio web personalizado usando el Sistema de Plantilla Maestra.
  (b) Visibilidad online: presencia en internet, compra de dominio y renovacion anual.
  (c) Micro-CRM con acceso a IA: panel de gestion, asistente virtual con IA y email marketing automatizado.
  (d) Agente WhatsApp con IA: bot automatizado integrado con el negocio. Responde mensajes, gestiona reservas/cancelaciones y responde preguntas basandose en los datos del Cliente. Opera 24/7.
  (e) Hasta 100 reservas por mes.
  (f) Mantenimiento continuo y soporte tecnico: actualizaciones de contenido, correccion de errores, gestion de infraestructura IA.
  (g) Hosting en infraestructura de terceros.

1.2. Plan Pro — ₪960/mes
  Todo lo incluido en el Plan Base, mas:
  (a) Llamadas de voz con IA: llamadas entrantes y salientes con tecnologia de voz clonada, integradas con el calendario de reservas. El Cliente autoriza al Proveedor a generar y utilizar una voz sintetica basada en muestras proporcionadas.
  (b) Hasta 300 reservas por mes.

1.3. Plan Enterprise — ₪1.270/mes
  Todo lo incluido en el Plan Pro, mas:
  (a) Reservas ilimitadas por mes.
  (b) Llamadas de voz con IA ilimitadas.
  (c) Soporte prioritario: respuesta en 2 horas habiles durante dias laborables.

2. Upgrade Automatico de Nivel

2.0. Las secciones 2.1 a 2.4 aplican unicamente a los planes Base, Pro y Enterprise. El plan Solo Web no esta sujeto a upgrade automatico.
2.1. Si el Cliente alcanza el limite de reservas del plan actual durante un ciclo de facturacion, el sistema upgradeara automaticamente al siguiente nivel desde el proximo ciclo de facturacion.
2.2. El Cliente sera notificado del upgrade via WhatsApp y/o email dentro de las 24 horas.
2.3. El precio del nuevo nivel aplica desde la proxima fecha de facturacion.
2.4. Al firmar este acuerdo, el Cliente consiente expresamente a los upgrades automaticos de nivel y los ajustes de precio correspondientes descritos anteriormente.
2.5. Si el Cliente desea volver a un nivel inferior, puede solicitar un downgrade con 30 dias de aviso por escrito, efectivo en el proximo ciclo, siempre que su uso se encuentre dentro de los limites del nivel inferior.

3. Precio y Pago

3.1. Cuotas de suscripcion por plan:
  - Solo Web: ₪480/mes
  - Base: ₪770/mes
  - Pro: ₪960/mes
  - Enterprise: ₪1.270/mes
3.2. Costo de setup: ₪0 (cero). Sin cargos de alta ni onboarding.
3.3. Los pagos se procesan mensualmente via Cardcom, procesador de pagos israelí. El Proveedor nunca almacena los datos de tarjeta del Cliente.
3.4. Hosting anual: monto variable por ano. Puede cambiar segun costos de terceros. Pagadero dentro de 7 dias desde la solicitud.
3.5. Dominio: monto variable por ano. Pagadero dentro de 7 dias desde la solicitud.
3.6. La falta de pago resultara en la suspension del sitio web y todos los agentes IA. Eliminacion permanente 7 dias despues del impago y rescision del acuerdo.
3.7. No se emiten reembolsos por tarifas anuales de hosting o dominio.

4. Plazos de Entrega

4.1. Un sitio web funcional se entrega dentro de las 48 horas posteriores a la recepcion de los materiales de diseno. El agente WhatsApp se activa dentro de 5 dias habiles.
4.2. Las llamadas de voz con IA (Pro/Enterprise) se activan dentro de 5 dias habiles tras recibir las muestras de voz y la configuracion del calendario.

5. Propiedad Intelectual y Licencias

5.1. El Cliente recibe una licencia no exclusiva por la duracion de este acuerdo.
5.2. El codigo fuente, archivos PSD y todos los derechos de PI sobre el diseno del sitio web son propiedad exclusiva del Proveedor.
5.3. Logos, activos de marca y contenido del Cliente son su PI exclusiva, utilizados unicamente para este acuerdo.
5.4. El nombre de dominio es propiedad del Cliente.
5.5. Los datos de configuracion del agente WhatsApp pertenecen al Cliente y seran entregados a solicitud al momento de la rescision.
5.6. Las muestras de voz del Cliente son su propiedad. El Proveedor puede retener modelos de voz sintetica unicamente durante la vigencia del acuerdo.

6. Politica de Uso Aceptable

6.1. El sitio web y los agentes IA no pueden ser utilizados para enviar spam o almacenar material ilegal.
6.2. Esta estrictamente prohibido subir contenido ofensivo, enganoso o legalmente prohibido.
6.3. Las llamadas de voz con IA no pueden usarse para llamadas en frio no solicitadas, acoso o practicas enganosas.
6.4. La violacion de esta seccion constituye un incumplimiento material que otorga al Proveedor el derecho de rescindir de forma inmediata y unilateral.

7. Limitacion de Responsabilidad

7.1. El Cliente asume responsabilidad exclusiva por todo el contenido y datos en los agentes IA.
7.2. El Proveedor no es responsable por danos derivados de respuestas IA basadas en datos incorrectos.
7.3. El Proveedor no garantiza resultados comerciales, ventas ni retornos financieros.
7.4. El Proveedor no es responsable por fallas de plataformas de terceros o fuerza mayor.
7.5. En ningun caso la responsabilidad del Proveedor excedera el monto total pagado bajo este acuerdo.

8. Rescision

8.1. El Cliente puede cancelar con 30 dias de aviso por escrito.
8.2. El Proveedor puede rescindir inmediatamente por violacion de la Politica de Uso Aceptable.
8.3. El Proveedor puede rescindir por falta de pago con 7 dias de aviso por escrito.
8.4. Tras la rescision, el sitio web y todos los agentes IA seran dados de baja.
8.5. No se emitiran reembolsos por tarifas anuales.
8.6. A solicitud, el Proveedor entregara el codigo fuente (HTML/CSS/JS), los datos del CRM, la configuracion del agente y los registros de llamadas de voz. No se otorgara acceso a la infraestructura interna.

9. Ley Aplicable y Jurisdiccion

Este acuerdo se rige por la ley israeli. Jurisdiccion exclusiva: tribunales competentes del distrito de Tel Aviv.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ARABIC CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function AR(plan: PlanType): string {
  return `اتفاقية تقديم خدمات — موقع إلكتروني، CRM ووكلاء ذكاء اصطناعي
Arzac Studio — خطط الاشتراك

بين: Arzac Studio (المشار إليه فيما يلي بـ "مزوّد الخدمة")
و: العميل (المشار إليه فيما يلي بـ "العميل")

حيث أن مزوّد الخدمة قام بتطوير بنية تقنية تشمل استضافة مواقع (SaaS)، نظام CRM، وكيل WhatsApp مدعوم بالذكاء الاصطناعي، مكالمات صوتية بالذكاء الاصطناعي وأدوات ذكية (يُشار إليها بـ "نظام القالب الرئيسي")؛

وحيث أن العميل يرغب بالاشتراك في الخدمة؛

اتفق الطرفان على ما يلي:

1. خطط الخدمة

يقدّم مزوّد الخدمة مستويات الاشتراك التالية. جميع الخطط بدون رسوم تأسيس.

1.0. خطة Solo Web — ₪480/شهر
  (أ) موقع إلكتروني مخصص باستخدام نظام القالب الرئيسي، يشمل صفحة هبوط، خدمات، معرض صور، صفحة تواصل وشات بوت ذكاء اصطناعي مدمج في الموقع.
  (ب) حضور رقمي: ظهور على الإنترنت، شراء نطاق وتجديد سنوي.
  (ج) إشعارات بريد إلكتروني عبر Gmail: إشعارات تلقائية لصاحب العمل وللعملاء/المهتمّين. اختيارياً، إشعارات بريد إلكتروني لأعضاء الفريق.
  (د) صيانة مستمرة ودعم فني: تحديثات المحتوى، إصلاح الأخطاء.
  (هـ) استضافة على بنية تحتية لطرف ثالث.

  هذه الخطة لا تشمل: الوصول إلى لوحة إدارة CRM، وكيل واتساب، إشعارات واتساب، مكالمات صوتية بالذكاء الاصطناعي أو نظام إدارة الحجوزات.

1.1. خطة Base — ₪770/شهر
  (أ) موقع إلكتروني مخصص باستخدام نظام القالب الرئيسي.
  (ب) حضور رقمي: ظهور على الإنترنت، شراء نطاق وتجديد سنوي.
  (ج) نظام CRM مع ذكاء اصطناعي: لوحة إدارة، مساعد افتراضي ذكي وتسويق بريد إلكتروني آلي.
  (د) وكيل WhatsApp ذكي: بوت آلي متكامل مع العمل. يردّ على الرسائل، يدير الحجوزات/الإلغاءات، ويجيب على الأسئلة. يعمل 24/7.
  (هـ) حتى 100 حجز شهرياً.
  (و) صيانة مستمرة ودعم فني: تحديثات المحتوى، إصلاح الأخطاء، إدارة بنية الذكاء الاصطناعي.
  (ز) استضافة على بنية تحتية لطرف ثالث.

1.2. خطة Pro — ₪960/شهر
  كل ما في خطة Base، بالإضافة إلى:
  (أ) مكالمات صوتية بالذكاء الاصطناعي: مكالمات واردة وصادرة بتقنية استنساخ الصوت، متكاملة مع تقويم الحجوزات. يأذن العميل لمزوّد الخدمة بإنشاء صوت اصطناعي بناءً على عيّنات مقدّمة.
  (ب) حتى 300 حجز شهرياً.

1.3. خطة Enterprise — ₪1,270/شهر
  كل ما في خطة Pro، بالإضافة إلى:
  (أ) حجوزات غير محدودة شهرياً.
  (ب) مكالمات صوتية غير محدودة.
  (ج) دعم ذو أولوية: ردّ خلال ساعتَي عمل في أيام العمل.

2. الترقية التلقائية

2.0. تسري البنود 2.1 إلى 2.4 على خطط Base وPro وEnterprise فقط. خطة Solo Web غير خاضعة للترقية التلقائية.
2.1. إذا وصل العميل إلى حدّ الحجوزات في خطته الحالية خلال دورة الفوترة، يُرقَّى تلقائياً إلى المستوى التالي من بداية الدورة التالية.
2.2. يُخطَر العميل بالترقية عبر WhatsApp و/أو البريد الإلكتروني خلال 24 ساعة.
2.3. يسري تسعير المستوى الجديد من تاريخ الفوترة التالي.
2.4. بتوقيع هذه الاتفاقية، يوافق العميل صراحةً على الترقيات التلقائية وتعديلات الأسعار المقابلة.
2.5. للعودة إلى مستوى أدنى، يمكن للعميل طلب التخفيض بإشعار مسبق من 30 يوماً، شرط أن يكون استخدامه ضمن حدود المستوى الأدنى.

3. التسعير والدفع

3.1. رسوم الاشتراك حسب الخطة:
  - Solo Web: ₪480/شهر
  - Base: ₪770/شهر
  - Pro: ₪960/شهر
  - Enterprise: ₪1,270/شهر
3.2. رسوم التأسيس: ₪0 (صفر). بدون أيّ رسوم إعداد أو انضمام.
3.3. تُعالج المدفوعات شهرياً عبر Cardcom. لا يخزّن مزوّد الخدمة بيانات البطاقة.
3.4. الاستضافة: مبلغ سنوي متغيّر. يُدفع خلال 7 أيام من الطلب.
3.5. النطاق: مبلغ سنوي متغيّر. يُدفع خلال 7 أيام من الطلب.
3.6. التأخّر في الدفع يؤدي إلى تعليق الموقع وجميع وكلاء الذكاء الاصطناعي. الحذف خلال 7 أيام وإنهاء الاتفاقية.
3.7. لا يُردّ أيّ مبلغ من الرسوم السنوية.

4. مواعيد التسليم

4.1. يُسلَّم الموقع خلال 48 ساعة من استلام مواد التصميم. يُفعَّل وكيل WhatsApp خلال 5 أيام عمل.
4.2. تُفعَّل المكالمات الصوتية (Pro/Enterprise) خلال 5 أيام عمل من استلام عيّنات الصوت وإعداد التقويم.

5. الملكية الفكرية والترخيص

5.1. ترخيص استخدام غير حصري طوال مدة الاتفاقية.
5.2. الكود المصدري وملفات التصميم وحقوق الملكية الفكرية ملك حصري لمزوّد الخدمة.
5.3. الشعار والعلامة التجارية والمحتوى المقدّم من العميل ملكيته الحصرية.
5.4. اسم النطاق ملك العميل.
5.5. بيانات إعداد وكيل WhatsApp ملك العميل وتُسلَّم عند الطلب.
5.6. عيّنات الصوت ملك العميل. يحتفظ مزوّد الخدمة بنماذج الصوت الاصطناعي فقط طوال مدة الاتفاقية.

6. سياسة الاستخدام المقبول

6.1. يُحظر استخدام الموقع ووكلاء الذكاء الاصطناعي لإرسال رسائل مزعجة أو تخزين مواد غير قانونية.
6.2. يُحظر رفع محتوى مسيء أو مضلّل أو محظور قانونياً.
6.3. يُحظر استخدام المكالمات الصوتية للاتصالات الباردة غير المرغوبة أو المضايقة أو الممارسات المضلّلة.
6.4. يُشكّل الانتهاك خرقاً جوهرياً يمنح مزوّد الخدمة حقّ الإنهاء الفوري والأحادي.

7. تحديد المسؤولية

7.1. يتحمّل العميل المسؤولية الكاملة عن المحتوى والبيانات في وكلاء الذكاء الاصطناعي.
7.2. مزوّد الخدمة غير مسؤول عن أضرار ناتجة عن ردود ذكاء اصطناعي مبنية على بيانات غير دقيقة.
7.3. لا يضمن مزوّد الخدمة أيّ نتائج تجارية أو مالية.
7.4. مزوّد الخدمة غير مسؤول عن أعطال منصات الطرف الثالث أو القوة القاهرة.
7.5. لا تتجاوز مسؤولية مزوّد الخدمة بأيّ حال المبلغ الإجمالي المدفوع.

8. إنهاء الاتفاقية

8.1. يحقّ للعميل الإلغاء بإشعار خطي مسبق من 30 يوماً.
8.2. يحقّ لمزوّد الخدمة الإنهاء الفوري في حال انتهاك سياسة الاستخدام.
8.3. يحقّ لمزوّد الخدمة الإنهاء لعدم الدفع بعد إشعار من 7 أيام.
8.4. بعد الإنهاء يُوقَف الموقع وجميع وكلاء الذكاء الاصطناعي.
8.5. لا تُردّ الرسوم السنوية.
8.6. يُسلَّم عند الطلب الكود المصدري وبيانات CRM وإعداد الوكيل وسجلّات المكالمات. لا يُمنح وصول إلى البنية التحتية.

9. القانون المعمول به والاختصاص القضائي

تخضع هذه الاتفاقية للقانون الإسرائيلي. الاختصاص القضائي الحصري: المحاكم المختصة في منطقة تل أبيب.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LOOKUP
 * ═══════════════════════════════════════════════════════════════════════════ */

const contractFns: Record<ContractLang, (plan: PlanType) => string> = {
  en: EN,
  es: ES,
  ru: RU,
  he: HE,
  ar: AR,
};

export function getContract(
  lang: ContractLang,
  plan: PlanType,
): { text: string; version: string } {
  const fn = contractFns[lang] ?? contractFns.en;
  return { text: fn(plan), version: CONTRACT_VERSION };
}

export function isContractLang(lang: string): lang is ContractLang {
  return lang === "en" || lang === "es" || lang === "ru" || lang === "he" || lang === "ar";
}
