import { type PlanType } from "./pricing";

export type ContractLang = "en" | "es" | "ru" | "he";

const CONTRACT_VERSION = "3.0";

/* ═══════════════════════════════════════════════════════════════════════════
 * ENGLISH CONTRACTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const EN_BASE = `SERVICE AGREEMENT — WEBSITE DEVELOPMENT, MAINTENANCE & HOSTING
Base Plan — ₪790/month

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

WHEREAS the Provider has developed a technological infrastructure including website hosting (SaaS), a CRM system and AI-powered tools, maintenance, and storage (the "Master Template System");

AND WHEREAS the Client wishes to subscribe to the Base Plan (website + CRM) for online visibility, digitalisation, and business management;

THE PARTIES AGREE AS FOLLOWS:

1. Services

1.1. Development of a personal website using existing Master Template System templates.
1.2. Online visibility: presence on the internet.
1.3. Micro-CRM and AI access: personal management dashboard, AI virtual assistant, and automated email marketing tool.
1.4. Ongoing maintenance and technical support: dynamic content updates (images, prices, texts, colours), bug fixes, and AI infrastructure management. Structural design changes are not included and require a separate written agreement and additional fee.
1.5. Website hosting: on third-party infrastructure, at the Provider's discretion.
1.6. Domain: purchase and annual renewal on behalf of the Client.

2. Pricing & Payment

2.1. Monthly subscription: ₪790/month.
2.2. Annual hosting fee: variable amount per year. May change annually subject to third-party costs. Payable within 7 days of the Provider's demand.
2.3. Domain fee: variable amount per year. May change annually. Payable within 7 days of the Provider's demand.
2.4. Late payment will result in the website being suspended. Permanent deletion occurs 7 days after the missed payment and this agreement is terminated.
2.5. No refunds or credits are issued for annual hosting or domain fees upon early termination.

3. Delivery Timeline

3.1. A functional website is delivered within 48 hours of receiving the Client's design materials.

4. Intellectual Property & Licensing

4.1. The Client receives a non-exclusive licence for the duration of this agreement.
4.2. Source code, PSD files, and all IP rights to the website design remain the sole property of the Provider.
4.3. Logos, brand assets, and content provided by the Client remain the Client's exclusive IP and are used by the Provider solely for this agreement.
4.4. The domain name is owned by the Client.

5. Acceptable Use Policy

5.1. The website may not be used to send spam or store illegal material.
5.2. Uploading or configuring offensive, misleading, or legally prohibited content is strictly prohibited.
5.3. Breach of this section constitutes a material breach entitling the Provider to terminate services immediately and unilaterally.

6. Limitation of Liability

6.1. The Client bears sole responsibility for all content on the website.
6.2. The Provider does not guarantee any commercial results, sales, or financial returns.
6.3. The Provider is not liable for failures caused by third-party platforms or force majeure.
6.4. In no event shall the Provider's liability exceed the total amount paid under this agreement.

7. Termination

7.1. The Client may cancel with 30 days' written notice.
7.2. The Provider may terminate immediately for breach of the Acceptable Use Policy.
7.3. The Provider may terminate for non-payment after 7 days' written notice.
7.4. Upon termination the website will be taken offline.
7.5. No annual fee refunds will be issued.
7.6. Upon request, the Provider will deliver the website source code (HTML/CSS/JS) and the Client's CRM data. No access to internal infrastructure will be granted.

8. Governing Law & Jurisdiction

This agreement is governed by Israeli law. Exclusive jurisdiction: competent courts of the Tel Aviv district.`;

const EN_PREMIUM = `SERVICE AGREEMENT — WEBSITE, CRM & WHATSAPP AGENT
Premium Plan — ₪990/month

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

WHEREAS the Provider has developed a technological infrastructure including website hosting (SaaS), a CRM system, an AI-powered WhatsApp agent, and AI-powered tools, maintenance, and storage (the "Master Template System");

AND WHEREAS the Client wishes to subscribe to the Premium Plan (website + CRM + WhatsApp agent) for online visibility, digitalisation, and business management;

THE PARTIES AGREE AS FOLLOWS:

1. Services

1.1. Development of a personal website using existing Master Template System templates.
1.2. Online visibility: presence on the internet.
1.3. Micro-CRM and AI access: personal management dashboard, AI virtual assistant, and automated email marketing tool.
1.4. AI-Powered WhatsApp Agent: automated bot integrated with the Client's business. Responds to customer messages, manages appointment bookings/cancellations, and answers questions based on information entered by the Client. Operates 24/7. The Provider is not liable for incorrect AI responses caused by inaccurate or incomplete data provided by the Client.
1.5. Ongoing maintenance and technical support: dynamic content updates (images, prices, texts, colours), bug fixes, and AI infrastructure management. Structural design changes are not included and require a separate written agreement and additional fee.
1.6. Website hosting: on third-party infrastructure, at the Provider's discretion.
1.7. Domain: purchase and annual renewal on behalf of the Client.

2. Pricing & Payment

2.1. Monthly subscription: ₪990/month.
2.2. Annual hosting fee: variable amount per year. May change annually subject to third-party costs. Payable within 7 days of the Provider's demand.
2.3. Domain fee: variable amount per year. May change annually. Payable within 7 days of the Provider's demand.
2.4. Late payment will result in the website and WhatsApp agent being suspended. Permanent deletion occurs 7 days after the missed payment and this agreement is terminated.
2.5. No refunds or credits are issued for annual hosting or domain fees upon early termination.

3. Delivery Timeline

3.1. A functional website is delivered within 48 hours of receiving the Client's design materials. The WhatsApp agent is activated within 5 business days of receiving business information and WhatsApp account access.

4. Intellectual Property & Licensing

4.1. The Client receives a non-exclusive licence for the duration of this agreement.
4.2. Source code, PSD files, and all IP rights to the website design remain the sole property of the Provider.
4.3. Logos, brand assets, and content provided by the Client remain the Client's exclusive IP and are used by the Provider solely for this agreement.
4.4. The domain name is owned by the Client.
4.5. WhatsApp agent configuration data (responses and business information) entered by the Client belongs to the Client and will be provided upon request at termination.

5. Acceptable Use Policy

5.1. The website and WhatsApp agent may not be used to send spam or store illegal material.
5.2. Uploading or configuring offensive, misleading, or legally prohibited content is strictly prohibited.
5.3. Breach of this section constitutes a material breach entitling the Provider to terminate services immediately and unilaterally.

6. Limitation of Liability

6.1. The Client bears sole responsibility for all content on the website and all information configured in the WhatsApp agent.
6.2. The Provider is not liable for damages arising from AI responses based on incorrect or incomplete data provided by the Client.
6.3. The Provider does not guarantee any commercial results, sales, or financial returns.
6.4. The Provider is not liable for failures caused by third-party platforms (including WhatsApp/Meta) or force majeure.
6.5. In no event shall the Provider's liability exceed the total amount paid under this agreement.

7. Termination

7.1. The Client may cancel with 30 days' written notice.
7.2. The Provider may terminate immediately for breach of the Acceptable Use Policy.
7.3. The Provider may terminate for non-payment after 7 days' written notice.
7.4. Upon termination the website and WhatsApp agent will be taken offline.
7.5. No annual fee refunds will be issued.
7.6. Upon request, the Provider will deliver the website source code (HTML/CSS/JS) and the Client's CRM data and agent configuration. No access to internal infrastructure will be granted.

8. Governing Law & Jurisdiction

This agreement is governed by Israeli law. Exclusive jurisdiction: competent courts of the Tel Aviv district.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * HEBREW CONTRACTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const HE_BASE = `הסכם מתן שירות – בניית אתר, תחזוקה ואחסון
תוכנית בסיס – ₪790/חודש

בין: Arzac Studio (להלן: "הספק")
לבין: הלקוח (להלן: "המזמין")

הואיל והספק פיתח תשתית טכנולוגית הכוללת אירוח אתרים (SaaS), מערכת CRM וכלים נוספים (להלן: "מערכת תבנית מאסטר");

והואיל והמזמין מבקש לקבל אתר אישי לצורך חשיפת העסק וניהולו;

לפיכך הוסכם והותנה:

1. השירותים

1.1. פיתוח אתר אישי בהתאם לתבניות הקיימות.
1.2. נראות: ויסיביליטי ברשת האינטרנט.
1.3. מיקרו-CRM ובינה מלאכותית: לוח ניהול אישי, עוזר וירטואלי AI ומערכת דיוור אוטומטית.
1.4. תחזוקה שוטפת ותמיכה טכנית: עדכוני תוכן דינמי (תמונות, מחירים, טקסטים), תיקון שגיאות וניהול תשתיות AI. שינויים מבניים בעיצוב אינם כלולים ודורשים הסכם נפרד בתוספת תשלום.
1.5. אחסון האתר על תשתיות צד שלישי.
1.6. דומיין: רכישה וחידוש שנתי.

2. תמורה ותשלומים

2.1. דמי מנוי חודשיים: ₪790 לחודש.
2.2. אחסון: עלות שנתית משתנה. עשויה להשתנות בהתאם לעלויות צד שלישי. ישולם תוך 7 ימים מדרישה.
2.3. דומיין: עלות שנתית משתנה. עשויה להשתנות. ישולם תוך 7 ימים מדרישה.
2.4. אי-תשלום יגרור הורדת האתר מהאוויר. מחיקה תוך 7 ימים וביטול ההסכם.
2.5. לא יינתן זיכוי על תשלומים שנתיים.

3. זמני מסירה

3.1. האתר יימסר תוך 48 שעות מקבלת פרטי העיצוב מהמזמין.

4. קניין רוחני ורישוי

4.1. רישיון שימוש לא בלעדי לתקופת ההסכם.
4.2. קוד המקור, קבצי PSD וזכויות הקניין הרוחני על עיצוב האתר הם קניין בלעדי של הספק.
4.3. לוגו, מותג ותכנים שסיפק המזמין הם קניינו הבלעדי ומשמשים אך ורק לצורך הסכם זה.
4.4. הדומיין בבעלות המזמין.

5. מדיניות שימוש מקובל

5.1. אסור לשלוח ספאם או לאחסן חומרים בלתי חוקיים באתר.
5.2. אסור להעלות תוכן פוגעני, מטעה או אסור על פי דין.
5.3. הפרה מהווה הפרה יסודית המקנה לספק זכות לסיום מידי וחד-צדדי.

6. הגבלת אחריות

6.1. המזמין נושא באחריות בלעדית לכל תוכן באתר.
6.2. הספק אינו מתחייב לתוצאות מסחריות, מכירות או תשואה כלכלית.
6.3. הספק אינו אחראי לכשלים של פלטפורמות צד שלישי או כוח עליון.
6.4. בשום מקרה אחריות הספק לא תעלה על הסכום הכולל ששולם על פי הסכם זה.

7. סיום הסכם

7.1. המזמין רשאי לבטל בהודעה מוקדמת בכתב של 30 יום.
7.2. הספק רשאי לבטל לאלתר בגין הפרת מדיניות השימוש.
7.3. הספק רשאי לבטל עקב אי-תשלום לאחר 7 ימי התראה בכתב.
7.4. עם הביטול האתר ירד מהאוויר.
7.5. לא יינתן זיכוי על תשלום שנתי.
7.6. על-פי בקשה, יועברו קוד המקור (HTML/CSS/JS) ונתוני ה-CRM. לא תינתן גישה לתשתית הפנימית של הספק.

8. שיפוט

הסכם זה כפוף לדין הישראלי. סמכות שיפוט בלעדית לבתי המשפט המוסמכים בתל אביב.`;

const HE_PREMIUM = `הסכם מתן שירות – אתר, CRM וסוכן WhatsApp
תוכנית פרמיום – ₪990/חודש

בין: Arzac Studio (להלן: "הספק")
לבין: הלקוח (להלן: "המזמין")

הואיל והספק פיתח תשתית טכנולוגית הכוללת אירוח אתרים (SaaS), מערכת CRM, סוכן WhatsApp מבוסס AI וכלים נוספים (להלן: "מערכת תבנית מאסטר");

והואיל והמזמין מבקש להצטרף לתוכנית הפרמיום (אתר + CRM + סוכן WhatsApp);

לפיכך הוסכם והותנה:

1. השירותים

1.1. פיתוח אתר אישי בהתאם לתבניות הקיימות.
1.2. נראות: ויסיביליטי ברשת האינטרנט.
1.3. מיקרו-CRM ובינה מלאכותית: לוח ניהול אישי, עוזר וירטואלי AI ומערכת דיוור אוטומטית.
1.4. סוכן WhatsApp מבוסס AI: בוט אוטומטי המשולב בעסק המזמין. עונה להודעות לקוחות, מנהל קביעת/ביטול תורים ועונה על שאלות על בסיס המידע שהוזן. פעיל 24/7. הספק אינו אחראי לתשובות שגויות עקב מידע לא מדויק שסיפק המזמין.
1.5. תחזוקה שוטפת ותמיכה טכנית: עדכוני תוכן דינמי (תמונות, מחירים, טקסטים), תיקון שגיאות וניהול תשתיות AI. שינויים מבניים בעיצוב אינם כלולים ודורשים הסכם נפרד בתוספת תשלום.
1.6. אחסון האתר על תשתיות צד שלישי.
1.7. דומיין: רכישה וחידוש שנתי.

2. תמורה ותשלומים

2.1. דמי מנוי חודשיים: ₪990 לחודש.
2.2. אחסון: עלות שנתית משתנה. עשויה להשתנות בהתאם לעלויות צד שלישי. ישולם תוך 7 ימים מדרישה.
2.3. דומיין: עלות שנתית משתנה. עשויה להשתנות. ישולם תוך 7 ימים מדרישה.
2.4. אי-תשלום יגרור הורדת האתר והשבתת סוכן ה-WhatsApp. מחיקה תוך 7 ימים וביטול ההסכם.
2.5. לא יינתן זיכוי על תשלומים שנתיים.

3. זמני מסירה

3.1. האתר יימסר תוך 48 שעות מקבלת פרטי העיצוב. סוכן ה-WhatsApp יופעל תוך 5 ימי עסקים מקבלת המידע העסקי וגישה לחשבון WhatsApp.

4. קניין רוחני ורישוי

4.1. רישיון שימוש לא בלעדי לתקופת ההסכם.
4.2. קוד המקור, קבצי PSD וזכויות הקניין הרוחני על עיצוב האתר הם קניין בלעדי של הספק.
4.3. לוגו, מותג ותכנים שסיפק המזמין הם קניינו הבלעדי ומשמשים אך ורק לצורך הסכם זה.
4.4. הדומיין בבעלות המזמין.
4.5. תצורת סוכן ה-WhatsApp (תשובות ומידע עסקי) שייכת למזמין ותועבר לבקשה בסיום ההסכם.

5. מדיניות שימוש מקובל

5.1. אסור להשתמש באתר ובסוכן ה-WhatsApp לשליחת ספאם או אחסון חומרים בלתי חוקיים.
5.2. אסור להעלות תוכן פוגעני, מטעה או אסור על פי דין.
5.3. הפרה מהווה הפרה יסודית המקנה לספק זכות לסיום מידי וחד-צדדי.

6. הגבלת אחריות

6.1. המזמין נושא באחריות בלעדית לכל תוכן באתר ולמידע המוגדר בסוכן.
6.2. הספק אינו אחראי לנזקים מתשובות AI עקב מידע שגוי או חלקי שסיפק המזמין.
6.3. הספק אינו מתחייב לתוצאות מסחריות, מכירות או תשואה כלכלית.
6.4. הספק אינו אחראי לכשלים של פלטפורמות צד שלישי (כולל WhatsApp/Meta) או כוח עליון.
6.5. בשום מקרה אחריות הספק לא תעלה על הסכום הכולל ששולם על פי הסכם זה.

7. סיום הסכם

7.1. המזמין רשאי לבטל בהודעה מוקדמת בכתב של 30 יום.
7.2. הספק רשאי לבטל לאלתר בגין הפרת מדיניות השימוש.
7.3. הספק רשאי לבטל עקב אי-תשלום לאחר 7 ימי התראה בכתב.
7.4. עם הביטול האתר וסוכן ה-WhatsApp ירדו מהאוויר.
7.5. לא יינתן זיכוי על תשלום שנתי.
7.6. על-פי בקשה, יועברו קוד המקור (HTML/CSS/JS), נתוני ה-CRM ותצורת הסוכן. לא תינתן גישה לתשתית הפנימית של הספק.

8. שיפוט

הסכם זה כפוף לדין הישראלי. סמכות שיפוט בלעדית לבתי המשפט המוסמכים בתל אביב.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * RUSSIAN CONTRACTS
 * ═══════════════════════════════════════════════════════════════════════════ */

