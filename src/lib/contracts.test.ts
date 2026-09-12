import test from "node:test";
import assert from "node:assert/strict";
import { getContract, isContractLang, type ContractLang } from "./contracts.ts";

const LANGS: ContractLang[] = ["en", "he", "ru", "es", "ar"];

test("v8.0: un plan, alta variable renderizada y cuota 250 en los cinco idiomas", () => {
  for (const lang of LANGS) {
    const c1000 = getContract(lang, { setupAmount: 1000 });
    const c1500 = getContract(lang, { setupAmount: 1500 });
    assert.equal(c1000.version, "8.0");
    assert.equal(c1000.setupAmount, 1000);
    assert.equal(c1500.setupAmount, 1500);
    assert.equal(c1000.monthlyAmount, 250);
    assert.match(c1000.text, /₪1[,. ]000/, `${lang}: alta 1000 renderizada`);
    assert.match(c1500.text, /₪1[,. ]500/, `${lang}: alta 1500 renderizada`);
    assert.match(c1000.text, /₪250/, `${lang}: cuota 250`);
    assert.notEqual(c1000.text, c1500.text, `${lang}: el importe cambia el texto`);
  }
});

test("v8.0: sin cláusulas de setup cero, sin niveles, sin cifras viejas", () => {
  for (const lang of LANGS) {
    const { text } = getContract(lang, { setupAmount: 1200 });
    assert.doesNotMatch(text, /₪0\b/, `${lang}: sin ₪0`);
    assert.doesNotMatch(text, /zero setup|cero costo de setup|אפס דמי הקמה|без платы за подключение|بدون رسوم تأسيس/i, `${lang}: sin «setup cero»`);
    assert.doesNotMatch(text, /\b(480|770|960|1[,. ]?270)\b/, `${lang}: sin cifras viejas`);
    assert.doesNotMatch(text, /Solo Web|Enterprise|Plan Pro|Plan Base|תוכנית Pro|תוכנית Base/, `${lang}: sin niveles`);
    assert.doesNotMatch(text, /24\/7/, `${lang}: sin 24/7`);
  }
});

test("importe fuera de rango o ausente → 1500", () => {
  assert.equal(getContract("en").setupAmount, 1500);
  assert.equal(getContract("en", { setupAmount: 999 }).setupAmount, 1500);
  assert.equal(getContract("en", { setupAmount: "1200" }).setupAmount, 1500);
  assert.match(getContract("en", { setupAmount: 1501 }).text, /₪1,500/);
});

test("isContractLang", () => {
  assert.equal(isContractLang("he"), true);
  assert.equal(isContractLang("fr"), false);
});
