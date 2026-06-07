import { type PlanType } from "./pricing";

export type ContractLang = "en" | "es" | "ru" | "he" | "ar";

const CONTRACT_VERSION = "5.0";

/* ═══════════════════════════════════════════════════════════════════════════
 * PLAN DETAILS (shared across all languages)
 * ═══════════════════════════════════════════════════════════════════════════ */

const PLAN_TABLE = {
  base: { price: 770, bookings: 100 },
  pro: { price: 960, bookings: 300 },
  enterprise: { price: 1270, bookings: "unlimited" },
} as const;

/* ═══════════════════════════════════════════════════════════════════════════
 * ENGLISH CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function EN(plan: PlanType): string {
  return `SERVICE AGREEMENT — WEBSITE, CRM & AI AGENTS
Arzac Studio — 3-Tier Subscription

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

WHEREAS the Provider has developed a technological infrastructure including website hosting (SaaS), a CRM system, an AI-powered WhatsApp agent, AI voice calling, and AI-powered tools, maintenance, and storage (the "Master Template System");

AND WHEREAS the Client wishes to subscribe to the Service for online visibility, digitalisation, and business management;

THE PARTIES AGREE AS FOLLOWS:

1. Service Plans

The Provider offers three subscription tiers. All plans include zero setup fee.

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

2.1. If the Client reaches the booking limit of the current plan during a billing cycle, the system will automatically upgrade the Client to the next available tier starting from the following billing cycle.
2.2. The Client will be notified of the upgrade via WhatsApp and/or email within 24 hours.
2.3. The new tier pricing applies from the next billing date.
2.4. By signing this agreement, the Client expressly consents to automatic tier upgrades and the corresponding price adjustments as described above.
2.5. If the Client wishes to revert to a lower tier, they may request a downgrade with 30 days' written notice, effective at the next billing cycle, provided their usage falls within the lower tier limits.

3. Pricing & Payment

3.1. Subscription fees per tier:
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
  return `הסכם מתן שירות – אתר, CRM וסוכני AI
Arzac Studio — מנוי 3 רמות

בין: Arzac Studio (להלן: "הספק")
לבין: הלקוח (להלן: "המזמין")

הואיל והספק פיתח תשתית טכנולוגית הכוללת אירוח אתרים (SaaS), מערכת CRM, סוכן WhatsApp מבוסס AI, שיחות קוליות עם AI וכלים נוספים (להלן: "מערכת תבנית מאסטר");

והואיל והמזמין מבקש להצטרף לשירות;

לפיכך הוסכם והותנה:

1. תוכניות שירות

הספק מציע שלוש רמות מנוי. כל התוכניות כוללות אפס דמי הקמה.

1.1. תוכנית Base — ₪770/חודש
  (א) אתר אישי מותאם על בסיס מערכת תבנית מאסטר.
  (ב) נראות: נוכחות באינטרנט, רכישת דומיין וחידוש שנתי.
  (ג) מיקרו-CRM עם בינה מלאכותית: לוח ניהול, עוזר וירטואלי AI ודיוור אוטומטי.
  (ד) סוכן WhatsApp מבוסס AI: בוט אוטומטי המשולב בעסק. עונה להודעות, מנהל קביעת/ביטול תורים ועונה על שאלות. פעיל 24/7.
  (ה) עד 100 תורים בחודש.
  (ו) תחזוקה שוטפת ותמיכה טכנית: עדכוני תוכן, תיקון שגיאות, ניהול תשתיות AI.
  (ז) אחסון על תשתיות צד שלישי.

1.2. תוכנית Pro — ₪960/חודש
  כל מה שכלול ב-Base, בנוסף:
  (א) שיחות קוליות עם AI: שיחות נכנסות ויוצאות עם טכנולוגיית שכפול קול, משולבות עם יומן התורים. המזמין מאשר לספק ליצור קול סינתטי על בסיס דגימות שיסופקו.
  (ב) עד 300 תורים בחודש.

1.3. תוכנית Enterprise — ₪1,270/חודש
  כל מה שכלול ב-Pro, בנוסף:
  (א) תורים ללא הגבלה.
  (ב) שיחות קוליות עם AI ללא הגבלה.
  (ג) תמיכה בעדיפות: מענה תוך 2 שעות עסקיות בימי עבודה.

2. שדרוג אוטומטי

2.1. אם המזמין יגיע למכסת התורים של התוכנית הנוכחית במהלך תקופת חיוב, המערכת תשדרג אוטומטית לתוכנית הבאה מתחילת תקופת החיוב הבאה.
2.2. הודעה על השדרוג תישלח ב-WhatsApp ו/או אימייל תוך 24 שעות.
2.3. התמחור של הרמה החדשה חל מתאריך החיוב הבא.
2.4. בחתימה על הסכם זה, המזמין מסכים במפורש לשדרוגים אוטומטיים ולתמחור המתעדכן בהתאם.
2.5. אם המזמין מבקש לחזור לרמה נמוכה יותר, ניתן לבקש שנמוך בהודעה מוקדמת של 30 יום, בתנאי שהשימוש תואם את מגבלות הרמה הנמוכה.

3. תמורה ותשלומים

3.1. דמי מנוי לפי רמה:
  - Base: ₪770/חודש
  - Pro: ₪960/חודש
  - Enterprise: ₪1,270/חודש
3.2. דמי הקמה: ₪0 (אפס). ללא דמי הקמה או הצטרפות.
3.3. תשלומים מעובדים חודשית באמצעות Cardcom. הספק אינו שומר פרטי כרטיס אשראי.
3.4. אחסון: עלות שנתית משתנה. עשויה להשתנות בהתאם לעלויות צד שלישי. ישולם תוך 7 ימים מדרישה.
3.5. דומיין: עלות שנתית משתנה. ישולם תוך 7 ימים מדרישה.
3.6. אי-תשלום יגרור השבתת האתר וכל סוכני ה-AI. מחיקה תוך 7 ימים וביטול ההסכם.
3.7. לא יינתן זיכוי על תשלומים שנתיים.

4. זמני מסירה

4.1. האתר יימסר תוך 48 שעות מקבלת חומרי העיצוב. סוכן ה-WhatsApp יופעל תוך 5 ימי עסקים מקבלת המידע העסקי וגישה לחשבון WhatsApp.
4.2. שיחות קוליות עם AI (Pro/Enterprise) יופעלו תוך 5 ימי עסקים מקבלת דגימות קול ותצורת היומן.

5. קניין רוחני ורישוי

5.1. רישיון שימוש לא בלעדי לתקופת ההסכם.
5.2. קוד המקור, קבצי PSD וזכויות הקניין הרוחני על עיצוב האתר הם קניין בלעדי של הספק.
5.3. לוגו, מותג ותכנים שסיפק המזמין הם קניינו הבלעדי ומשמשים אך ורק לצורך הסכם זה.
5.4. הדומיין בבעלות המזמין.
5.5. תצורת סוכן ה-WhatsApp שייכת למזמין ותועבר לבקשה בסיום ההסכם.
5.6. דגימות קול שסיפק המזמין נשארות קניינו. הספק רשאי לשמור מודלי קול סינתטיים רק לתקופת ההסכם.

6. מדיניות שימוש מקובל

6.1. אסור להשתמש באתר ובסוכני ה-AI לשליחת ספאם או אחסון חומרים בלתי חוקיים.
6.2. אסור להעלות תוכן פוגעני, מטעה או אסור על פי דין.
6.3. אסור להשתמש בשיחות קוליות עם AI לשיחות קרות לא רצויות, הטרדה או פרקטיקות מטעות.
6.4. הפרה מהווה הפרה יסודית המקנה לספק זכות לסיום מידי וחד-צדדי.

7. הגבלת אחריות

7.1. המזמין נושא באחריות בלעדית לכל תוכן באתר ולמידע בסוכני ה-AI.
7.2. הספק אינו אחראי לנזקים מתשובות AI עקב מידע שגוי או חלקי.
7.3. הספק אינו מתחייב לתוצאות מסחריות, מכירות או תשואה.
7.4. הספק אינו אחראי לכשלים של פלטפורמות צד שלישי (כולל WhatsApp/Meta) או כוח עליון.
7.5. בשום מקרה אחריות הספק לא תעלה על הסכום הכולל ששולם.

8. סיום הסכם

8.1. המזמין רשאי לבטל בהודעה מוקדמת בכתב של 30 יום.
8.2. הספק רשאי לבטל לאלתר בגין הפרת מדיניות השימוש.
8.3. הספק רשאי לבטל עקב אי-תשלום לאחר 7 ימי התראה.
8.4. עם הביטול האתר וכל סוכני ה-AI ירדו מהאוויר.
8.5. לא יינתן זיכוי על תשלום שנתי.
8.6. על-פי בקשה, יועברו קוד המקור (HTML/CSS/JS), נתוני ה-CRM, תצורת הסוכן ויומני שיחות קוליות. לא תינתן גישה לתשתית הפנימית.

9. שיפוט

הסכם זה כפוף לדין הישראלי. סמכות שיפוט בלעדית לבתי המשפט המוסמכים בתל אביב.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * RUSSIAN CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function RU(plan: PlanType): string {
  return `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ — САЙТ, CRM И ИИ-АГЕНТЫ
Arzac Studio — Подписка с 3 уровнями

Между: Arzac Studio (далее — «Исполнитель»)
И: Заказчик (далее — «Заказчик»)

Принимая во внимание, что Исполнитель разработал технологическую инфраструктуру, включая хостинг сайтов (SaaS), CRM, АИ-агента WhatsApp, голосовые вызовы с ИИ и инструменты на базе ИИ (далее — «Система Мастер-Шаблона»);

И принимая во внимание, что Заказчик желает подключиться к Сервису;

Стороны договорились о нижеследующем:

1. Тарифные планы

Исполнитель предлагает три уровня подписки. Все планы без платы за подключение.

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

2.1. Если Заказчик достигнет лимита записей текущего плана в течение расчётного периода, система автоматически переведёт его на следующий уровень с начала следующего расчётного периода.
2.2. Уведомление об изменении направляется через WhatsApp и/или email в течение 24 часов.
2.3. Стоимость нового уровня применяется с даты следующего платежа.
2.4. Подписывая настоящий договор, Заказчик выражает согласие на автоматическое повышение уровня и соответствующее изменение стоимости.
2.5. Для перехода на более низкий уровень Заказчик может запросить понижение с уведомлением за 30 дней, при условии что использование соответствует лимитам более низкого уровня.

3. Стоимость и порядок оплаты

3.1. Абонентская плата по уровням:
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
Arzac Studio — Suscripcion de 3 Niveles

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnologica que incluye hosting de sitios web (SaaS), un sistema CRM, un agente de WhatsApp impulsado por IA, llamadas de voz con IA y herramientas con inteligencia artificial, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Servicio para visibilidad en internet, digitalizacion y gestion operativa de su negocio;

LAS PARTES ACUERDAN LO SIGUIENTE:

1. Planes de Servicio

El Proveedor ofrece tres niveles de suscripcion. Todos los planes incluyen cero costo de setup.

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

2.1. Si el Cliente alcanza el limite de reservas del plan actual durante un ciclo de facturacion, el sistema upgradeara automaticamente al siguiente nivel desde el proximo ciclo de facturacion.
2.2. El Cliente sera notificado del upgrade via WhatsApp y/o email dentro de las 24 horas.
2.3. El precio del nuevo nivel aplica desde la proxima fecha de facturacion.
2.4. Al firmar este acuerdo, el Cliente consiente expresamente a los upgrades automaticos de nivel y los ajustes de precio correspondientes descritos anteriormente.
2.5. Si el Cliente desea volver a un nivel inferior, puede solicitar un downgrade con 30 dias de aviso por escrito, efectivo en el proximo ciclo, siempre que su uso se encuentre dentro de los limites del nivel inferior.

3. Precio y Pago

3.1. Cuotas de suscripcion por nivel:
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
Arzac Studio — اشتراك بثلاث مستويات

بين: Arzac Studio (المشار إليه فيما يلي بـ "مزوّد الخدمة")
و: العميل (المشار إليه فيما يلي بـ "العميل")

حيث أن مزوّد الخدمة قام بتطوير بنية تقنية تشمل استضافة مواقع (SaaS)، نظام CRM، وكيل WhatsApp مدعوم بالذكاء الاصطناعي، مكالمات صوتية بالذكاء الاصطناعي وأدوات ذكية (يُشار إليها بـ "نظام القالب الرئيسي")؛

وحيث أن العميل يرغب بالاشتراك في الخدمة؛

اتفق الطرفان على ما يلي:

1. خطط الخدمة

يقدّم مزوّد الخدمة ثلاث مستويات اشتراك. جميع الخطط بدون رسوم تأسيس.

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

2.1. إذا وصل العميل إلى حدّ الحجوزات في خطته الحالية خلال دورة الفوترة، يُرقَّى تلقائياً إلى المستوى التالي من بداية الدورة التالية.
2.2. يُخطَر العميل بالترقية عبر WhatsApp و/أو البريد الإلكتروني خلال 24 ساعة.
2.3. يسري تسعير المستوى الجديد من تاريخ الفوترة التالي.
2.4. بتوقيع هذه الاتفاقية، يوافق العميل صراحةً على الترقيات التلقائية وتعديلات الأسعار المقابلة.
2.5. للعودة إلى مستوى أدنى، يمكن للعميل طلب التخفيض بإشعار مسبق من 30 يوماً، شرط أن يكون استخدامه ضمن حدود المستوى الأدنى.

3. التسعير والدفع

3.1. رسوم الاشتراك حسب المستوى:
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