const RU_BASE = `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ — РАЗРАБОТКА САЙТА, ОБСЛУЖИВАНИЕ И ХОСТИНГ
Базовый план — ₪790/мес

Между: Arzac Studio (далее — «Исполнитель»)
И: Заказчик (далее — «Заказчик»)

Принимая во внимание, что Исполнитель разработал технологическую инфраструктуру, включая хостинг сайтов (SaaS), CRM и инструменты на базе ИИ (далее — «Система Мастер-Шаблона»);

И принимая во внимание, что Заказчик желает подключиться к Базовому плану (сайт + CRM);

Стороны договорились о нижеследующем:

1. Перечень услуг

1.1. Разработка персонального сайта на основе существующих шаблонов.
1.2. Интернет-присутствие: видимость бизнеса в сети.
1.3. Система микро-CRM и доступ к ИИ: личная панель управления, виртуальный ассистент на базе ИИ и автоматическая рассылка.
1.4. Текущее техническое обслуживание и поддержка: обновление контента (изображения, цены, тексты), исправление ошибок и управление инфраструктурой ИИ. Структурные изменения дизайна не включены и оформляются отдельно.
1.5. Хостинг сайта на сторонней инфраструктуре.
1.6. Домен: покупка и ежегодное продление.

2. Стоимость и порядок оплаты

2.1. Ежемесячная абонентская плата: ₪790 в месяц.
2.2. Хостинг: переменная сумма в год. Может изменяться в зависимости от расходов третьих сторон. Оплачивается в течение 7 дней с момента запроса.
2.3. Домен: переменная сумма в год. Может изменяться. Оплачивается в течение 7 дней с момента запроса.
2.4. Просрочка оплаты повлечёт остановку сайта. Удаление через 7 дней, расторжение договора.
2.5. Возврат ежегодных платежей не производится.

3. Сроки исполнения

3.1. Функциональный сайт передаётся в течение 48 часов после получения дизайн-материалов от Заказчика.

4. Интеллектуальная собственность и лицензирование

4.1. Неисключительная лицензия на срок действия договора.
4.2. Исходный код, PSD-файлы и права на дизайн сайта — собственность Исполнителя.
4.3. Логотип, бренд и контент Заказчика — его исключительная собственность, используются только в рамках настоящего договора.
4.4. Доменное имя принадлежит Заказчику.

5. Политика допустимого использования

5.1. Запрещается использовать сайт для рассылки спама или хранения незаконных материалов.
5.2. Запрещается размещать оскорбительный, вводящий в заблуждение или противоправный контент.
5.3. Нарушение даёт Исполнителю право немедленно и в одностороннем порядке расторгнуть договор.

6. Ограничение ответственности

6.1. Заказчик несёт исключительную ответственность за весь контент сайта.
6.2. Коммерческие результаты, продажи или финансовая отдача не гарантируются.
6.3. Исполнитель не отвечает за сбои сторонних платформ или форс-мажор.
6.4. Ответственность Исполнителя ни при каких обстоятельствах не превышает сумму, уплаченную по договору.

7. Расторжение договора

7.1. Заказчик вправе расторгнуть договор с письменным уведомлением за 30 дней.
7.2. Исполнитель вправе расторгнуть немедленно при нарушении политики использования.
7.3. Исполнитель вправе расторгнуть договор при неоплате после 7-дневного предупреждения.
7.4. После расторжения сайт деактивируется.
7.5. Возврат ежегодных платежей не производится.
7.6. По запросу передаются исходный код сайта (HTML/CSS/JS) и данные CRM. Доступ к внутренней инфраструктуре не предоставляется.

8. Применимое право и юрисдикция

Договор регулируется законодательством Израиля. Исключительная юрисдикция: компетентные суды округа Тель-Авива.`;

