import test from "node:test";
import assert from "node:assert/strict";
import { getContract, isContractLang, type ContractLang } from "./contracts.ts";

const LANGS: ContractLang[] = ["en", "he", "ru", "es", "ar"];

// Lo que v8.0 decía y v9.0 ya no (Liam, 2026-10-15): el alta con su importe, hosting y dominio anuales aparte y
// el aviso de 30 días para cancelar.
const ALTA_COBRADA: Record<ContractLang, RegExp> = {
  en: /Setup fee:/,
  he: /דמי הקמה:/,
  ru: /Плата за подключение:/,
  es: /Alta:/,
  ar: /رسوم التأسيس:/,
};
const ANUAL_APARTE: Record<ContractLang, RegExp> = {
  en: /Annual hosting fee|Domain fee:/,
  he: /אחסון אתר: עלות שנתית|דומיין: עלות שנתית/,
  ru: /Хостинг: переменная|Домен: переменная/,
  es: /Hosting anual|Dominio: monto/,
  ar: /الاستضافة: مبلغ سنوي|النطاق: مبلغ سنوي/,
};
const AVISO_30: Record<ContractLang, RegExp> = {
  en: /30 days' written notice/,
  he: /הודעה מוקדמת בכתב של 30 יום/,
  ru: /уведомлением за 30 дней/,
  es: /30 d[ií]as de aviso/,
  ar: /إشعار خطي مسبق من 30 يوماً/,
};
// La devolución proporcional (8.2 / 29): el ejemplo del día 12 de un mes de 30.
const DEVOLUCION: Record<ContractLang, RegExp> = {
  en: /refunds the unused part of the month[^]*18\/30/,
  he: /תחזיר לו החברה את החלק שלא נוצל[^]*18\/30/,
  ru: /возвращает неиспользованную часть[^]*18\/30/,
  es: /devuelve la parte no usada del mes[^]*18\/30/,
  ar: /الجزء غير المستخدم[^]*18\/30/,
};

test("v9.0: 250 por mes por todo, sin alta, en los cinco idiomas", () => {
  for (const lang of LANGS) {
    const c = getContract(lang);
    assert.equal(c.version, "9.0");
    assert.equal(c.monthlyAmount, 250);
    assert.equal((c as Record<string, unknown>).setupAmount, undefined, `${lang}: sin importe de alta`);
    assert.match(c.text, /₪250/, `${lang}: cuota 250`);
    assert.doesNotMatch(c.text, /₪1[,. ]?[05]00/, `${lang}: sin importes de alta`);
    assert.doesNotMatch(c.text, ALTA_COBRADA[lang], `${lang}: sin cláusula de alta`);
    assert.doesNotMatch(c.text, ANUAL_APARTE[lang], `${lang}: hosting y dominio incluidos, sin cobro anual aparte`);
  }
});

test("v9.0: se cancela cuando quiere y se devuelve lo no usado del mes", () => {
  for (const lang of LANGS) {
    const { text } = getContract(lang);
    assert.doesNotMatch(text, AVISO_30[lang], `${lang}: sin aviso de 30 días`);
    assert.match(text, DEVOLUCION[lang], `${lang}: devolución proporcional`);
  }
});

test("v9.0: sin niveles ni cifras viejas, y sin WhatsApp, IA ni voz (fuera de la oferta, 2026-10-20)", () => {
  for (const lang of LANGS) {
    const { text } = getContract(lang);
    assert.doesNotMatch(text, /WhatsApp|chatbot|ИИ|ذكاء اصطناعي|בינה מלאכותית|AI|IA/, `${lang}: sin servicios opcionales`);
    assert.doesNotMatch(text, /₪0\b/, `${lang}: sin ₪0`);
    assert.doesNotMatch(text, /\b(480|770|960|1[,. ]?270)\b/, `${lang}: sin cifras viejas`);
    assert.doesNotMatch(text, /Solo Web|Enterprise|Plan Pro|Plan Base|תוכנית Pro|תוכנית Base/, `${lang}: sin niveles`);
    assert.doesNotMatch(text, /24\/7/, `${lang}: sin 24/7`);
  }
});

test("hebreo: la numeración corrida de 1 a 33, sin huecos", () => {
  const nums = [...getContract("he").text.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]));
  assert.deepEqual(nums, Array.from({ length: 33 }, (_, i) => i + 1));
});

// Lo que la landing promete y el contrato tiene que decir (Liam, 2026-10-20): logo y textos, y el borrado a los 30 días de cancelar.
const LOGO: Record<ContractLang, RegExp> = {
  en: /no logo, the Provider designs one[^]*writes the website texts/,
  he: /אם אין למזמין לוגו, החברה תעצב לוגו[^]*הטקסטים של האתר תכתוב החברה/,
  ru: /нет логотипа, Исполнитель его разрабатывает[^]*тексты сайта пишет Исполнитель/,
  es: /no tiene logo, el Proveedor lo diseña[^]*los textos del sitio web los escribe el Proveedor/,
  ar: /إذا لم يكن لدى العميل شعار، يصمّمه مزوّد الخدمة[^]*يكتب مزوّد الخدمة نصوص الموقع/,
};
const BORRADO_30: Record<ContractLang, RegExp> = {
  en: /data is deleted within 30 days/,
  he: /יימחקו נתוניו תוך 30 יום/,
  ru: /данные удаляются в течение 30 дней/,
  es: /sus datos se borran dentro de los 30 días/,
  ar: /تُحذف بياناته خلال 30 يوماً/,
};

test("v9.0: el logo y los textos entran en el servicio, y los datos se borran a los 30 días de cancelar", () => {
  for (const lang of LANGS) {
    const { text } = getContract(lang);
    assert.match(text, LOGO[lang], `${lang}: logo y textos`);
    assert.match(text, BORRADO_30[lang], `${lang}: borrado a los 30 días`);
  }
});

test("isContractLang", () => {
  assert.equal(isContractLang("he"), true);
  assert.equal(isContractLang("fr"), false);
});
