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

const CONTRACT_ES = `Acuerdo de Servicios de Sitio Web, CRM y Agente WhatsApp

Entre: Arzac Studio (en adelante: "el Proveedor")
Y: El Cliente (en adelante: "el Cliente")

Considerando que el Proveedor ha desarrollado una infraestructura tecnológica que incluye hosting de sitios web (SaaS), sistema de reservas, sistema de gestión de clientes (CRM) y sistema de agente WhatsApp con inteligencia artificial, su mantenimiento y alojamiento (en adelante: "Sistema de Plantilla Maestra")

Y considerando que el Cliente desea contratar los servicios del Proveedor para recibir un "sitio web personal" en el Sistema de Plantilla Maestra para visibilidad en internet, digitalización y gestión operativa de su negocio. (en adelante: "el Sitio Web")

Por lo tanto, se ha acordado entre las partes lo siguiente:

1. Servicios:

Plan Web+CRM (₪790/mes):
- Desarrollo de un "sitio web personal" utilizando el Sistema de Plantilla Maestra.
- Visibilidad: presencia en internet y SEO.
- Sistema Micro CRM con IA: acceso a un panel de gestión personal incluyendo gestión de clientes, sistema de turnos/reservas, gestión de inventario/stock, sección de preguntas frecuentes editable.
- Soporte para 3 idiomas (hebreo, inglés, ruso).
- Mantenimiento continuo y soporte técnico: actualizaciones de contenido dinámico (imágenes, precios, textos), monitoreo técnico, corrección de errores, gestión de infraestructura. (Este acuerdo no incluye cambios de diseño estructural; dichos cambios requieren acuerdo separado con costo adicional.)
- Hosting del sitio web: en infraestructura de terceros a discreción del Proveedor.
- Dominio: compra, seguimiento y renovación anual para el Cliente.

Plan Completo (₪990/mes):
- Todo lo incluido en el plan Web+CRM.
- Agente WhatsApp con IA 24/7: respuestas automáticas personalizadas, captura de leads por WhatsApp, reserva de turnos por WhatsApp, integración completa con el CRM.

2. Compensación:
- Plan Web+CRM: ₪790 por mes, desde el día de activación.
- Plan Completo: ₪990 por mes, desde el día de activación.
- Hosting del sitio web: costo anual (sujeto a cambios de terceros), pagadero dentro de 7 días desde la solicitud.
- Dominio: costo anual (sujeto a cambios de terceros), pagadero dentro de 7 días desde la solicitud.
- La falta de pago oportuno resultará en la baja del sitio web; el sitio será eliminado dentro de 7 días del impago y este acuerdo será rescindido.

3. Plazos:
Entrega de la versión funcional dentro de 48 horas desde que el Cliente proporcione los detalles de diseño, tras el primer pago.

4. Derechos / Propiedad Intelectual y Licencias:
- Licencia otorgada al Cliente mientras se mantenga el pago y se cumplan los términos del acuerdo.
- Los derechos de autor comerciales y morales del código, archivos fuente y diseño pertenecen al Proveedor. Todos los módulos son propiedad del Proveedor; el Cliente recibe una licencia de uso únicamente mientras este acuerdo esté vigente.
- La propiedad intelectual del logo, marca y contenido del Cliente permanece siendo del Cliente y se utiliza exclusivamente para este acuerdo.
- La propiedad del nombre de dominio pertenece al Cliente.

5. Política de Uso Aceptable:
- Sin spam, materiales ilegales o contenido que viole la ley.
- Sin contenido que infrinja derechos de autor, contenido ofensivo o prohibido.
- La violación constituye incumplimiento fundamental que permite la rescisión inmediata unilateral.

6. Limitación de Responsabilidad:
- El contenido está bajo el control y responsabilidad exclusivos del Cliente.
- El Proveedor no garantiza resultados comerciales ni retorno económico.
- El Proveedor no es responsable por fallas de terceros o fuerza mayor.
- La responsabilidad nunca excederá el monto total pagado bajo este acuerdo.

7. Rescisión:
- Cliente: 30 días de aviso por escrito.
- Proveedor: rescisión inmediata por violación de políticas.
- Proveedor: 7 días de aviso por escrito por falta de pago.
- Después de la rescisión, el sitio web se desconecta.
- Sin reembolso por pago anual de hosting.
- Al finalizar, a solicitud del Cliente: se entrega el código fuente del sitio web (HTML, CSS, JS) y archivos de datos del CRM. El Cliente nunca obtiene acceso a herramientas internas o infraestructura de administración.

8. Jurisdicción:
Jurisdicción exclusiva en Tel Aviv, Israel bajo la ley israelí.`;

