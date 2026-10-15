import { MONTHLY_AMOUNT } from "./pricing.ts";

export type ContractLang = "en" | "es" | "ru" | "he" | "ar";

/**
 * v9.0 (Liam, 2026-10-15): un solo plan — web + CRM + notificaciones por email — por una cuota mensual fija que lo
 * cubre todo (sin alta, sin hosting ni dominio aparte). El primer mes se cobra al aceptar y cubre un mes entero; el
 * cliente cancela cuando quiere, rige ese día, y se le devuelve la parte no usada del mes en proporción a los días.
 * WhatsApp, IA y voz son servicios opcionales a cotizar aparte, sin plazo de activación. Sin niveles ni subida
 * automática de precio. v8.0 (2026-09-12) llevaba alta negociable 1000–1500, hosting y dominio anuales y aviso de 30 días.
 * Cambiar cifras o cláusulas = nueva versión.
 */
const CONTRACT_VERSION = "9.0";

const fmt = (n: number, lang: ContractLang): string => {
  const sep = lang === "es" ? "." : lang === "ru" ? " " : ",";
  return "₪" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
};

/* ═══════════════════════════════════════════════════════════════════════════
 * ENGLISH CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function EN(monthly: string): string {
  return `SERVICE AGREEMENT — WEBSITE, CRM & EMAIL NOTIFICATIONS
Arzac Studio — Subscription

Between: Arzac Studio (hereinafter: "the Provider")
And: The Client (hereinafter: "the Client")

WHEREAS the Provider has developed a technological infrastructure including website hosting (SaaS), a CRM system, automated email notifications, maintenance and storage (the "Master Template System");

AND WHEREAS the Client wishes to subscribe to the Service for online visibility, digitalisation, and business management;

THE PARTIES AGREE AS FOLLOWS:

1. The Service (single plan)

1.1. Custom website using the Master Template System, including landing page, services, gallery and contact page.
1.2. Online visibility: presence on the internet, domain purchase and annual renewal.
1.3. Micro-CRM: management dashboard for customers, leads and online bookings.
1.4. Email notifications: automated notifications to the business owner and to customers/leads (booking confirmations, cancellations, contact requests). Optionally, to staff members.
1.5. Ongoing maintenance and technical support: content updates, bug fixes.
1.6. Website hosting on third-party infrastructure.

2. Optional Services (not included)

2.1. The following are NOT part of this agreement and are quoted separately, on request, under a separate written quote: AI-powered WhatsApp agent, AI assistant/chatbot, AI voice calls, WhatsApp notifications.
2.2. No activation deadline applies to optional services unless agreed in writing in their own quote.
2.3. This agreement contains no service tiers and no automatic upgrades or automatic price changes.

3. Pricing & Payment

3.1. Subscription fee: ${monthly} per month, fixed. It covers everything in section 1, including the creation of the website and the CRM, hosting and the domain. There is no setup fee and no other charge.
3.2. The first month is charged when the Client accepts this agreement and covers one full month from that date. Each following month is charged on the same date.
3.3. Payments are processed via Cardcom, Israel's payment processor. The Provider never stores the Client's card details.
3.4. Late payment will result in the website and the CRM being suspended. Permanent deletion occurs 7 days after the missed payment and this agreement is terminated.

4. Delivery Timeline

4.1. A functional website is delivered within 48 hours of receiving the Client's design materials.

5. Intellectual Property & Licensing

5.1. The Client receives a non-exclusive licence for the duration of this agreement.
5.2. Source code, design files, and all IP rights to the website design remain the sole property of the Provider.
5.3. Logos, brand assets, and content provided by the Client remain the Client's exclusive IP and are used by the Provider solely for this agreement.
5.4. The domain name is owned by the Client.
5.5. CRM data entered by the Client belongs to the Client and will be provided upon request at termination.

6. Acceptable Use Policy

6.1. The website and the CRM may not be used to send spam or store illegal material.
6.2. Uploading or configuring offensive, misleading, or legally prohibited content is strictly prohibited.
6.3. Breach of this section constitutes a material breach entitling the Provider to terminate services immediately and unilaterally.

7. Limitation of Liability

7.1. The Client bears sole responsibility for all content on the website and all information entered in the CRM.
7.2. The Provider does not guarantee any commercial results, sales, or financial returns.
7.3. The Provider is not liable for failures caused by third-party platforms (hosting, domain registrars, email providers) or force majeure.
7.4. In no event shall the Provider's liability exceed the total amount paid under this agreement.

8. Termination

8.1. The Client may cancel at any time by written notice. The cancellation takes effect on the day it is received.
8.2. When the Client cancels, the Provider refunds the unused part of the month already paid, in proportion to the days left: for example, cancelling on day 12 of a 30-day month refunds 18/30 of the monthly fee.
8.3. The Provider may terminate immediately for breach of the Acceptable Use Policy.
8.4. The Provider may terminate for non-payment after 7 days' written notice.
8.5. Upon termination the website and the CRM will be taken offline.
8.6. Upon request, the Provider will deliver the website source code (HTML/CSS/JS) and the Client's CRM data. No access to internal infrastructure will be granted.

9. Governing Law & Jurisdiction

This agreement is governed by Israeli law. Exclusive jurisdiction: competent courts of the Tel Aviv district.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * HEBREW CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function HE(monthly: string): string {
  return `הסכם מתן שירות בניית אתרים, תחזוקה, אירוח, מערכת CRM והתראות במייל

שנערך ונחתם ביום _____ לחודש _____ שנת _____

בין: _____ (ח"פ/ע.מ: _____), מרח' _____, טלפון: _____, דוא"ל: _____ (להלן: "החברה")

לבין: חברת _____ (ח"פ: _____), ו/או _____ ת.ז: _____, מרח' _____, טלפון: _____, דוא"ל: _____ (להלן: "המזמין")

הואיל והחברה פיתחה תשתית טכנולוגית הכוללת אירוח אתרי אינטרנט (SaaS), מערכת ניהול לקוחות (CRM), התראות אוטומטיות בדואר אלקטרוני וכלים נלווים (להלן: "מערכת תבנית מאסטר");

והואיל והמזמין מעוניין לרכוש מהחברה שירות לצורך נוכחות באינטרנט, דיגיטציה וניהול תפעולי של עסקו;

לפיכך הוסכם, הותנה והוצהר בין הצדדים כדלקמן:

השירותים (תוכנית אחת)

1. פיתוח "אתר אישי" באמצעות מערכת תבנית מאסטר — החברה תפתח עבור המזמין אתר אינטרנט מותאם אישית על בסיס מערכת תבנית מאסטר, בהתאם לניש העסקי של המזמין ולחומרי העיצוב שיסופקו על ידו.

2. נראות באינטרנט — נוכחות דיגיטלית ברשת האינטרנט, לרבות רכישת דומיין וחידושו השנתי.

3. מערכת מיקרו CRM — לוח ניהול דיגיטלי ללקוחות, לידים ותורים אונליין.

4. התראות בדואר אלקטרוני — הודעות אוטומטיות לבעל העסק וללקוחות/לידים (אישורי תורים, ביטולים, פניות מהאתר). לפי בקשת המזמין, גם לאנשי צוות.

5. תחזוקה שוטפת — עדכוני תוכן, תיקון תקלות ותמיכה טכנית.

6. אחסון לאתר — אחסון האתר על גבי תשתיות צד שלישי.

7. דומיין — רכישת שם מתחם (דומיין) עבור המזמין וחידושו השנתי.

שירותים אופציונליים (אינם כלולים)

8. השירותים הבאים אינם חלק מהסכם זה ויוצעו לפי בקשת המזמין בהצעת מחיר נפרדת ובכתב: סוכן WhatsApp מבוסס בינה מלאכותית, עוזר/צ׳אטבוט בינה מלאכותית, שיחות קוליות עם בינה מלאכותית, התראות WhatsApp.

9. לשירותים האופציונליים לא חל מועד הפעלה אלא אם הוסכם בכתב בהצעת המחיר שלהם.

10. הסכם זה אינו כולל תוכניות ברמות שונות, שדרוג אוטומטי או שינוי מחיר אוטומטי.

התמורה

11. דמי מנוי חודשיים: ${monthly} לחודש, סכום קבוע. דמי המנוי כוללים את כל השירותים המפורטים בסעיפים 1 עד 7, לרבות בניית האתר ומערכת ה-CRM, האחסון והדומיין. אין דמי הקמה ואין כל תשלום נוסף.

12. החודש הראשון ייגבה עם אישור הסכם זה על ידי המזמין ויכסה חודש מלא מאותו תאריך. כל חודש נוסף ייגבה באותו תאריך.

13. התשלומים יבוצעו באמצעות מערכת הסליקה Cardcom. החברה אינה שומרת פרטי כרטיס אשראי של המזמין.

14. לא שולמה התמורה במועדה, יושבתו האתר ומערכת ה-CRM. אם לא שולמה התמורה תוך 7 ימים ממועד התשלום, יימחק האתר לצמיתות ויבוטל הסכם זה.

זמנים

15. אתר אינטרנט פונקציונלי יימסר תוך 48 שעות ממועד קבלת חומרי העיצוב מהמזמין.

זכויות / קניין רוחני ורישוי

16. המזמין יקבל רישיון שימוש לא בלעדי, שאינו ניתן להעברה, אך ורק לתקופת ההסכם.

17. קוד המקור, קבצי העיצוב וכל זכויות הקניין הרוחני על עיצוב האתר הם ויישארו קניינה הבלעדי של החברה. המזמין מקבל רישיון שימוש באתר בלבד.

18. לוגו, סימן מסחרי וכל תוכן שסיפק המזמין לחברה הם קניינו הבלעדי של המזמין. החברה תשתמש בהם אך ורק לצורך הסכם זה.

19. שם המתחם (דומיין) הוא בבעלות המזמין.

20. נתוני ה-CRM שהוזנו על ידי המזמין שייכים למזמין ויועברו לבקשתו עם סיום ההסכם.

מדיניות שימוש מקובל

21. אין להשתמש באתר ובמערכת ה-CRM לשליחת דואר זבל (ספאם) או לאחסון חומרים בלתי חוקיים.

22. אין להעלות או לפרסם תוכן פוגעני, מטעה, אסור על פי דין או הפוגע בזכויות צד שלישי.

23. הפרת מדיניות שימוש מקובל מהווה הפרה יסודית של הסכם זה, המקנה לחברה את הזכות לסיים את ההסכם לאלתר ובאופן חד-צדדי, ללא כל הודעה מוקדמת.

הגבלת אחריות

24. כל תוכן המועלה לאתר וכל מידע המוזן למערכת ה-CRM הוא באחריותו הבלעדית של המזמין.

25. החברה אינה מתחייבת לתוצאות מסחריות, מכירות, הכנסות או כל תשואה כלכלית אחרת.

26. החברה אינה אחראית לכשלים, תקלות או הפסקות שירות הנובעים מפלטפורמות צד שלישי (ספקי אחסון, רשמי דומיינים, ספקי דוא"ל וכיוצא בזה) או מאירועי כוח עליון.

27. בכל מקרה, סך אחריותה הכוללת של החברה על פי הסכם זה לא תעלה על הסכום הכולל ששולם בפועל על ידי המזמין לחברה במסגרת הסכם זה.

סיום / ביטול הסכם

28. המזמין רשאי לבטל את ההסכם בכל עת בהודעה בכתב. הביטול נכנס לתוקף ביום קבלת ההודעה.

29. ביטל המזמין את ההסכם, תחזיר לו החברה את החלק שלא נוצל מהחודש ששולם, באופן יחסי לימים שנותרו: למשל, ביטול ביום ה-12 של חודש בן 30 יום מזכה בהחזר של 18/30 מדמי המנוי.

30. החברה רשאית לבטל את ההסכם לאלתר ובאופן חד-צדדי במקרה של הפרת מדיניות השימוש המקובל על ידי המזמין, ללא כל הודעה מוקדמת.

31. החברה רשאית לבטל את ההסכם בגין אי-תשלום, בהודעה מוקדמת בכתב של 7 ימים.

32. עם סיום ההסכם, מכל סיבה שהיא, האתר ומערכת ה-CRM יורדו מהאוויר, והמזמין יאבד את הנראות באינטרנט.

33. עם סיום ההסכם, לבקשת המזמין בכתב: יועברו קוד המקור של האתר (HTML, CSS, JS) ונתוני ה-CRM שנאספו במהלך תקופת השירות. לא תינתן גישה לכלים פנימיים של החברה, למערכת תבנית מאסטר או לתשתית הפנימית.

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

function RU(monthly: string): string {
  return `ДОГОВОР НА ОКАЗАНИЕ УСЛУГ — САЙТ, CRM И EMAIL-УВЕДОМЛЕНИЯ
Arzac Studio — Подписка

Между: Arzac Studio (далее — «Исполнитель»)
И: Заказчик (далее — «Заказчик»)

Принимая во внимание, что Исполнитель разработал технологическую инфраструктуру, включая хостинг сайтов (SaaS), CRM, автоматические email-уведомления, обслуживание и хранение данных (далее — «Система Мастер-Шаблона»);

И принимая во внимание, что Заказчик желает подключиться к Сервису;

Стороны договорились о нижеследующем:

1. Услуга (единый план)

1.1. Персональный сайт на основе Мастер-Шаблона, включая лендинг, услуги, галерею и контакты.
1.2. Интернет-присутствие: видимость в сети, покупка и ежегодное продление домена.
1.3. Микро-CRM: панель управления клиентами, лидами и онлайн-записями.
1.4. Email-уведомления: автоматические уведомления владельцу бизнеса и клиентам/лидам (подтверждения записи, отмены, обращения с сайта). По желанию — сотрудникам.
1.5. Техническое обслуживание и поддержка: обновление контента, исправление ошибок.
1.6. Хостинг на сторонней инфраструктуре.

2. Дополнительные услуги (не включены)

2.1. Следующие услуги НЕ входят в настоящий договор и предоставляются по запросу по отдельному письменному предложению: ИИ-агент WhatsApp, ИИ-ассистент/чатбот, голосовые вызовы с ИИ, WhatsApp-уведомления.
2.2. Срок активации дополнительных услуг не установлен, если иное не согласовано письменно в их предложении.
2.3. Настоящий договор не содержит тарифных уровней, автоматических повышений или автоматического изменения цены.

3. Стоимость и порядок оплаты

3.1. Абонентская плата: ${monthly} в месяц, фиксированная. Покрывает всё, что указано в разделе 1, включая создание сайта и CRM, хостинг и домен. Платы за подключение и других платежей нет.
3.2. Первый месяц оплачивается при принятии договора и покрывает полный месяц с этой даты. Каждый следующий месяц списывается в ту же дату.
3.3. Платежи обрабатываются через Cardcom. Исполнитель не хранит данные карт.
3.4. Просрочка оплаты повлечёт остановку сайта и CRM. Удаление через 7 дней, расторжение договора.

4. Сроки исполнения

4.1. Сайт передаётся в течение 48 часов после получения дизайн-материалов.

5. Интеллектуальная собственность и лицензирование

5.1. Неисключительная лицензия на срок действия договора.
5.2. Исходный код, файлы дизайна и права на дизайн — собственность Исполнителя.
5.3. Логотип, бренд и контент Заказчика — его исключительная собственность.
5.4. Доменное имя принадлежит Заказчику.
5.5. Данные CRM, внесённые Заказчиком, принадлежат Заказчику и передаются по запросу при расторжении.

6. Политика допустимого использования

6.1. Запрещается использовать сайт и CRM для спама или хранения незаконных материалов.
6.2. Запрещается размещать оскорбительный, вводящий в заблуждение или противоправный контент.
6.3. Нарушение даёт Исполнителю право немедленного одностороннего расторжения.

7. Ограничение ответственности

7.1. Заказчик несёт исключительную ответственность за контент сайта и данные в CRM.
7.2. Коммерческие результаты не гарантируются.
7.3. Исполнитель не отвечает за сбои сторонних платформ (хостинг, регистраторы доменов, почтовые провайдеры) или форс-мажор.
7.4. Ответственность Исполнителя не превышает сумму, уплаченную по договору.

8. Расторжение договора

8.1. Заказчик вправе расторгнуть договор в любой момент письменным уведомлением. Расторжение вступает в силу в день получения уведомления.
8.2. При расторжении Заказчиком Исполнитель возвращает неиспользованную часть оплаченного месяца пропорционально оставшимся дням: например, при отмене на 12-й день 30-дневного месяца возвращается 18/30 абонентской платы.
8.3. Исполнитель вправе расторгнуть немедленно при нарушении политики использования.
8.4. Исполнитель вправе расторгнуть при неоплате после 7-дневного предупреждения.
8.5. После расторжения сайт и CRM деактивируются.
8.6. По запросу передаются исходный код сайта и данные CRM. Доступ к инфраструктуре не предоставляется.

9. Применимое право и юрисдикция

Договор регулируется законодательством Израиля. Исключительная юрисдикция: суды округа Тель-Авива.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SPANISH CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function ES(monthly: string): string {
  return `ACUERDO DE SERVICIOS — SITIO WEB, CRM Y NOTIFICACIONES POR EMAIL
Arzac Studio — Suscripción

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnológica que incluye hosting de sitios web (SaaS), un sistema CRM, notificaciones automáticas por email, mantenimiento y almacenamiento (el "Sistema de Plantilla Maestra");

Y considerando que el Cliente desea suscribirse al Servicio para visibilidad en internet, digitalización y gestión operativa de su negocio;

LAS PARTES ACUERDAN LO SIGUIENTE:

1. El Servicio (plan único)

1.1. Sitio web personalizado usando el Sistema de Plantilla Maestra, incluyendo landing, servicios, galería y contacto.
1.2. Visibilidad online: presencia en internet, compra de dominio y renovación anual.
1.3. Micro-CRM: panel de gestión de clientes, leads y reservas online.
1.4. Notificaciones por email: avisos automáticos al dueño del negocio y a clientes/leads (confirmaciones de reserva, cancelaciones, consultas desde la web). Opcionalmente, al staff.
1.5. Mantenimiento continuo y soporte técnico: actualizaciones de contenido, corrección de errores.
1.6. Hosting en infraestructura de terceros.

2. Servicios opcionales (no incluidos)

2.1. Los siguientes servicios NO forman parte de este acuerdo y se cotizan aparte, a pedido, mediante presupuesto escrito: agente de WhatsApp con IA, asistente/chatbot con IA, llamadas de voz con IA, notificaciones por WhatsApp.
2.2. Los servicios opcionales no tienen plazo de activación salvo que se acuerde por escrito en su propio presupuesto.
2.3. Este acuerdo no contiene niveles de servicio ni upgrades automáticos ni cambios automáticos de precio.

3. Precio y Pago

3.1. Cuota de suscripción: ${monthly} por mes, fija. Cubre todo lo de la sección 1, incluida la creación del sitio web y del CRM, el hosting y el dominio. No hay alta ni ningún otro cargo.
3.2. El primer mes se cobra cuando el Cliente acepta este acuerdo y cubre un mes completo desde esa fecha. Cada mes siguiente se cobra en la misma fecha.
3.3. Los pagos se procesan vía Cardcom, procesador de pagos israelí. El Proveedor nunca almacena los datos de tarjeta del Cliente.
3.4. La falta de pago resultará en la suspensión del sitio web y del CRM. Eliminación permanente 7 días después del impago y rescisión del acuerdo.

4. Plazos de Entrega

4.1. Un sitio web funcional se entrega dentro de las 48 horas posteriores a la recepción de los materiales de diseño.

5. Propiedad Intelectual y Licencias

5.1. El Cliente recibe una licencia no exclusiva por la duración de este acuerdo.
5.2. El código fuente, archivos de diseño y todos los derechos de PI sobre el diseño del sitio web son propiedad exclusiva del Proveedor.
5.3. Logos, activos de marca y contenido del Cliente son su PI exclusiva, utilizados únicamente para este acuerdo.
5.4. El nombre de dominio es propiedad del Cliente.
5.5. Los datos del CRM cargados por el Cliente le pertenecen y serán entregados a solicitud al momento de la rescisión.

6. Política de Uso Aceptable

6.1. El sitio web y el CRM no pueden ser utilizados para enviar spam o almacenar material ilegal.
6.2. Está estrictamente prohibido subir contenido ofensivo, engañoso o legalmente prohibido.
6.3. La violación de esta sección constituye un incumplimiento material que otorga al Proveedor el derecho de rescindir de forma inmediata y unilateral.

7. Limitación de Responsabilidad

7.1. El Cliente asume responsabilidad exclusiva por todo el contenido del sitio y los datos cargados en el CRM.
7.2. El Proveedor no garantiza resultados comerciales, ventas ni retornos financieros.
7.3. El Proveedor no es responsable por fallas de plataformas de terceros (hosting, registradores de dominio, proveedores de email) o fuerza mayor.
7.4. En ningún caso la responsabilidad del Proveedor excederá el monto total pagado bajo este acuerdo.

8. Rescisión

8.1. El Cliente puede cancelar en cualquier momento con un aviso por escrito. La cancelación rige desde el día en que se recibe.
8.2. Cuando el Cliente cancela, el Proveedor le devuelve la parte no usada del mes ya pagado, en proporción a los días que faltan: por ejemplo, cancelar el día 12 de un mes de 30 días devuelve 18/30 de la cuota.
8.3. El Proveedor puede rescindir inmediatamente por violación de la Política de Uso Aceptable.
8.4. El Proveedor puede rescindir por falta de pago con 7 días de aviso por escrito.
8.5. Tras la rescisión, el sitio web y el CRM serán dados de baja.
8.6. A solicitud, el Proveedor entregará el código fuente del sitio (HTML/CSS/JS) y los datos del CRM. No se otorgará acceso a la infraestructura interna.

9. Ley Aplicable y Jurisdicción

Este acuerdo se rige por la ley israelí. Jurisdicción exclusiva: tribunales competentes del distrito de Tel Aviv.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * ARABIC CONTRACT
 * ═══════════════════════════════════════════════════════════════════════════ */

