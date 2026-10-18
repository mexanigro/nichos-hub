/**
 * LANDING-01: /terms y /privacy en los cinco idiomas, cada uno escrito como original; si difieren, vale el hebreo.
 * Alineados con el contrato v9.0 (sin alta, cancelación del día con devolución proporcional) y con lo que el
 * sistema hace hoy: sin analítica, sin agente de IA, sin nombrar el procesador de pagos. `{precio}` lo reemplaza
 * `precio()` de precios.ts. Antes de publicar, que los lea un abogado israelí.
 */
import type { Locale } from "./types.ts";

export interface SeccionLegal { h: string; p?: string[]; li?: string[] }
export interface DocLegal { title: string; sections: SeccionLegal[] }
export interface TextosLegales {
  updated: string; back: string; contactEmail: string; prevalece: string;
  terms: DocLegal; privacy: DocLegal;
}

export const LEGAL: Record<Locale, TextosLegales> = {
  es: {
    updated: "Actualizado: octubre de 2026",
    back: "Volver al inicio",
    contactEmail: "Escribinos a",
    prevalece: "Este texto está en cinco idiomas. Si hay diferencias entre ellos, vale la versión en hebreo.",
    terms: {
      title: "Términos del servicio",
      sections: [
        { h: "El servicio", p: ["Arzac Studio hace webs a medida para negocios locales en Israel, con un CRM para clientes y turnos y emails automáticos para el negocio y sus clientes. Es un solo plan, con una cuota mensual fija. El contrato que firmás al empezar es el documento completo; estos términos lo resumen."] },
        { h: "Precio", li: [
          "Cuota: {precio} por mes, fija. Cubre la creación de la web y del CRM, el hosting y el dominio.",
          "No hay alta ni otros cobros.",
          "El primer mes se paga al aceptar el contrato y cubre un mes entero desde ese día. Los meses siguientes se cobran el mismo día de cada mes.",
          "No hay niveles de plan ni subas automáticas de precio.",
        ] },
        { h: "Entrega", p: ["Entregamos la web funcionando dentro de las 48 horas de recibir tus materiales de diseño."] },
        { h: "Cancelación", p: [
          "Podés cancelar cuando quieras con un aviso por escrito. La cancelación rige el día en que la recibimos, y te devolvemos la parte del mes ya pagado que no usaste, en proporción a los días que faltan: por ejemplo, si cancelás el día 12 de un mes de 30 días, te devolvemos 18/30 de la cuota.",
          "Al terminar, la web y el CRM se dan de baja. Si nos lo pedís, te entregamos los datos de tu CRM y el código de la web (HTML, CSS y JS).",
        ] },
        { h: "Si un pago no se hace", p: ["La web y el CRM se suspenden. A los 7 días del pago no hecho se borran de forma definitiva y el acuerdo termina."] },
        { h: "Qué mantenemos", p: ["Mientras dure la suscripción mantenemos la web, el hosting, la renovación del dominio, el certificado SSL y las copias de seguridad diarias de los datos del CRM, actualizamos el contenido (textos, fotos, servicios y precios) y corregimos los errores."] },
        { h: "Pagos", p: ["Los pagos los procesa un procesador de pagos israelí. Nunca vemos ni guardamos los datos de tu tarjeta. Cada pago lleva su factura."] },
        { h: "Propiedad", p: ["Tu marca, tus contenidos, tus fotos y los datos de tu CRM son tuyos, y el dominio está a tu nombre. El código, el diseño y el sistema de plantillas son de Arzac Studio: mientras dure la suscripción tenés una licencia para usarlos."] },
        { h: "Uso aceptable", p: ["La web y el CRM no se pueden usar para mandar spam ni para guardar o publicar material ilegal, ofensivo o engañoso. Si eso pasa, podemos terminar el servicio de inmediato."] },
        { h: "Responsabilidad", p: ["Sos responsable del contenido de tu web y de lo que cargás en el CRM. No garantizamos resultados comerciales. No respondemos por fallas de plataformas de terceros (hosting, registradores de dominio, proveedores de email) ni por fuerza mayor, y nuestra responsabilidad nunca supera lo que pagaste por el servicio."] },
        { h: "Ley y jurisdicción", p: ["Rige la ley israelí. Son competentes los tribunales del distrito de Tel Aviv."] },
      ],
    },
    privacy: {
      title: "Política de privacidad",
      sections: [
        { h: "Quiénes somos", p: ["Arzac Studio, de Liam Arzac, con base en Tel Aviv, Israel, es responsable de los datos que tratamos para darte el servicio."] },
        { h: "Qué datos juntamos", li: [
          "Tus datos de contacto: nombre, email, teléfono y el nombre de tu negocio, cuando hablamos o te suscribís.",
          "Datos de pago: los procesa un procesador de pagos israelí. Nosotros no vemos ni guardamos tu tarjeta.",
          "Los datos de tus clientes que entran por tu web y tu CRM: nombre, teléfono, email, turnos y consultas. Esos datos son tuyos; los guardamos por cuenta tuya.",
        ] },
        { h: "Para qué los usamos", li: [
          "Para armar y mantener tu web y tu CRM.",
          "Para mandar los emails automáticos: confirmaciones y cancelaciones de turnos y avisos de consultas.",
          "Para cobrar la cuota y emitir las facturas.",
          "Para hablar con vos sobre tu servicio.",
        ] },
        { h: "¿Tenés que darnos tus datos?", p: ["No hay obligación legal de darlos, pero sin tu nombre, un medio de contacto y la información de tu negocio no podemos armar ni mantener tu web."] },
        { h: "Con quién los compartimos", p: ["Sólo con los proveedores que hacen funcionar el servicio, y nunca los vendemos:"], li: [
          "Google Firebase: base de datos y archivos.",
          "Vercel: hosting de las webs de los clientes.",
          "Railway: hosting de este sitio.",
          "Resend: envío de los emails.",
          "Google: inicio de sesión, el calendario si lo conectás, y las fuentes y los mapas que muestran las webs.",
          "Anthropic: herramientas internas de Arzac Studio que procesan textos.",
          "Un procesador de pagos israelí, para cobrar.",
        ] },
        { h: "Datos fuera de Israel", p: ["Varios de estos proveedores guardan o procesan datos fuera de Israel, por ejemplo en Estados Unidos."] },
        { h: "Cuánto tiempo los guardamos", p: ["Mientras dure la suscripción. Si cancelás, borramos tus datos dentro de los 30 días; si un pago no se hace, la web y el CRM se borran a los 7 días, como dice el contrato. Antes de borrar, si nos lo pedís, te entregamos tus datos."] },
        { h: "Tus derechos", p: ["Podés pedirnos una copia de tus datos, corregirlos o pedir que los borremos cuando quieras."] },
        { h: "Cookies", p: ["Este sitio guarda en tu navegador sólo el idioma que elegís, y las cookies necesarias si iniciás sesión. No usamos cookies de publicidad ni de seguimiento."] },
      ],
    },
  },

  en: {
    updated: "Updated: October 2026",
    back: "Back to home",
    contactEmail: "Write to us at",
    prevalece: "This text is available in five languages. If they differ, the Hebrew version prevails.",
    terms: {
      title: "Terms of service",
      sections: [
        { h: "The service", p: ["Arzac Studio builds custom websites for local businesses in Israel, with a CRM for clients and appointments and automatic emails for the business and its clients. There is one plan with a fixed monthly fee. The agreement you sign when you start is the full document; these terms summarise it."] },
        { h: "Price", li: [
          "Fee: {precio} a month, fixed. It covers building the website and the CRM, hosting and the domain.",
          "There is no setup fee and no other charge.",
          "The first month is paid when you accept the agreement and covers a full month from that day. Each following month is charged on the same date.",
          "There are no plan tiers and no automatic price increases.",
        ] },
        { h: "Delivery", p: ["We deliver a working website within 48 hours of receiving your design materials."] },
        { h: "Cancellation", p: [
          "You can cancel at any time with written notice. The cancellation takes effect on the day we receive it, and we refund the unused part of the month already paid, in proportion to the days left: for example, cancelling on day 12 of a 30-day month refunds 18/30 of the fee.",
          "When the service ends, the website and the CRM are taken offline. If you ask, we hand over your CRM data and the website code (HTML, CSS and JS).",
        ] },
        { h: "If a payment is missed", p: ["The website and the CRM are suspended. Seven days after the missed payment they are permanently deleted and the agreement ends."] },
        { h: "What we maintain", p: ["While you are subscribed we maintain the website, hosting, domain renewal, the SSL certificate and daily backups of your CRM data, we update your content (copy, photos, services and prices) and we fix bugs."] },
        { h: "Payments", p: ["Payments are processed by an Israeli payment processor. We never see or store your card details. Every payment comes with an invoice."] },
        { h: "Ownership", p: ["Your brand, your content, your photos and your CRM data are yours, and the domain is in your name. The code, the design and the template system belong to Arzac Studio: while you are subscribed, you have a licence to use them."] },
        { h: "Acceptable use", p: ["The website and the CRM may not be used to send spam or to store or publish illegal, offensive or misleading material. If that happens, we may end the service immediately."] },
        { h: "Liability", p: ["You are responsible for the content of your website and for what you enter in the CRM. We do not guarantee business results. We are not liable for failures of third-party platforms (hosting, domain registrars, email providers) or for force majeure, and our liability never exceeds what you paid for the service."] },
        { h: "Law and jurisdiction", p: ["Israeli law applies. The courts of the Tel Aviv district have jurisdiction."] },
      ],
    },
    privacy: {
      title: "Privacy policy",
      sections: [
        { h: "Who we are", p: ["Arzac Studio, run by Liam Arzac and based in Tel Aviv, Israel, is responsible for the data we process to provide the service."] },
        { h: "What data we collect", li: [
          "Your contact details: name, email, phone number and business name, when we talk or when you subscribe.",
          "Payment data: processed by an Israeli payment processor. We never see or store your card.",
          "Your clients' data that comes in through your website and your CRM: name, phone number, email, appointments and enquiries. That data is yours; we store it on your behalf.",
        ] },
        { h: "What we use it for", li: [
          "To build and maintain your website and your CRM.",
          "To send the automatic emails: appointment confirmations and cancellations, and enquiry notices.",
          "To charge the fee and issue invoices.",
          "To talk with you about your service.",
        ] },
        { h: "Do you have to give us your data?", p: ["There is no legal obligation, but without your name, a way to reach you and your business details we cannot build or maintain your website."] },
        { h: "Who we share it with", p: ["Only with the providers that make the service work, and we never sell it:"], li: [
          "Google Firebase: database and files.",
          "Vercel: hosting for client websites.",
          "Railway: hosting for this site.",
          "Resend: sending the emails.",
          "Google: sign-in, the calendar if you connect it, and the fonts and maps shown on the websites.",
          "Anthropic: internal Arzac Studio tools that process text.",
          "An Israeli payment processor, to take payments.",
        ] },
        { h: "Data outside Israel", p: ["Several of these providers store or process data outside Israel, for example in the United States."] },
        { h: "How long we keep it", p: ["For as long as you are subscribed. If you cancel, we delete your data within 30 days; if a payment is missed, the website and the CRM are deleted after 7 days, as the agreement says. Before deleting, if you ask, we hand over your data."] },
        { h: "Your rights", p: ["You can ask us for a copy of your data, correct it or ask us to delete it at any time."] },
        { h: "Cookies", p: ["This site stores only the language you choose in your browser, plus the cookies needed if you sign in. We do not use advertising or tracking cookies."] },
      ],
    },
  },

  he: {
    updated: "עודכן: אוקטובר 2026",
    back: "חזרה לדף הבית",
    contactEmail: "כתבו לנו לכתובת",
    prevalece: "הטקסט קיים בחמש שפות. אם יש הבדלים ביניהן, הנוסח העברי הוא הקובע.",
    terms: {
      title: "תנאי השירות",
      sections: [
        { h: "השירות", p: ["Arzac Studio בונה אתרים מותאמים לעסקים מקומיים בישראל, עם מערכת CRM ללקוחות ולתורים ומיילים אוטומטיים לעסק וללקוחות שלו. יש תוכנית אחת, במנוי חודשי קבוע. ההסכם שנחתם בתחילת העבודה הוא המסמך המלא; התנאים כאן מסכמים אותו."] },
        { h: "מחיר", li: [
          "מנוי: {precio} לחודש, קבוע. הוא כולל את בניית האתר וה-CRM, את האחסון ואת הדומיין.",
          "אין דמי הקמה ואין חיובים נוספים.",
          "החודש הראשון משולם בעת קבלת ההסכם ומכסה חודש שלם מאותו יום. כל חודש נוסף מחויב באותו תאריך.",
          "אין רמות של תוכניות ואין העלאות מחיר אוטומטיות.",
        ] },
        { h: "מסירה", p: ["אנחנו מוסרים אתר פעיל תוך 48 שעות מקבלת חומרי העיצוב שלך."] },
        { h: "ביטול", p: [
          "אפשר לבטל בכל עת בהודעה בכתב. הביטול נכנס לתוקף ביום שבו קיבלנו אותה, ואנחנו מחזירים את החלק מהחודש ששולם ולא נוצל, באופן יחסי לימים שנשארו: למשל, ביטול ביום ה-12 של חודש בן 30 ימים מזכה ב-18/30 מהמנוי.",
          "בסיום, האתר וה-CRM יורדים מהאוויר. לפי בקשתך, נעביר לך את נתוני ה-CRM ואת קוד האתר (HTML, CSS ו-JS).",
        ] },
        { h: "אם תשלום לא בוצע", p: ["האתר וה-CRM מושעים. שבעה ימים אחרי התשלום שלא בוצע הם נמחקים לצמיתות וההסכם מסתיים."] },
        { h: "מה אנחנו מתחזקים", p: ["כל עוד המנוי בתוקף, אנחנו מתחזקים את האתר, את האחסון, את חידוש הדומיין, את תעודת ה-SSL ואת הגיבויים היומיים של נתוני ה-CRM, מעדכנים את התוכן (טקסטים, תמונות, שירותים ומחירים) ומתקנים תקלות."] },
        { h: "תשלומים", p: ["התשלומים עוברים דרך חברת סליקה ישראלית. אנחנו אף פעם לא רואים ולא שומרים את פרטי הכרטיס. על כל תשלום מונפקת חשבונית."] },
        { h: "בעלות", p: ["המותג, התוכן, התמונות ונתוני ה-CRM שלך שייכים לך, והדומיין רשום על שמך. הקוד, העיצוב ומערכת התבניות שייכים ל-Arzac Studio: כל עוד המנוי בתוקף, יש לך רישיון להשתמש בהם."] },
        { h: "שימוש הוגן", p: ["אסור להשתמש באתר וב-CRM כדי לשלוח דואר זבל או כדי לשמור או לפרסם תוכן לא חוקי, פוגעני או מטעה. אם זה קורה, אנחנו רשאים להפסיק את השירות מיד."] },
        { h: "אחריות", p: ["האחריות לתוכן האתר ולמה שמוזן ל-CRM היא שלך. אנחנו לא מתחייבים לתוצאות עסקיות. אנחנו לא אחראים לתקלות בפלטפורמות של צד שלישי (אחסון, רשמי דומיינים, ספקי מייל) או לכוח עליון, והאחריות שלנו לעולם לא תעלה על מה ששילמת עבור השירות."] },
        { h: "דין ושיפוט", p: ["על ההסכם חל הדין הישראלי. סמכות השיפוט לבתי המשפט של מחוז תל אביב."] },
      ],
    },
    privacy: {
      title: "מדיניות פרטיות",
      sections: [
        { h: "מי אנחנו", p: ["Arzac Studio, בניהולו של ליאם ארזק, שפועל מתל אביב, ישראל, אחראי למידע שאנחנו מעבדים כדי לתת את השירות."] },
        { h: "איזה מידע אנחנו אוספים", li: [
          "פרטי הקשר שלך: שם, מייל, טלפון ושם העסק, כשאנחנו מדברים או כשנרשמת.",
          "פרטי תשלום: מעובדים על ידי חברת סליקה ישראלית. אנחנו לא רואים ולא שומרים את הכרטיס.",
          "המידע על הלקוחות שלך שנכנס דרך האתר וה-CRM: שם, טלפון, מייל, תורים ופניות. המידע הזה שלך; אנחנו שומרים אותו בשבילך.",
        ] },
        { h: "למה אנחנו משתמשים בו", li: [
          "כדי לבנות ולתחזק את האתר וה-CRM שלך.",
          "כדי לשלוח את המיילים האוטומטיים: אישורי וביטולי תורים והודעות על פניות.",
          "כדי לגבות את המנוי ולהנפיק חשבוניות.",
          "כדי לדבר איתך על השירות.",
        ] },
        { h: "האם חובה למסור את המידע?", p: ["אין חובה חוקית למסור אותו, אבל בלי שם, דרך ליצור קשר ופרטי העסק אנחנו לא יכולים לבנות או לתחזק את האתר."] },
        { h: "עם מי אנחנו משתפים", p: ["רק עם הספקים שמפעילים את השירות, ואנחנו אף פעם לא מוכרים את המידע:"], li: [
          "Google Firebase: מסד נתונים וקבצים.",
          "Vercel: אחסון אתרי הלקוחות.",
          "Railway: אחסון האתר הזה.",
          "Resend: שליחת המיילים.",
          "Google: התחברות, היומן אם חיברת אותו, והגופנים והמפות שמוצגים באתרים.",
          "Anthropic: כלים פנימיים של Arzac Studio שמעבדים טקסט.",
          "חברת סליקה ישראלית, לגביית התשלומים.",
        ] },
        { h: "מידע מחוץ לישראל", p: ["חלק מהספקים האלה שומרים או מעבדים מידע מחוץ לישראל, למשל בארצות הברית."] },
        { h: "כמה זמן אנחנו שומרים", p: ["כל עוד המנוי בתוקף. אם ביטלת, אנחנו מוחקים את המידע תוך 30 ימים; אם תשלום לא בוצע, האתר וה-CRM נמחקים אחרי 7 ימים, כפי שכתוב בהסכם. לפני המחיקה, לפי בקשתך, נעביר לך את המידע."] },
        { h: "הזכויות שלך", p: ["אפשר לבקש מאיתנו בכל עת עותק של המידע, לתקן אותו או לבקש שנמחק אותו."] },
        { h: "עוגיות", p: ["האתר שומר בדפדפן רק את השפה שבחרת, ואת העוגיות שנדרשות אם התחברת. אנחנו לא משתמשים בעוגיות פרסום או מעקב."] },
      ],
    },
  },

  ru: {
    updated: "Обновлено: октябрь 2026",
    back: "На главную",
    contactEmail: "Пишите нам на",
    prevalece: "Текст доступен на пяти языках. При расхождениях действует версия на иврите.",
    terms: {
      title: "Условия обслуживания",
      sections: [
        { h: "Услуга", p: ["Arzac Studio делает сайты под местный бизнес в Израиле: с CRM для клиентов и записей и автоматическими письмами бизнесу и его клиентам. Тариф один, с фиксированной ежемесячной оплатой. Полный документ — договор, который вы подписываете в начале; здесь его краткое изложение."] },
        { h: "Цена", li: [
          "Абонемент: {precio} в месяц, фиксированно. Он покрывает создание сайта и CRM, хостинг и домен.",
          "Платы за подключение и других платежей нет.",
          "Первый месяц оплачивается при принятии договора и покрывает целый месяц с этого дня. Каждый следующий месяц списывается в то же число.",
          "Уровней тарифа и автоматического повышения цены нет.",
        ] },
        { h: "Сроки", p: ["Работающий сайт мы сдаём в течение 48 часов после получения ваших материалов для дизайна."] },
        { h: "Отмена", p: [
          "Отменить можно в любой момент письменным уведомлением. Отмена вступает в силу в день, когда мы его получили, и мы возвращаем неиспользованную часть оплаченного месяца пропорционально оставшимся дням: например, при отмене на 12-й день 30-дневного месяца возвращается 18/30 абонемента.",
          "После окончания сайт и CRM отключаются. По вашему запросу мы передадим данные CRM и код сайта (HTML, CSS и JS).",
        ] },
        { h: "Если платёж не прошёл", p: ["Сайт и CRM приостанавливаются. Через 7 дней после пропущенного платежа они удаляются безвозвратно, и договор прекращается."] },
        { h: "Что мы поддерживаем", p: ["Пока действует абонемент, мы поддерживаем сайт, хостинг, продление домена, SSL-сертификат и ежедневные резервные копии данных CRM, обновляем содержимое (тексты, фото, услуги и цены) и исправляем ошибки."] },
        { h: "Оплата", p: ["Платежи проходят через израильскую платёжную систему. Данные вашей карты мы никогда не видим и не храним. На каждый платёж выставляется счёт."] },
        { h: "Права", p: ["Ваш бренд, материалы, фотографии и данные CRM принадлежат вам, а домен оформлен на ваше имя. Код, дизайн и система шаблонов принадлежат Arzac Studio: пока действует абонемент, у вас есть лицензия на их использование."] },
        { h: "Допустимое использование", p: ["Сайт и CRM нельзя использовать для рассылки спама или для хранения и публикации незаконных, оскорбительных или вводящих в заблуждение материалов. В этом случае мы можем сразу прекратить обслуживание."] },
        { h: "Ответственность", p: ["За содержимое сайта и данные, которые вы вносите в CRM, отвечаете вы. Мы не гарантируем коммерческих результатов. Мы не отвечаем за сбои сторонних платформ (хостинг, регистраторы доменов, почтовые сервисы) и за форс-мажор, а наша ответственность никогда не превышает сумму, которую вы заплатили за услугу."] },
        { h: "Право и юрисдикция", p: ["Действует право Израиля. Споры рассматривают суды округа Тель-Авив."] },
      ],
    },
    privacy: {
      title: "Политика конфиденциальности",
      sections: [
        { h: "Кто мы", p: ["Arzac Studio под руководством Лиама Арзака, работающий из Тель-Авива (Израиль), отвечает за данные, которые мы обрабатываем, чтобы оказывать услугу."] },
        { h: "Какие данные мы собираем", li: [
          "Ваши контакты: имя, email, телефон и название бизнеса — когда мы общаемся или вы подписываетесь.",
          "Платёжные данные: их обрабатывает израильская платёжная система. Вашу карту мы не видим и не храним.",
          "Данные ваших клиентов, которые приходят через сайт и CRM: имя, телефон, email, записи и заявки. Эти данные ваши; мы храним их от вашего имени.",
        ] },
        { h: "Зачем мы их используем", li: [
          "Чтобы сделать и поддерживать ваш сайт и CRM.",
          "Чтобы отправлять автоматические письма: подтверждения и отмены записей и уведомления о заявках.",
          "Чтобы списывать абонемент и выставлять счета.",
          "Чтобы общаться с вами об услуге.",
        ] },
        { h: "Обязательно ли давать данные?", p: ["Законной обязанности нет, но без вашего имени, способа связи и информации о бизнесе мы не сможем сделать и поддерживать сайт."] },
        { h: "С кем мы ими делимся", p: ["Только с поставщиками, на которых работает услуга, и мы никогда не продаём данные:"], li: [
          "Google Firebase: база данных и файлы.",
          "Vercel: хостинг сайтов клиентов.",
          "Railway: хостинг этого сайта.",
          "Resend: отправка писем.",
          "Google: вход, календарь, если вы его подключили, а также шрифты и карты на сайтах.",
          "Anthropic: внутренние инструменты Arzac Studio для обработки текста.",
          "Израильская платёжная система — для приёма оплаты.",
        ] },
        { h: "Данные за пределами Израиля", p: ["Некоторые из этих поставщиков хранят или обрабатывают данные за пределами Израиля, например в США."] },
        { h: "Сколько мы храним данные", p: ["Пока действует абонемент. Если вы отменили, мы удаляем данные в течение 30 дней; если платёж не прошёл, сайт и CRM удаляются через 7 дней, как сказано в договоре. Перед удалением по вашему запросу передадим вам данные."] },
        { h: "Ваши права", p: ["В любой момент вы можете запросить копию своих данных, исправить их или попросить удалить."] },
        { h: "Cookies", p: ["Сайт хранит в браузере только выбранный вами язык и cookies, нужные для входа, если вы входите. Рекламных и отслеживающих cookies мы не используем."] },
      ],
    },
  },

  ar: {
    updated: "آخر تحديث: تشرين الأول/أكتوبر 2026",
    back: "العودة إلى الصفحة الرئيسية",
    contactEmail: "راسلنا على",
    prevalece: "هذا النص متوفّر بخمس لغات. إذا اختلفت فيما بينها، فالنص العبري هو المعتمد.",
    terms: {
      title: "شروط الخدمة",
      sections: [
        { h: "الخدمة", p: ["تبني Arzac Studio مواقع مصمّمة للأعمال المحلية في إسرائيل، مع نظام CRM للزبائن والمواعيد ورسائل بريد تلقائية للعمل ولزبائنه. هناك خطة واحدة باشتراك شهري ثابت. العقد الذي توقّعه عند البدء هو الوثيقة الكاملة، وهذه الشروط تلخّصه."] },
        { h: "السعر", li: [
          "الاشتراك: {precio} شهرياً، ثابت. يشمل إنشاء الموقع والـCRM والاستضافة والنطاق.",
          "لا توجد رسوم تأسيس ولا أي رسوم أخرى.",
          "يُدفع الشهر الأول عند قبول العقد ويغطّي شهراً كاملاً من ذلك اليوم. ويُحصَّل كل شهر لاحق في التاريخ نفسه.",
          "لا توجد مستويات للخطة ولا زيادات تلقائية في السعر.",
        ] },
        { h: "التسليم", p: ["نسلّم موقعاً يعمل خلال 48 ساعة من استلام مواد التصميم الخاصة بك."] },
        { h: "الإلغاء", p: [
          "يمكنك الإلغاء في أي وقت بإشعار مكتوب. يسري الإلغاء في اليوم الذي نستلمه فيه، ونعيد لك الجزء غير المستخدم من الشهر المدفوع بنسبة الأيام المتبقية: مثلاً، الإلغاء في اليوم 12 من شهر من 30 يوماً يعيد لك 18/30 من الاشتراك.",
          "عند انتهاء الخدمة يتوقّف الموقع والـCRM. وإن طلبت، نسلّمك بيانات الـCRM وشيفرة الموقع (HTML وCSS وJS).",
        ] },
        { h: "إذا لم يتمّ الدفع", p: ["يُعلَّق الموقع والـCRM. وبعد 7 أيام من الدفعة الفائتة يُحذفان نهائياً وينتهي العقد."] },
        { h: "ما الذي نصونه", p: ["طوال مدة الاشتراك نصون الموقع والاستضافة وتجديد النطاق وشهادة SSL والنسخ الاحتياطية اليومية لبيانات الـCRM، ونحدّث المحتوى (النصوص والصور والخدمات والأسعار) ونصلح الأعطال."] },
        { h: "المدفوعات", p: ["تتمّ المدفوعات عبر شركة دفع إسرائيلية. لا نرى بيانات بطاقتك ولا نحفظها أبداً. ولكل دفعة فاتورة."] },
        { h: "الملكية", p: ["علامتك التجارية ومحتواك وصورك وبيانات الـCRM ملكك، والنطاق مسجّل باسمك. أما الشيفرة والتصميم ونظام القوالب فهي ملك Arzac Studio، ولك ترخيص لاستخدامها طوال مدة الاشتراك."] },
        { h: "الاستخدام المقبول", p: ["لا يجوز استخدام الموقع والـCRM لإرسال رسائل مزعجة أو لحفظ أو نشر مواد غير قانونية أو مسيئة أو مضلّلة. وإن حدث ذلك، يحقّ لنا إنهاء الخدمة فوراً."] },
        { h: "المسؤولية", p: ["أنت مسؤول عن محتوى موقعك وعمّا تُدخله في الـCRM. لا نضمن نتائج تجارية. ولسنا مسؤولين عن أعطال منصّات الطرف الثالث (الاستضافة ومسجّلي النطاقات ومزوّدي البريد) أو عن القوة القاهرة، ولا تتجاوز مسؤوليتنا أبداً ما دفعته مقابل الخدمة."] },
        { h: "القانون والاختصاص", p: ["يسري القانون الإسرائيلي. وتختصّ محاكم منطقة تل أبيب."] },
      ],
    },
    privacy: {
      title: "سياسة الخصوصية",
      sections: [
        { h: "من نحن", p: ["Arzac Studio، بإدارة ليام أرزاك، ومقرّها تل أبيب في إسرائيل، مسؤولة عن البيانات التي نعالجها لتقديم الخدمة."] },
        { h: "ما البيانات التي نجمعها", li: [
          "بيانات التواصل معك: الاسم والبريد والهاتف واسم عملك، عندما نتحدث أو عندما تشترك.",
          "بيانات الدفع: تعالجها شركة دفع إسرائيلية. لا نرى بطاقتك ولا نحفظها.",
          "بيانات زبائنك التي تصل عبر موقعك والـCRM: الاسم والهاتف والبريد والمواعيد والاستفسارات. هذه البيانات ملكك، ونحفظها نيابةً عنك.",
        ] },
        { h: "لماذا نستخدمها", li: [
          "لبناء موقعك والـCRM وصيانتهما.",
          "لإرسال رسائل البريد التلقائية: تأكيد المواعيد وإلغاؤها وإشعارات الاستفسارات.",
          "لتحصيل الاشتراك وإصدار الفواتير.",
          "للتواصل معك بشأن الخدمة.",
        ] },
        { h: "هل يجب أن تعطينا بياناتك؟", p: ["لا يوجد التزام قانوني بذلك، لكن دون اسمك ووسيلة للتواصل ومعلومات عملك لا يمكننا بناء موقعك أو صيانته."] },
        { h: "مع من نشاركها", p: ["فقط مع المزوّدين الذين تعمل الخدمة بهم، ولا نبيعها أبداً:"], li: [
          "Google Firebase: قاعدة البيانات والملفات.",
          "Vercel: استضافة مواقع الزبائن.",
          "Railway: استضافة هذا الموقع.",
          "Resend: إرسال رسائل البريد.",
          "Google: تسجيل الدخول، والتقويم إن ربطته، والخطوط والخرائط التي تظهر في المواقع.",
          "Anthropic: أدوات داخلية لدى Arzac Studio تعالج النصوص.",
          "شركة دفع إسرائيلية، لتحصيل المدفوعات.",
        ] },
        { h: "بيانات خارج إسرائيل", p: ["بعض هؤلاء المزوّدين يحفظون البيانات أو يعالجونها خارج إسرائيل، مثلاً في الولايات المتحدة."] },
        { h: "كم من الوقت نحفظها", p: ["طوال مدة الاشتراك. إذا ألغيت، نحذف بياناتك خلال 30 يوماً؛ وإذا لم يتمّ الدفع، يُحذف الموقع والـCRM بعد 7 أيام كما ينصّ العقد. وقبل الحذف، إن طلبت، نسلّمك بياناتك."] },
        { h: "حقوقك", p: ["يمكنك في أي وقت أن تطلب نسخة من بياناتك أو تصحيحها أو حذفها."] },
        { h: "ملفات تعريف الارتباط", p: ["يحفظ هذا الموقع في متصفّحك اللغة التي تختارها فقط، وملفات تعريف الارتباط اللازمة إن سجّلت الدخول. لا نستخدم ملفات إعلانية أو للتتبّع."] },
      ],
    },
  },
};