const CONTRACT_RU = `Договор об оказании услуг сайта, CRM и агента WhatsApp

Между: Arzac Studio (далее: «Поставщик»)
И: Клиент (далее: «Клиент»)

Принимая во внимание, что Поставщик разработал технологическую инфраструктуру, включающую хостинг веб-сайтов (SaaS), систему бронирования, систему управления клиентами (CRM) и систему агента WhatsApp на основе искусственного интеллекта, их обслуживание и хостинг (далее: «Система Мастер-Шаблона»)

И принимая во внимание, что Клиент желает воспользоваться услугами Поставщика для получения «персонального сайта» в Системе Мастер-Шаблона для присутствия в интернете, цифровизации и операционного управления своим бизнесом. (далее: «Сайт»)

Стороны договорились о нижеследующем:

1. Услуги:

План Web+CRM (₪790/месяц):
- Разработка «персонального сайта» с использованием Системы Мастер-Шаблона.
- Видимость: присутствие в интернете и SEO.
- Микро CRM система с ИИ: доступ к персональной панели управления, включая управление клиентами, систему записи/бронирования, управление инвентарём/складом, редактируемый раздел FAQ.
- Поддержка 3 языков (иврит, английский, русский).
- Текущее обслуживание и техническая поддержка: обновление динамического контента (изображения, цены, тексты), техническое наблюдение, исправление ошибок, управление инфраструктурой. (Данный договор не включает изменения структурного дизайна; такие изменения требуют отдельного соглашения с дополнительной оплатой.)
- Хостинг сайта: на сторонней инфраструктуре по усмотрению Поставщика.
- Домен: покупка, отслеживание и ежегодное продление для Клиента.

План Completo (₪990/месяц):
- Всё, что включено в план Web+CRM.
- WhatsApp агент с ИИ 24/7: персонализированные автоматические ответы, захват лидов через WhatsApp, запись на приём через WhatsApp, полная интеграция с CRM.

2. Оплата:
- План Web+CRM: ₪790 в месяц, начиная с дня активации.
- План Completo: ₪990 в месяц, начиная с дня активации.
- Хостинг сайта: годовая стоимость (может изменяться третьей стороной), оплата в течение 7 дней с момента запроса.
- Домен: годовая стоимость (может изменяться третьей стороной), оплата в течение 7 дней с момента запроса.
- Несвоевременная оплата приведёт к отключению сайта; сайт будет удалён в течение 7 дней после неоплаты, и настоящий договор будет расторгнут.

3. Сроки:
Предоставление функциональной версии в течение 48 часов после предоставления Клиентом деталей дизайна, после первого платежа.

4. Права / Интеллектуальная собственность и лицензирование:
- Лицензия предоставляется Клиенту при условии поддержания оплаты и соблюдения условий договора.
- Коммерческие и моральные авторские права на код, исходные файлы и дизайн принадлежат Поставщику. Все модули являются собственностью Поставщика; Клиент получает лицензию на использование только на время действия настоящего договора.
- Интеллектуальная собственность на логотип, бренд и контент Клиента остаётся собственностью Клиента и используется исключительно в рамках настоящего договора.
- Право собственности на доменное имя принадлежит Клиенту.

5. Политика допустимого использования:
- Запрещён спам, незаконные материалы или контент, нарушающий закон.
- Запрещён контент, нарушающий авторские права, оскорбительный или запрещённый контент.
- Нарушение является существенным нарушением, дающим право на немедленное одностороннее расторжение.

6. Ограничение ответственности:
- Контент находится под исключительным контролем и ответственностью Клиента.
- Поставщик не гарантирует коммерческих результатов или экономической отдачи.
- Поставщик не несёт ответственности за сбои третьих сторон или форс-мажор.
- Ответственность никогда не превысит общую сумму, уплаченную по настоящему договору.

7. Расторжение:
- Клиент: 30 дней письменного уведомления.
- Поставщик: немедленное расторжение за нарушение политики.
- Поставщик: 7 дней письменного уведомления за неоплату.
- После расторжения сайт отключается.
- Возврат за годовую оплату хостинга не производится.
- По окончании, по запросу Клиента: исходный код сайта (HTML, CSS, JS) и файлы данных CRM передаются. Клиент никогда не получает доступ к внутренним инструментам или инфраструктуре администрирования.

8. Юрисдикция:
Исключительная юрисдикция в Тель-Авиве, Израиль, в соответствии с израильским законодательством.`;

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
    monthlyAmount: "סכום חודשי",
    upgradeTitle: "Upgrade ל-Completo",
    upgradeDesc: "התוכנית שלך תתעדכן מיידית עם סוכן WhatsApp AI.",
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
    monthlyAmount: "Monthly amount",
    upgradeTitle: "Upgrade to Completo",
    upgradeDesc: "Your plan will be updated immediately with the WhatsApp AI agent.",
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
  es: {
    greeting: "Hola,",
    choosePlan: "Elegí tu plan",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/mes",
    popular: "Popular",
    contractTitle: "Acuerdo de servicio",
    expandContract: "Leer acuerdo completo",
    collapseContract: "Ocultar",
    accept: "Leí y acepto los términos del acuerdo",
    pay: "Continuar al pago",
    processing: "Procesando...",
    error: "Error, intentá de nuevo",
    securePayment: "Pago seguro",
    monthlyAmount: "Monto mensual",
    upgradeTitle: "Upgrade a Completo",
    upgradeDesc: "Tu plan se actualizará inmediatamente con el agente WhatsApp IA.",
    webCrmFeatures: [
      "Sitio web profesional a medida",
      "CRM con asistente IA",
      "Sistema de reservas online",
      "Gestión de inventario/stock",
      "Sección de preguntas frecuentes",
      "3 idiomas (HE, EN, RU)",
      "Dominio + hosting incluido",
      "Mantenimiento y soporte 24/7",
    ],
    completoFeatures: [
      "Todo del plan Web+CRM",
      "Agente WhatsApp IA 24/7",
      "Respuestas automáticas personalizadas",
      "Captura de leads por WhatsApp",
      "Turnos/reservas por WhatsApp",
    ],
  },
  ru: {
    greeting: "Здравствуйте,",
    choosePlan: "Выберите план",
    planWebCrm: "Web + CRM",
    planCompleto: "Completo",
    perMonth: "/мес",
    popular: "Популярный",
    contractTitle: "Договор об оказании услуг",
    expandContract: "Прочитать полный договор",
    collapseContract: "Скрыть",
    accept: "Я прочитал(а) и принимаю условия договора",
    pay: "Перейти к оплате",
    processing: "Обработка...",
    error: "Ошибка, попробуйте снова",
    securePayment: "Безопасная оплата",
    monthlyAmount: "Ежемесячная сумма",
    upgradeTitle: "Переход на Completo",
    upgradeDesc: "Ваш план будет обновлён немедленно с WhatsApp IA агентом.",
    webCrmFeatures: [
      "Индивидуальный профессиональный сайт",
      "CRM с AI-помощником",
      "Система онлайн-бронирования",
      "Управление инвентарём/складом",
      "Раздел часто задаваемых вопросов",
      "3 языка (HE, EN, RU)",
      "Домен + хостинг включены",
      "Обслуживание и поддержка 24/7",
    ],
    completoFeatures: [
      "Всё из плана Web+CRM",
      "WhatsApp AI агент 24/7",
      "Персонализированные автоответы",
      "Захват лидов через WhatsApp",
      "Запись через WhatsApp",
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
  lang: "he" | "en" | "es" | "ru";
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
  const contract = lang === "he" ? CONTRACT_HE : lang === "es" ? CONTRACT_ES : lang === "ru" ? CONTRACT_RU : CONTRACT_EN;
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
    <div dir={dir} className="pago-page min-h-screen bg-[var(--pago-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--pago-border)] bg-[var(--pago-card)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="Arzac Studio" className="h-8 w-8" />
            <span className="hidden items-baseline gap-0.5 sm:flex" style={{ fontFamily: "var(--font-display, system-ui)" }}>
              <span className="text-[0.95rem] font-bold tracking-tight text-[var(--pago-text)]">ARZAC</span>
              <span className="text-[0.6rem] font-medium text-[var(--pago-teal)]">.studio</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5 text-[0.78rem] text-[var(--pago-text-muted)]">
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
          <p className="text-sm text-[var(--pago-text-secondary)]">{t.greeting}</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--pago-text)]">{businessName}</h1>
        </div>

        {/* Plan Selection */}
        {!isUpgrade && (
          <section className="mb-8">
            <h2 className="mb-4 text-sm font-semibold text-[var(--pago-text)]">{t.choosePlan}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Web+CRM */}
              <button
                type="button"
                onClick={() => setSelectedPlan("web_crm")}
                className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                  selectedPlan === "web_crm"
                    ? "border-[var(--pago-teal)] bg-[var(--pago-card)] shadow-md"
                    : "border-[var(--pago-border)] bg-[var(--pago-card)] hover:border-[var(--pago-border)]"
                }`}
              >
                <p className="text-[0.9rem] font-semibold text-[var(--pago-text)]">{t.planWebCrm}</p>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-[var(--pago-text)]">₪{WEB_CRM_AMOUNT}</span>
                  <span className="text-sm text-[var(--pago-text-secondary)]">{t.perMonth}</span>
                </p>
                <ul className="mt-4 space-y-1.5">
                  {t.webCrmFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.8rem] text-[var(--pago-text-secondary)]">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[var(--pago-success)]">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "web_crm" && (
                  <div className="absolute -top-px end-4 top-4">
                    <div className="h-5 w-5 rounded-full border-[5px] border-[var(--pago-teal)]" />
                  </div>
                )}
              </button>

              {/* Completo */}
              <button
                type="button"
                onClick={() => setSelectedPlan("completo")}
                className={`relative rounded-2xl border-2 p-5 text-start transition-all ${
                  selectedPlan === "completo"
                    ? "border-[var(--pago-teal)] bg-[var(--pago-card)] shadow-md"
                    : "border-[var(--pago-border)] bg-[var(--pago-card)] hover:border-[var(--pago-border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-[0.9rem] font-semibold text-[var(--pago-text)]">{t.planCompleto}</p>
                  <span className="rounded-full bg-[var(--pago-teal)] px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    {t.popular}
                  </span>
                </div>
                <p className="mt-1">
                  <span className="text-2xl font-bold text-[var(--pago-text)]">₪{COMPLETO_AMOUNT}</span>
                  <span className="text-sm text-[var(--pago-text-secondary)]">{t.perMonth}</span>
                </p>
                <ul className="mt-4 space-y-1.5">
                  {t.completoFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[0.8rem] text-[var(--pago-text-secondary)]">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-[var(--pago-success)]">
                        <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {selectedPlan === "completo" && (
                  <div className="absolute end-4 top-4">
                    <div className="h-5 w-5 rounded-full border-[5px] border-[var(--pago-teal)]" />
                  </div>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Upgrade note */}
        {isUpgrade && (
          <div className="mb-8 rounded-xl border border-[var(--pago-teal)]/20 bg-[var(--pago-teal)]/10 p-4">
            <p className="text-[0.88rem] font-medium text-[var(--pago-teal)]">
              {t.upgradeTitle} — ₪{COMPLETO_AMOUNT}{t.perMonth}
            </p>
            <p className="mt-1 text-[0.8rem] text-[var(--pago-teal)]/80">
              {t.upgradeDesc}
            </p>
          </div>
        )}

        {/* Amount summary */}
        <div className="mb-8 rounded-xl border border-[var(--pago-border)] bg-[var(--pago-card)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--pago-text)]">
                {selectedPlan === "completo" ? t.planCompleto : t.planWebCrm}
              </p>
              <p className="text-xs text-[var(--pago-text-muted)]">{t.monthlyAmount}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--pago-text)]">₪{amount}</p>
          </div>
        </div>

        {/* Contract */}
        <section className="rounded-2xl border border-[var(--pago-border)] bg-[var(--pago-card)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.9rem] font-semibold text-[var(--pago-text)]">{t.contractTitle}</h2>
            <button
              type="button"
              onClick={() => setContractExpanded(!contractExpanded)}
              className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[var(--pago-text-secondary)] transition-colors hover:text-[var(--pago-text)]"
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
            <div className="whitespace-pre-line text-[0.78rem] leading-relaxed text-[var(--pago-text-secondary)]">
              {contract}
            </div>
            {!contractExpanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--pago-card)] to-transparent" style={{ position: "relative", marginTop: "-4rem" }} />
            )}
          </div>

          {/* Accept checkbox */}
          <button
            type="button"
            role="checkbox"
            aria-checked={accepted}
            onClick={() => !sending && setAccepted(!accepted)}
            className={`mt-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition-all ${
              accepted ? "border-[var(--pago-success)]/30 bg-[var(--pago-success)]/10" : "border-[var(--pago-border)] bg-[var(--pago-surface)] hover:bg-[var(--pago-surface)]"
            } ${sending ? "pointer-events-none opacity-50" : ""}`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                accepted ? "border-[var(--pago-success)] bg-[var(--pago-success)]" : "border-[var(--pago-border)]"
              }`}
            >
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="text-[0.82rem] text-[var(--pago-text)]">{t.accept}</span>
          </button>

          {error && (
            <p className="mt-3 rounded-lg bg-[var(--pago-danger)]/10 px-4 py-2.5 text-[0.82rem] text-[var(--pago-danger)]">{error}</p>
          )}

          {/* Pay button */}
          <button
            onClick={handleContinue}
            disabled={!accepted || sending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--pago-teal)] px-6 py-4 text-[0.9rem] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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

      <footer className="border-t border-[var(--pago-border)] py-6 text-center text-[0.75rem] text-[var(--pago-text-muted)]">
        &copy; {new Date().getFullYear()} Arzac Studio
      </footer>
    </div>
  );
}