const RU_PREMIUM = `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ — САЙТ, CRM И АГЕНТ WHATSAPP
Премиум-план — ₪990/мес

Между: Arzac Studio (далее — «Исполнитель»)
И: Заказчик (далее — «Заказчик»)

Принимая во внимание, что Исполнитель разработал технологическую инфраструктуру, включая хостинг сайтов (SaaS), CRM, АИ-агента WhatsApp и инструменты на базе ИИ (далее — «Система Мастер-Шаблона»);

И принимая во внимание, что Заказчик желает подключиться к Премиум-плану (сайт + CRM + агент WhatsApp);

Стороны договорились о нижеследующем:

1. Перечень услуг

1.1. Разработка персонального сайта на основе существующих шаблонов.
1.2. Интернет-присутствие: видимость бизнеса в сети.
1.3. Система микро-CRM и доступ к ИИ: личная панель управления, виртуальный ассистент на базе ИИ и автоматическая рассылка.
1.4. АИ-агент WhatsApp: автоматизированный бот, интегрированный в бизнес Заказчика. Отвечает на сообщения клиентов, управляет записью/отменой встреч, отвечает на вопросы на основе данных Заказчика. Работает 24/7. Исполнитель не несёт ответственности за некорректные ответы вследствие неточных данных Заказчика.
1.5. Текущее техническое обслуживание и поддержка: обновление контента (изображения, цены, тексты), исправление ошибок и управление инфраструктурой ИИ. Структурные изменения дизайна не включены и оформляются отдельно.
1.6. Хостинг сайта на сторонней инфраструктуре.
1.7. Домен: покупка и ежегодное продление.

2. Стоимость и порядок оплаты

2.1. Ежемесячная абонентская плата: ₪990 в месяц.
2.2. Хостинг: переменная сумма в год. Может изменяться в зависимости от расходов третьих сторон. Оплачивается в течение 7 дней с момента запроса.
2.3. Домен: переменная сумма в год. Может изменяться. Оплачивается в течение 7 дней с момента запроса.
2.4. Просрочка оплаты повлечёт остановку сайта и агента WhatsApp. Удаление через 7 дней, расторжение договора.
2.5. Возврат ежегодных платежей не производится.

3. Сроки исполнения

3.1. Функциональный сайт передаётся в течение 48 часов после получения дизайн-материалов. Агент WhatsApp активируется в течение 5 рабочих дней после предоставления бизнес-информации и доступа к аккаунту WhatsApp.

4. Интеллектуальная собственность и лицензирование

4.1. Неисключительная лицензия на срок действия договора.
4.2. Исходный код, PSD-файлы и права на дизайн сайта — собственность Исполнителя.
4.3. Логотип, бренд и контент Заказчика — его исключительная собственность, используются только в рамках настоящего договора.
4.4. Доменное имя принадлежит Заказчику.
4.5. Конфигурация агента WhatsApp (ответы и бизнес-данные) принадлежит Заказчику и передаётся по запросу при расторжении.

5. Политика допустимого использования

5.1. Запрещается использовать сайт и агента WhatsApp для рассылки спама или хранения незаконных материалов.
5.2. Запрещается размещать оскорбительный, вводящий в заблуждение или противоправный контент.
5.3. Нарушение даёт Исполнителю право немедленно и в одностороннем порядке расторгнуть договор.

6. Ограничение ответственности

6.1. Заказчик несёт исключительную ответственность за весь контент сайта и информацию в агенте.
6.2. Исполнитель не несёт ответственности за некорректные ответы ИИ при неточных данных Заказчика.
6.3. Коммерческие результаты, продажи или финансовая отдача не гарантируются.
6.4. Исполнитель не отвечает за сбои сторонних платформ (включая WhatsApp/Meta) или форс-мажор.
6.5. Ответственность Исполнителя ни при каких обстоятельствах не превышает сумму, уплаченную по договору.

7. Расторжение договора

7.1. Заказчик вправе расторгнуть договор с письменным уведомлением за 30 дней.
7.2. Исполнитель вправе расторгнуть немедленно при нарушении политики использования.
7.3. Исполнитель вправе расторгнуть договор при неоплате после 7-дневного предупреждения.
7.4. После расторжения сайт и агент WhatsApp деактивируются.
7.5. Возврат ежегодных платежей не производится.
7.6. По запросу передаются исходный код сайта (HTML/CSS/JS), данные CRM и конфигурация агента. Доступ к внутренней инфраструктуре не предоставляется.

8. Применимое право и юрисдикция

Договор регулируется законодательством Израиля. Исключительная юрисдикция: компетентные суды округа Тель-Авива.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * SPANISH CONTRACTS (translated from English)
 * ═══════════════════════════════════════════════════════════════════════════ */

const ES_BASE = `ACUERDO DE SERVICIOS — DESARROLLO DE SITIO WEB, MANTENIMIENTO Y HOSTING
Plan Base — ₪790/mes

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnológica que incluye hosting de sitios web (SaaS), un sistema CRM y herramientas impulsadas por inteligencia artificial, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Plan Base (sitio web + CRM) para visibilidad en internet, digitalización y gestión operativa de su negocio;