function AR(monthly: string): string {
  return `اتفاقية تقديم خدمات — موقع إلكتروني، CRM وإشعارات بريد إلكتروني
Arzac Studio — الاشتراك

بين: Arzac Studio (المشار إليه فيما يلي بـ "مزوّد الخدمة")
و: العميل (المشار إليه فيما يلي بـ "العميل")

حيث أن مزوّد الخدمة قام بتطوير بنية تقنية تشمل استضافة مواقع (SaaS)، نظام CRM، إشعارات بريد إلكتروني آلية، صيانة وتخزين (يُشار إليها بـ "نظام القالب الرئيسي")؛

وحيث أن العميل يرغب بالاشتراك في الخدمة؛

اتفق الطرفان على ما يلي:

1. الخدمة (خطة واحدة)

1.1. موقع إلكتروني مخصص باستخدام نظام القالب الرئيسي، يشمل صفحة هبوط، خدمات، معرض صور وصفحة تواصل.
1.2. حضور رقمي: ظهور على الإنترنت، شراء نطاق وتجديد سنوي.
1.3. نظام CRM مصغّر: لوحة إدارة للعملاء والمهتمّين والحجوزات عبر الإنترنت.
1.4. إشعارات بريد إلكتروني: إشعارات تلقائية لصاحب العمل وللعملاء/المهتمّين (تأكيد الحجز، الإلغاء، طلبات التواصل). اختيارياً لأعضاء الفريق.
1.5. صيانة مستمرة ودعم فني: تحديثات المحتوى، إصلاح الأخطاء.
1.6. استضافة على بنية تحتية لطرف ثالث.

2. خدمات اختيارية (غير مشمولة)

2.1. الخدمات التالية ليست جزءاً من هذه الاتفاقية وتُقدَّم عند الطلب بعرض سعر خطي منفصل: وكيل WhatsApp بالذكاء الاصطناعي، مساعد/شات بوت ذكي، مكالمات صوتية بالذكاء الاصطناعي، إشعارات WhatsApp.
2.2. لا يسري موعد تفعيل على الخدمات الاختيارية ما لم يُتفق عليه خطياً في عرض السعر الخاص بها.
2.3. لا تتضمن هذه الاتفاقية مستويات خدمة ولا ترقيات تلقائية ولا تغييرات تلقائية في السعر.

3. التسعير والدفع

3.1. رسوم الاشتراك: ${monthly} شهرياً، ثابتة. تشمل كل ما ورد في البند 1، بما في ذلك إنشاء الموقع ونظام CRM والاستضافة والنطاق. لا توجد رسوم تأسيس ولا أي رسوم أخرى.
3.2. يُحصَّل الشهر الأول عند قبول العميل لهذه الاتفاقية ويغطي شهراً كاملاً من ذلك التاريخ. ويُحصَّل كل شهر تالٍ في التاريخ نفسه.
3.3. تُعالج المدفوعات عبر Cardcom. لا يخزّن مزوّد الخدمة بيانات البطاقة.
3.4. التأخّر في الدفع يؤدي إلى تعليق الموقع ونظام CRM. الحذف خلال 7 أيام وإنهاء الاتفاقية.

4. مواعيد التسليم

4.1. يُسلَّم الموقع خلال 48 ساعة من استلام مواد التصميم.

5. الملكية الفكرية والترخيص

5.1. ترخيص استخدام غير حصري طوال مدة الاتفاقية.
5.2. الكود المصدري وملفات التصميم وحقوق الملكية الفكرية ملك حصري لمزوّد الخدمة.
5.3. الشعار والعلامة التجارية والمحتوى المقدّم من العميل ملكيته الحصرية.
5.4. اسم النطاق ملك العميل.
5.5. بيانات CRM التي يُدخلها العميل ملكه وتُسلَّم عند الطلب عند الإنهاء.

6. سياسة الاستخدام المقبول

6.1. يُحظر استخدام الموقع ونظام CRM لإرسال رسائل مزعجة أو تخزين مواد غير قانونية.
6.2. يُحظر رفع محتوى مسيء أو مضلّل أو محظور قانونياً.
6.3. يُشكّل الانتهاك خرقاً جوهرياً يمنح مزوّد الخدمة حقّ الإنهاء الفوري والأحادي.

7. تحديد المسؤولية

7.1. يتحمّل العميل المسؤولية الكاملة عن محتوى الموقع والبيانات في CRM.
7.2. لا يضمن مزوّد الخدمة أيّ نتائج تجارية أو مالية.
7.3. مزوّد الخدمة غير مسؤول عن أعطال منصات الطرف الثالث (الاستضافة، مسجّلي النطاقات، مزوّدي البريد) أو القوة القاهرة.
7.4. لا تتجاوز مسؤولية مزوّد الخدمة بأيّ حال المبلغ الإجمالي المدفوع.

8. إنهاء الاتفاقية

8.1. يحقّ للعميل الإلغاء في أي وقت بإشعار خطي. يسري الإلغاء من يوم استلام الإشعار.
8.2. عند إلغاء العميل، يردّ مزوّد الخدمة الجزء غير المستخدم من الشهر المدفوع بنسبة الأيام المتبقية: مثلاً، الإلغاء في اليوم 12 من شهر من 30 يوماً يُرجع 18/30 من رسوم الاشتراك.
8.3. يحقّ لمزوّد الخدمة الإنهاء الفوري في حال انتهاك سياسة الاستخدام.
8.4. يحقّ لمزوّد الخدمة الإنهاء لعدم الدفع بعد إشعار من 7 أيام.
8.5. بعد الإنهاء يُوقَف الموقع ونظام CRM.
8.6. يُسلَّم عند الطلب الكود المصدري للموقع وبيانات CRM. لا يُمنح وصول إلى البنية التحتية.

9. القانون المعمول به والاختصاص القضائي

تخضع هذه الاتفاقية للقانون الإسرائيلي. الاختصاص القضائي الحصري: المحاكم المختصة في منطقة تل أبيب.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * LOOKUP
 * ═══════════════════════════════════════════════════════════════════════════ */

const contractFns: Record<ContractLang, (monthly: string) => string> = {
  en: EN,
  he: HE,
  ru: RU,
  es: ES,
  ar: AR,
};

export function getContract(lang: ContractLang): { text: string; version: string; monthlyAmount: number } {
  const fn = contractFns[lang] ?? contractFns.en;
  return { text: fn(fmt(MONTHLY_AMOUNT, lang)), version: CONTRACT_VERSION, monthlyAmount: MONTHLY_AMOUNT };
}

export function isContractLang(lang: string): lang is ContractLang {
  return lang === "en" || lang === "es" || lang === "ru" || lang === "he" || lang === "ar";
}
