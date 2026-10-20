import { MONTHLY_AMOUNT } from "./pricing.ts";

export type ContractLang = "en" | "es" | "ru" | "he" | "ar";

/**
 * v9.0 (Liam, 2026-10-15): un solo plan — web + CRM + notificaciones por email — por una cuota mensual fija que lo
 * cubre todo (sin alta, sin hosting ni dominio aparte). El primer mes se cobra al aceptar y cubre un mes entero; el
 * cliente cancela cuando quiere, rige ese día, y se le devuelve la parte no usada del mes en proporción a los días.
 * WhatsApp, IA y voz no se ofrecen (Liam, 2026-10-20: fuera de la oferta y del contrato). Sin niveles ni subida
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
1.7. Logo and texts: if the Client has no logo, the Provider designs one; the Provider writes the website texts, in the languages of the website.

1.8. This agreement contains no service tiers and no automatic upgrades or automatic price changes.

2. Pricing & Payment

2.1. Subscription fee: ${monthly} per month, fixed. It covers everything in section 1, including the creation of the website and the CRM, hosting and the domain. There is no setup fee and no other charge.
2.2. The first month is charged when the Client accepts this agreement and covers one full month from that date. Each following month is charged on the same date.
2.3. Payments are processed via Cardcom, Israel's payment processor. The Provider never stores the Client's card details.
2.4. Late payment will result in the website and the CRM being suspended. Permanent deletion occurs 7 days after the missed payment and this agreement is terminated.

3. Delivery Timeline

3.1. A functional website is delivered within 48 hours of receiving the Client's design materials.

4. Intellectual Property & Licensing

4.1. The Client receives a non-exclusive licence for the duration of this agreement.
4.2. Source code, design files, and all IP rights to the website design remain the sole property of the Provider.
4.3. Logos, brand assets, and content provided by the Client remain the Client's exclusive IP and are used by the Provider solely for this agreement.
4.4. The domain name is owned by the Client.
4.5. CRM data entered by the Client belongs to the Client and will be provided upon request at termination.

5. Acceptable Use Policy

5.1. The website and the CRM may not be used to send spam or store illegal material.
5.2. Uploading or configuring offensive, misleading, or legally prohibited content is strictly prohibited.
5.3. Breach of this section constitutes a material breach entitling the Provider to terminate services immediately and unilaterally.

6. Limitation of Liability

6.1. The Client bears sole responsibility for all content on the website and all information entered in the CRM.
6.2. The Provider does not guarantee any commercial results, sales, or financial returns.
6.3. The Provider is not liable for failures caused by third-party platforms (hosting, domain registrars, email providers) or force majeure.
6.4. In no event shall the Provider's liability exceed the total amount paid under this agreement.

7. Termination

7.1. The Client may cancel at any time by written notice. The cancellation takes effect on the day it is received.
7.2. When the Client cancels, the Provider refunds the unused part of the month already paid, in proportion to the days left: for example, cancelling on day 12 of a 30-day month refunds 18/30 of the monthly fee.
7.3. The Provider may terminate immediately for breach of the Acceptable Use Policy.
7.4. The Provider may terminate for non-payment after 7 days' written notice.
7.5. Upon termination the website and the CRM will be taken offline.
7.6. After the Client cancels, the Client's data is deleted within 30 days; until then, the Client may request it as set out in 7.7.
7.7. Upon request, the Provider will deliver the website source code (HTML/CSS/JS) and the Client's CRM data. No access to internal infrastructure will be granted.

8. Governing Law & Jurisdiction

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

8. לוגו וטקסטים — אם אין למזמין לוגו, החברה תעצב לוגו; את הטקסטים של האתר תכתוב החברה, בשפות האתר.

9. הסכם זה אינו כולל תוכניות ברמות שונות, שדרוג אוטומטי או שינוי מחיר אוטומטי.

התמורה

10. דמי מנוי חודשיים: ${monthly} לחודש, סכום קבוע. דמי המנוי כוללים את כל השירותים המפורטים בסעיפים 1 עד 8, לרבות בניית האתר ומערכת ה-CRM, האחסון והדומיין. אין דמי הקמה ואין כל תשלום נוסף.

11. החודש הראשון ייגבה עם אישור הסכם זה על ידי המזמין ויכסה חודש מלא מאותו תאריך. כל חודש נוסף ייגבה באותו תאריך.

12. התשלומים יבוצעו באמצעות מערכת הסליקה Cardcom. החברה אינה שומרת פרטי כרטיס אשראי של המזמין.

13. לא שולמה התמורה במועדה, יושבתו האתר ומערכת ה-CRM. אם לא שולמה התמורה תוך 7 ימים ממועד התשלום, יימחק האתר לצמיתות ויבוטל הסכם זה.

זמנים

14. אתר אינטרנט פונקציונלי יימסר תוך 48 שעות ממועד קבלת חומרי העיצוב מהמזמין.

זכויות / קניין רוחני ורישוי

15. המזמין יקבל רישיון שימוש לא בלעדי, שאינו ניתן להעברה, אך ורק לתקופת ההסכם.

16. קוד המקור, קבצי העיצוב וכל זכויות הקניין הרוחני על עיצוב האתר הם ויישארו קניינה הבלעדי של החברה. המזמין מקבל רישיון שימוש באתר בלבד.

17. לוגו, סימן מסחרי וכל תוכן שסיפק המזמין לחברה הם קניינו הבלעדי של המזמין. החברה תשתמש בהם אך ורק לצורך הסכם זה.

18. שם המתחם (דומיין) הוא בבעלות המזמין.

19. נתוני ה-CRM שהוזנו על ידי המזמין שייכים למזמין ויועברו לבקשתו עם סיום ההסכם.

מדיניות שימוש מקובל

20. אין להשתמש באתר ובמערכת ה-CRM לשליחת דואר זבל (ספאם) או לאחסון חומרים בלתי חוקיים.

21. אין להעלות או לפרסם תוכן פוגעני, מטעה, אסור על פי דין או הפוגע בזכויות צד שלישי.

22. הפרת מדיניות שימוש מקובל מהווה הפרה יסודית של הסכם זה, המקנה לחברה את הזכות לסיים את ההסכם לאלתר ובאופן חד-צדדי, ללא כל הודעה מוקדמת.

הגבלת אחריות

23. כל תוכן המועלה לאתר וכל מידע המוזן למערכת ה-CRM הוא באחריותו הבלעדית של המזמין.

24. החברה אינה מתחייבת לתוצאות מסחריות, מכירות, הכנסות או כל תשואה כלכלית אחרת.

25. החברה אינה אחראית לכשלים, תקלות או הפסקות שירות הנובעים מפלטפורמות צד שלישי (ספקי אחסון, רשמי דומיינים, ספקי דוא"ל וכיוצא בזה) או מאירועי כוח עליון.

26. בכל מקרה, סך אחריותה הכוללת של החברה על פי הסכם זה לא תעלה על הסכום הכולל ששולם בפועל על ידי המזמין לחברה במסגרת הסכם זה.

סיום / ביטול הסכם

27. המזמין רשאי לבטל את ההסכם בכל עת בהודעה בכתב. הביטול נכנס לתוקף ביום קבלת ההודעה.

28. ביטל המזמין את ההסכם, תחזיר לו החברה את החלק שלא נוצל מהחודש ששולם, באופן יחסי לימים שנותרו: למשל, ביטול ביום ה-12 של חודש בן 30 יום מזכה בהחזר של 18/30 מדמי המנוי.

29. החברה רשאית לבטל את ההסכם לאלתר ובאופן חד-צדדי במקרה של הפרת מדיניות השימוש המקובל על ידי המזמין, ללא כל הודעה מוקדמת.

30. החברה רשאית לבטל את ההסכם בגין אי-תשלום, בהודעה מוקדמת בכתב של 7 ימים.

31. עם סיום ההסכם, מכל סיבה שהיא, האתר ומערכת ה-CRM יורדו מהאוויר, והמזמין יאבד את הנראות באינטרנט.

32. ביטל המזמין את ההסכם, יימחקו נתוניו תוך 30 יום; עד אז רשאי המזמין לבקש אותם כמפורט בסעיף הבא.

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
1.7. Логотип и тексты: если у Заказчика нет логотипа, Исполнитель его разрабатывает; тексты сайта пишет Исполнитель, на языках сайта.

1.8. Настоящий договор не содержит тарифных уровней, автоматических повышений или автоматического изменения цены.

2. Стоимость и порядок оплаты

2.1. Абонентская плата: ${monthly} в месяц, фиксированная. Покрывает всё, что указано в разделе 1, включая создание сайта и CRM, хостинг и домен. Платы за подключение и других платежей нет.
2.2. Первый месяц оплачивается при принятии договора и покрывает полный месяц с этой даты. Каждый следующий месяц списывается в ту же дату.
2.3. Платежи обрабатываются через Cardcom. Исполнитель не хранит данные карт.
2.4. Просрочка оплаты повлечёт остановку сайта и CRM. Удаление через 7 дней, расторжение договора.

3. Сроки исполнения

3.1. Сайт передаётся в течение 48 часов после получения дизайн-материалов.

4. Интеллектуальная собственность и лицензирование

4.1. Неисключительная лицензия на срок действия договора.
4.2. Исходный код, файлы дизайна и права на дизайн — собственность Исполнителя.
4.3. Логотип, бренд и контент Заказчика — его исключительная собственность.
4.4. Доменное имя принадлежит Заказчику.
4.5. Данные CRM, внесённые Заказчиком, принадлежат Заказчику и передаются по запросу при расторжении.

5. Политика допустимого использования

5.1. Запрещается использовать сайт и CRM для спама или хранения незаконных материалов.
5.2. Запрещается размещать оскорбительный, вводящий в заблуждение или противоправный контент.
5.3. Нарушение даёт Исполнителю право немедленного одностороннего расторжения.

6. Ограничение ответственности

6.1. Заказчик несёт исключительную ответственность за контент сайта и данные в CRM.
6.2. Коммерческие результаты не гарантируются.
6.3. Исполнитель не отвечает за сбои сторонних платформ (хостинг, регистраторы доменов, почтовые провайдеры) или форс-мажор.
6.4. Ответственность Исполнителя не превышает сумму, уплаченную по договору.

7. Расторжение договора

7.1. Заказчик вправе расторгнуть договор в любой момент письменным уведомлением. Расторжение вступает в силу в день получения уведомления.
7.2. При расторжении Заказчиком Исполнитель возвращает неиспользованную часть оплаченного месяца пропорционально оставшимся дням: например, при отмене на 12-й день 30-дневного месяца возвращается 18/30 абонентской платы.
7.3. Исполнитель вправе расторгнуть немедленно при нарушении политики использования.
7.4. Исполнитель вправе расторгнуть при неоплате после 7-дневного предупреждения.
7.5. После расторжения сайт и CRM деактивируются.
7.6. После расторжения Заказчиком его данные удаляются в течение 30 дней; до этого Заказчик может запросить их, как указано в 7.7.
7.7. По запросу передаются исходный код сайта и данные CRM. Доступ к инфраструктуре не предоставляется.

8. Применимое право и юрисдикция

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
1.7. Logo y textos: si el Cliente no tiene logo, el Proveedor lo diseña; los textos del sitio web los escribe el Proveedor, en los idiomas del sitio.

1.8. Este acuerdo no contiene niveles de servicio ni upgrades automáticos ni cambios automáticos de precio.

2. Precio y Pago

2.1. Cuota de suscripción: ${monthly} por mes, fija. Cubre todo lo de la sección 1, incluida la creación del sitio web y del CRM, el hosting y el dominio. No hay alta ni ningún otro cargo.
2.2. El primer mes se cobra cuando el Cliente acepta este acuerdo y cubre un mes completo desde esa fecha. Cada mes siguiente se cobra en la misma fecha.
2.3. Los pagos se procesan vía Cardcom, procesador de pagos israelí. El Proveedor nunca almacena los datos de tarjeta del Cliente.
2.4. La falta de pago resultará en la suspensión del sitio web y del CRM. Eliminación permanente 7 días después del impago y rescisión del acuerdo.

3. Plazos de Entrega

3.1. Un sitio web funcional se entrega dentro de las 48 horas posteriores a la recepción de los materiales de diseño.

4. Propiedad Intelectual y Licencias

4.1. El Cliente recibe una licencia no exclusiva por la duración de este acuerdo.
4.2. El código fuente, archivos de diseño y todos los derechos de PI sobre el diseño del sitio web son propiedad exclusiva del Proveedor.
4.3. Logos, activos de marca y contenido del Cliente son su PI exclusiva, utilizados únicamente para este acuerdo.
4.4. El nombre de dominio es propiedad del Cliente.
4.5. Los datos del CRM cargados por el Cliente le pertenecen y serán entregados a solicitud al momento de la rescisión.

5. Política de Uso Aceptable

5.1. El sitio web y el CRM no pueden ser utilizados para enviar spam o almacenar material ilegal.
5.2. Está estrictamente prohibido subir contenido ofensivo, engañoso o legalmente prohibido.
5.3. La violación de esta sección constituye un incumplimiento material que otorga al Proveedor el derecho de rescindir de forma inmediata y unilateral.

6. Limitación de Responsabilidad

6.1. El Cliente asume responsabilidad exclusiva por todo el contenido del sitio y los datos cargados en el CRM.
6.2. El Proveedor no garantiza resultados comerciales, ventas ni retornos financieros.
6.3. El Proveedor no es responsable por fallas de plataformas de terceros (hosting, registradores de dominio, proveedores de email) o fuerza mayor.
6.4. En ningún caso la responsabilidad del Proveedor excederá el monto total pagado bajo este acuerdo.

7. Rescisión

7.1. El Cliente puede cancelar en cualquier momento con un aviso por escrito. La cancelación rige desde el día en que se recibe.
7.2. Cuando el Cliente cancela, el Proveedor le devuelve la parte no usada del mes ya pagado, en proporción a los días que faltan: por ejemplo, cancelar el día 12 de un mes de 30 días devuelve 18/30 de la cuota.
7.3. El Proveedor puede rescindir inmediatamente por violación de la Política de Uso Aceptable.
7.4. El Proveedor puede rescindir por falta de pago con 7 días de aviso por escrito.
7.5. Tras la rescisión, el sitio web y el CRM serán dados de baja.
7.6. Cuando el Cliente cancela, sus datos se borran dentro de los 30 días; hasta entonces puede pedirlos, como indica 7.7.
7.7. A solicitud, el Proveedor entregará el código fuente del sitio (HTML/CSS/JS) y los datos del CRM. No se otorgará acceso a la infraestructura interna.

8. Ley Aplicable y Jurisdicción

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
1.7. الشعار والنصوص: إذا لم يكن لدى العميل شعار، يصمّمه مزوّد الخدمة؛ ويكتب مزوّد الخدمة نصوص الموقع بلغات الموقع.

1.8. لا تتضمن هذه الاتفاقية مستويات خدمة ولا ترقيات تلقائية ولا تغييرات تلقائية في السعر.

2. التسعير والدفع

2.1. رسوم الاشتراك: ${monthly} شهرياً، ثابتة. تشمل كل ما ورد في البند 1، بما في ذلك إنشاء الموقع ونظام CRM والاستضافة والنطاق. لا توجد رسوم تأسيس ولا أي رسوم أخرى.
2.2. يُحصَّل الشهر الأول عند قبول العميل لهذه الاتفاقية ويغطي شهراً كاملاً من ذلك التاريخ. ويُحصَّل كل شهر تالٍ في التاريخ نفسه.
2.3. تُعالج المدفوعات عبر Cardcom. لا يخزّن مزوّد الخدمة بيانات البطاقة.
2.4. التأخّر في الدفع يؤدي إلى تعليق الموقع ونظام CRM. الحذف خلال 7 أيام وإنهاء الاتفاقية.

3. مواعيد التسليم

3.1. يُسلَّم الموقع خلال 48 ساعة من استلام مواد التصميم.

4. الملكية الفكرية والترخيص

4.1. ترخيص استخدام غير حصري طوال مدة الاتفاقية.
4.2. الكود المصدري وملفات التصميم وحقوق الملكية الفكرية ملك حصري لمزوّد الخدمة.
4.3. الشعار والعلامة التجارية والمحتوى المقدّم من العميل ملكيته الحصرية.
4.4. اسم النطاق ملك العميل.
4.5. بيانات CRM التي يُدخلها العميل ملكه وتُسلَّم عند الطلب عند الإنهاء.

5. سياسة الاستخدام المقبول

5.1. يُحظر استخدام الموقع ونظام CRM لإرسال رسائل مزعجة أو تخزين مواد غير قانونية.
5.2. يُحظر رفع محتوى مسيء أو مضلّل أو محظور قانونياً.
5.3. يُشكّل الانتهاك خرقاً جوهرياً يمنح مزوّد الخدمة حقّ الإنهاء الفوري والأحادي.

6. تحديد المسؤولية

6.1. يتحمّل العميل المسؤولية الكاملة عن محتوى الموقع والبيانات في CRM.
6.2. لا يضمن مزوّد الخدمة أيّ نتائج تجارية أو مالية.
6.3. مزوّد الخدمة غير مسؤول عن أعطال منصات الطرف الثالث (الاستضافة، مسجّلي النطاقات، مزوّدي البريد) أو القوة القاهرة.
6.4. لا تتجاوز مسؤولية مزوّد الخدمة بأيّ حال المبلغ الإجمالي المدفوع.

7. إنهاء الاتفاقية

7.1. يحقّ للعميل الإلغاء في أي وقت بإشعار خطي. يسري الإلغاء من يوم استلام الإشعار.
7.2. عند إلغاء العميل، يردّ مزوّد الخدمة الجزء غير المستخدم من الشهر المدفوع بنسبة الأيام المتبقية: مثلاً، الإلغاء في اليوم 12 من شهر من 30 يوماً يُرجع 18/30 من رسوم الاشتراك.
7.3. يحقّ لمزوّد الخدمة الإنهاء الفوري في حال انتهاك سياسة الاستخدام.
7.4. يحقّ لمزوّد الخدمة الإنهاء لعدم الدفع بعد إشعار من 7 أيام.
7.5. بعد الإنهاء يُوقَف الموقع ونظام CRM.
7.6. بعد إلغاء العميل، تُحذف بياناته خلال 30 يوماً؛ وحتى ذلك الحين يمكنه طلبها كما ورد في البند 7.7.
7.7. يُسلَّم عند الطلب الكود المصدري للموقع وبيانات CRM. لا يُمنح وصول إلى البنية التحتية.

8. القانون المعمول به والاختصاص القضائي

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