LAS PARTES ACUERDAN LO SIGUIENTE:

1. Servicios

1.1. Desarrollo de un sitio web personal utilizando plantillas existentes del Sistema de Plantilla Maestra.
1.2. Visibilidad online: presencia en internet.
1.3. Micro-CRM con acceso a IA: panel de gestión personal, asistente virtual con IA y herramienta de email marketing automatizado.
1.4. Mantenimiento continuo y soporte técnico: actualizaciones de contenido dinámico (imágenes, precios, textos), corrección de errores y gestión de infraestructura de IA. Los cambios de diseño estructural no están incluidos y requieren un acuerdo separado con costo adicional.
1.5. Hosting del sitio web: en infraestructura de terceros, a discreción del Proveedor.
1.6. Dominio: compra y renovación anual en nombre del Cliente.

2. Precio y Pago

2.1. Suscripción mensual: ₪790/mes.
2.2. Hosting anual: monto variable por año. Puede cambiar anualmente según costos de terceros. Pagadero dentro de 7 días desde la solicitud del Proveedor.
2.3. Dominio: monto variable por año. Puede cambiar anualmente. Pagadero dentro de 7 días desde la solicitud del Proveedor.
2.4. La falta de pago resultará en la suspensión del sitio web. La eliminación permanente ocurre 7 días después del impago y este acuerdo se rescinde.
2.5. No se emiten reembolsos ni créditos por tarifas anuales de hosting o dominio en caso de rescisión anticipada.

