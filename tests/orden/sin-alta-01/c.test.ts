// SIN-ALTA-01 · C1–C6 (H) · el contrato v9.0 en los cinco idiomas.
// Sesión A (2026-10-20): tests rojos. `getContract` se importa con import() dinámico (§ Interfaz de la hoja); las marcas por idioma
// son las del texto que vio Liam (RAMA 6df0a02, D-314..D-328) y están listadas en § Interfaz de la copia.
import { test } from "node:test";
import assert from "node:assert/strict";
import { IDIOMAS, importarModulo, type Idioma } from "./_comun.ts";

async function contratos(): Promise<Record<Idioma, { text: string; version: string; monthlyAmount: number } & Record<string, unknown>>> {
  const m = await importarModulo("src/lib/contracts.ts");
  assert.ok(m?.getContract, "src/lib/contracts.ts exporta getContract");
  return Object.fromEntries(IDIOMAS.map((l) => [l, m.getContract(l)])) as any;
}
const faltan = (texto: string, marcas: RegExp[]) => marcas.filter((r) => !r.test(texto)).map(String);

/** Marcas de C2: primer mes al aceptar · cubre un mes completo · cancela cuando quiere · rige el día del aviso · proporcional. */
const C2: Record<Idioma, RegExp[]> = {
  en: [/first month is charged when the Client accepts/i, /one full month/i, /cancel at any time/i, /takes effect on the day/i, /in proportion to the days left/i],
  es: [/primer mes se cobra cuando el Cliente acepta/, /un mes completo/, /cancelar en cualquier momento/, /rige desde el día/, /en proporción a los días que faltan/],
  ru: [/Первый месяц оплачивается при принятии/, /полный месяц/, /в любой момент/, /вступает в силу в день/, /пропорционально оставшимся дням/],
  he: [/החודש הראשון ייגבה עם אישור/, /חודש מלא/, /לבטל את ההסכם בכל עת/, /נכנס לתוקף ביום/, /באופן יחסי לימים שנותרו/],
  ar: [/يُحصَّل الشهر الأول عند قبول/, /شهراً كاملاً/, /الإلغاء في أي وقت/, /يسري الإلغاء من يوم/, /بنسبة الأيام المتبقية/],
};
/** El aviso de 30 días del v8.0, en cada idioma. */
const AVISO_30: Record<Idioma, RegExp> = {
  en: /30 days'? (written )?notice/i, es: /30 d[ií]as de aviso/, ru: /уведомлением за 30 дней/, he: /הודעה מוקדמת בכתב של 30/, ar: /إشعار خطي مسبق من 30/,
};
const NIVELES: Record<Idioma, RegExp> = {
  en: /no service tiers and no automatic upgrades or automatic price changes/i,
  es: /no contiene niveles de servicio ni upgrades automáticos ni cambios automáticos de precio/,
  ru: /не содержит тарифных уровней, автоматических повышений или автоматического изменения цены/,
  he: /אינו כולל תוכניות ברמות שונות, שדרוג אוטומטי או שינוי מחיר אוטומטי/,
  ar: /لا تتضمن هذه الاتفاقية مستويات خدمة ولا ترقيات تلقائية ولا تغييرات تلقائية في السعر/,
};
const LOGO_TEXTOS_BORRADO: Record<Idioma, RegExp[]> = {
  en: [/if the Client has no logo, the Provider designs one/i, /the Provider writes the website texts/i, /data is deleted within 30 days/i],
  es: [/si el Cliente no tiene logo, el Proveedor lo diseña/, /los textos del sitio web los escribe el Proveedor/, /datos se borran dentro de los 30 días/],
  ru: [/если у Заказчика нет логотипа, Исполнитель его разрабатывает/, /тексты сайта пишет Исполнитель/, /данные удаляются в течение 30 дней/],
  he: [/אם אין למזמין לוגו, החברה תעצב לוגו/, /את הטקסטים של האתר תכתוב החברה/, /יימחקו נתוניו תוך 30 יום/],
  ar: [/إذا لم يكن لدى العميل شعار، يصمّمه مزوّد الخدمة/, /يكتب مزوّد الخدمة نصوص الموقع/, /تُحذف بياناته خلال 30 يوماً/],
};
/** Las cláusulas de alta del v8.0 (el importe, el pago al firmar y la no devolución del alta). */
const ALTA: Record<Idioma, RegExp> = {
  en: /Setup fee:|(for|of) the setup fee/i, es: /\bAlta:|por el alta|reembolsan el alta/, ru: /Плата за подключение:|Плата за подключение и/,
  he: /דמי הקמה:|בגין דמי ההקמה/, ar: /رسوم التأسيس:|لا تُردّ رسوم التأسيس/,
};
/** Los cobros anuales de hosting y dominio del v8.0. */
const ANUAL: Record<Idioma, RegExp> = {
  en: /annual (hosting )?fees?|amount per year/i, es: /por año|tarifas anuales|Hosting anual/, ru: /сумма в год|ежегодные платежи/,
  he: /עלות שנתית|תשלום(ים)? שנתי/, ar: /مبلغ سنوي|الرسوم السنوية/,
};
/** Cláusula de pago (la que nombra el procesador). */
const PAGO: Record<Idioma, RegExp> = {
  en: /Payments are processed via Cardcom/, es: /Los pagos se procesan vía Cardcom/, ru: /Платежи обрабатываются через Cardcom/,
  he: /התשלומים יבוצעו באמצעות מערכת הסליקה Cardcom/, ar: /تُعالج المدفوعات عبر Cardcom/,
};

