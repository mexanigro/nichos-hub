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

test("v9.0: sin niveles ni cifras viejas", () => {
  for (const lang of LANGS) {
    const { text } = getContract(lang);
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

test("isContractLang", () => {
  assert.equal(isContractLang("he"), true);
  assert.equal(isContractLang("fr"), false);
});