3. Plazos de Entrega

3.1. Un sitio web funcional se entrega dentro de las 48 horas posteriores a la recepción de los materiales de diseño del Cliente.

4. Propiedad Intelectual y Licencias

4.1. El Cliente recibe una licencia no exclusiva por la duración de este acuerdo.
4.2. El código fuente, archivos PSD y todos los derechos de PI sobre el diseño del sitio web son propiedad exclusiva del Proveedor.
4.3. Logos, activos de marca y contenido proporcionados por el Cliente son PI exclusiva del Cliente y son utilizados por el Proveedor únicamente para este acuerdo.
4.4. El nombre de dominio es propiedad del Cliente.

5. Política de Uso Aceptable

5.1. El sitio web no puede ser utilizado para enviar spam o almacenar material ilegal.
5.2. Está estrictamente prohibido subir o configurar contenido ofensivo, engañoso o legalmente prohibido.
5.3. La violación de esta sección constituye un incumplimiento material que otorga al Proveedor el derecho de rescindir los servicios de forma inmediata y unilateral.

6. Limitación de Responsabilidad

6.1. El Cliente asume la responsabilidad exclusiva por todo el contenido del sitio web.
6.2. El Proveedor no garantiza resultados comerciales, ventas ni retornos financieros.
6.3. El Proveedor no es responsable por fallas causadas por plataformas de terceros o fuerza mayor.
6.4. En ningún caso la responsabilidad del Proveedor excederá el monto total pagado bajo este acuerdo.