test("getContract(lang) devuelve version \"9.0\", monthlyAmount 250 y ninguna clave setupAmount, y en los cinco idiomas el texto lleva ₪250, ningún importe de alta (1000 o 1500 con cualquier separador), ninguna cláusula de alta y ningún cobro anual aparte de hosting o dominio", async () => {
  const c = await contratos();
  for (const l of IDIOMAS) {
    assert.equal(c[l].version, "9.0", `contrato ${l}: version`);
    assert.equal(c[l].monthlyAmount, 250, `contrato ${l}: monthlyAmount`);
    assert.ok(!("setupAmount" in c[l]), `contrato ${l}: sin clave setupAmount`);
    const t = c[l].text;
    assert.ok(t.includes("₪250"), `contrato ${l}: lleva ₪250`);
    assert.ok(!/1[.,\s  ]?[05]00\b/.test(t), `contrato ${l}: ningún importe de alta (1000/1500)`);
    assert.ok(!ALTA[l].test(t), `contrato ${l}: ninguna cláusula de alta («${t.match(ALTA[l])?.[0]}»)`);
    assert.ok(!ANUAL[l].test(t), `contrato ${l}: ningún cobro anual de hosting o dominio («${t.match(ANUAL[l])?.[0]}»)`);
  }
});

test("en los cinco idiomas el contrato dice que el primer mes se cobra al aceptar y cubre un mes completo, que el cliente cancela cuando quiere con efecto el día del aviso, sin aviso de 30 días, y que se le devuelve la parte no usada del mes en proporción a los días que faltan, con el ejemplo del día 12 de un mes de 30 (18/30)", async () => {
  const c = await contratos();
  for (const l of IDIOMAS) {
    const t = c[l].text;
    assert.deepEqual(faltan(t, C2[l]), [], `contrato ${l}: primer mes, mes completo, cancelación del día y devolución proporcional`);
    assert.ok(!AVISO_30[l].test(t), `contrato ${l}: sin el aviso de 30 días`);
    assert.ok(t.includes("18/30") && /\b12\b/.test(t) && /\b30\b/.test(t), `contrato ${l}: el ejemplo del día 12 de un mes de 30 (18/30)`);
  }
});

test("el contrato hebreo numera sus cláusulas de corrido de 1 a 33, sin huecos", async () => {
  const c = await contratos();
  const nums = [...c.he.text.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
  assert.deepEqual(nums, Array.from({ length: 33 }, (_v, i) => i + 1), "cláusulas hebreas 1..33 de corrido");
});

test("ningún idioma del contrato nombra WhatsApp, chatbot, IA ni voz, y la cláusula de que no hay niveles ni cambio automático de precio sigue en los cinco", async () => {
  const c = await contratos();
  const PROHIBIDO = /whatsapp|chat\s?bot|\bAI\b|artificial|\bvoice\b|\bvoz\b|\bIA\b|голос|(?<![А-яЁё])ИИ(?![А-яЁё])|искусствен|ווטסאפ|וואטסאפ|צ'אטבוט|בינה מלאכותית|קולי|واتساب|ذكاء|صوت/i;
  for (const l of IDIOMAS) {
    const m = c[l].text.match(PROHIBIDO);
    assert.equal(m, null, `contrato ${l} nombra «${m?.[0]}»`);
    assert.match(c[l].text, NIVELES[l], `contrato ${l}: sigue la cláusula sin niveles ni cambio automático de precio`);
  }
});

test("en los cinco idiomas el contrato dice que, si el cliente no tiene logo, el proveedor lo diseña y que los textos de la web los escribe el proveedor, y que tras la cancelación los datos se borran dentro de los 30 días", async () => {
  const c = await contratos();
  for (const l of IDIOMAS) assert.deepEqual(faltan(c[l].text, LOGO_TEXTOS_BORRADO[l]), [], `contrato ${l}: logo, textos y borrado a los 30 días`);
});

test("Cardcom sigue nombrado en la cláusula de pago de los cinco idiomas", async () => {
  const c = await contratos();
  // La cláusula de pago del contrato v9.0 (la sección C de la hoja es la del v9.0; el v8.0 también nombraba Cardcom).
  for (const l of IDIOMAS) assert.equal(c[l].version, "9.0", `contrato ${l}: es el v9.0`);
  for (const l of IDIOMAS) assert.match(c[l].text, PAGO[l], `contrato ${l}: la cláusula de pago nombra Cardcom`);
});