7. Rescisión

7.1. El Cliente puede cancelar con 30 días de aviso por escrito.
7.2. El Proveedor puede rescindir inmediatamente por violación de la Política de Uso Aceptable.
7.3. El Proveedor puede rescindir por falta de pago con 7 días de aviso por escrito.
7.4. Tras la rescisión, el sitio web será dado de baja.
7.5. No se emitirán reembolsos por tarifas anuales.
7.6. A solicitud, el Proveedor entregará el código fuente del sitio web (HTML/CSS/JS) y los datos del CRM del Cliente. No se otorgará acceso a la infraestructura interna.

8. Ley Aplicable y Jurisdicción

Este acuerdo se rige por la ley israelí. Jurisdicción exclusiva: tribunales competentes del distrito de Tel Aviv.`;

const ES_PREMIUM = `ACUERDO DE SERVICIOS — SITIO WEB, CRM Y AGENTE WHATSAPP
Plan Premium — ₪990/mes

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnológica que incluye hosting de sitios web (SaaS), un sistema CRM, un agente de WhatsApp impulsado por IA y herramientas con inteligencia artificial, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Plan Premium (sitio web + CRM + agente WhatsApp) para visibilidad en internet, digitalización y gestión operativa de su negocio;

LAS PARTES ACUERDAN LO SIGUIENTE:

1. Servicios

1.1. Desarrollo de un sitio web personal utilizando plantillas existentes del Sistema de Plantilla Maestra.
1.2. Visibilidad online: presencia en internet.
1.3. Micro-CRM con acceso a IA: panel de gestión personal, asistente virtual con IA y herramienta de email marketing automatizado.
1.4. Agente WhatsApp con IA: bot automatizado integrado con el negocio del Cliente. Responde mensajes de clientes, gestiona reservas/cancelaciones de turnos y responde preguntas basándose en la información ingresada por el Cliente. Opera 24/7. El Proveedor no es responsable por respuestas incorrectas de la IA causadas por datos inexactos o incompletos proporcionados por el Cliente.
1.5. Mantenimiento continuo y soporte técnico: actualizaciones de contenido dinámico (imágenes, precios, textos), corrección de errores y gestión de infraestructura de IA. Los cambios de diseño estructural no están incluidos y requieren un acuerdo separado con costo adicional.
1.6. Hosting del sitio web: en infraestructura de terceros, a discreción del Proveedor.
1.7. Dominio: compra y renovación anual en nombre del Cliente.

2. Precio y Pago

2.1. Suscripción mensual: ₪990/mes.
2.2. Hosting anual: monto variable por año. Puede cambiar anualmente según costos de terceros. Pagadero dentro de 7 días desde la solicitud del Proveedor.
2.3. Dominio: monto variable por año. Puede cambiar anualmente. Pagadero dentro de 7 días desde la solicitud del Proveedor.
2.4. La falta de pago resultará en la suspensión del sitio web y del agente WhatsApp. La eliminación permanente ocurre 7 días después del impago y este acuerdo se rescinde.
2.5. No se emiten reembolsos ni créditos por tarifas anuales de hosting o dominio en caso de rescisión anticipada.

3. Plazos de Entrega

3.1. Un sitio web funcional se entrega dentro de las 48 horas posteriores a la recepción de los materiales de diseño del Cliente. El agente WhatsApp se activa dentro de 5 días hábiles posteriores a la recepción de información del negocio y acceso a la cuenta de WhatsApp.

4. Propiedad Intelectual y Licencias

4.1. El Cliente recibe una licencia no exclusiva por la duración de este acuerdo.
4.2. El código fuente, archivos PSD y todos los derechos de PI sobre el diseño del sitio web son propiedad exclusiva del Proveedor.
4.3. Logos, activos de marca y contenido proporcionados por el Cliente son PI exclusiva del Cliente y son utilizados por el Proveedor únicamente para este acuerdo.
4.4. El nombre de dominio es propiedad del Cliente.
4.5. Los datos de configuración del agente WhatsApp (respuestas e información del negocio) ingresados por el Cliente pertenecen al Cliente y serán proporcionados a solicitud al momento de la rescisión.

5. Política de Uso Aceptable

5.1. El sitio web y el agente WhatsApp no pueden ser utilizados para enviar spam o almacenar material ilegal.
5.2. Está estrictamente prohibido subir o configurar contenido ofensivo, engañoso o legalmente prohibido.
5.3. La violación de esta sección constituye un incumplimiento material que otorga al Proveedor el derecho de rescindir los servicios de forma inmediata y unilateral.

6. Limitación de Responsabilidad

6.1. El Cliente asume la responsabilidad exclusiva por todo el contenido del sitio web y toda la información configurada en el agente WhatsApp.
6.2. El Proveedor no es responsable por daños derivados de respuestas de la IA basadas en datos incorrectos o incompletos proporcionados por el Cliente.
6.3. El Proveedor no garantiza resultados comerciales, ventas ni retornos financieros.
6.4. El Proveedor no es responsable por fallas causadas por plataformas de terceros (incluido WhatsApp/Meta) o fuerza mayor.
6.5. En ningún caso la responsabilidad del Proveedor excederá el monto total pagado bajo este acuerdo.

7. Rescisión

7.1. El Cliente puede cancelar con 30 días de aviso por escrito.
7.2. El Proveedor puede rescindir inmediatamente por violación de la Política de Uso Aceptable.
7.3. El Proveedor puede rescindir por falta de pago con 7 días de aviso por escrito.
7.4. Tras la rescisión, el sitio web y el agente WhatsApp serán dados de baja.
7.5. No se emitirán reembolsos por tarifas anuales.
7.6. A solicitud, el Proveedor entregará el código fuente del sitio web (HTML/CSS/JS), los datos del CRM y la configuración del agente. No se otorgará acceso a la infraestructura interna.

8. Ley Aplicable y Jurisdicción

Este acuerdo se rige por la ley israelí. Jurisdicción exclusiva: tribunales competentes del distrito de Tel Aviv.`;

/* ═══════════════════════════════════════════════════════════════════════════
 * LOOKUP
 * ═══════════════════════════════════════════════════════════════════════════ */

const contracts: Record<ContractLang, Record<PlanType, string>> = {
  en: { web_crm: EN_BASE, completo: EN_PREMIUM },
  es: { web_crm: ES_BASE, completo: ES_PREMIUM },
  ru: { web_crm: RU_BASE, completo: RU_PREMIUM },
  he: { web_crm: HE_BASE, completo: HE_PREMIUM },
};

/**
 * Devuelve el contrato para el idioma y plan especificados.
 * Inyecta la fecha actual. Fallback a inglés si el idioma no existe.
 */
export function getContract(
  lang: ContractLang,
  plan: PlanType,
): { text: string; version: string } {
  const raw = contracts[lang]?.[plan] ?? contracts.en[plan];
  return { text: raw, version: CONTRACT_VERSION };
}

/**
 * Devuelve true si el idioma tiene contrato disponible.
 */
export function isContractLang(lang: string): lang is ContractLang {
  return lang === "en" || lang === "es" || lang === "ru" || lang === "he";
}
