// SIN-ALTA-01 · P1–P5 (H) · el precio: 250 por todo, sin alta, y los pagos del hub con un solo vocabulario.
// Sesión A (2026-10-20): tests rojos. P2, P3 y P4 leen el fuente de las rutas (tocan Firestore; § Interfaz de la hoja).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existe, fuente, importarModulo, pintar } from "./_comun.ts";

const VIEJAS = ["SETUP_AMOUNT_DEFAULT", "SETUP_AMOUNT_MIN", "SETUP_AMOUNT_MAX", "isValidSetupAmount", "resolveSetupAmount", "getChargeAmount"];

test("src/lib/pricing.ts exporta MONTHLY_AMOUNT = 250 y CURRENCY = \"ILS\" y no exporta SETUP_AMOUNT_DEFAULT, SETUP_AMOUNT_MIN, SETUP_AMOUNT_MAX, isValidSetupAmount, resolveSetupAmount ni getChargeAmount; monthlyChargeFor da 250 con cualquier plan o tier heredado", async () => {
  const p = await importarModulo("src/lib/pricing.ts");
  assert.ok(p, "src/lib/pricing.ts debe existir");
  const sobran = VIEJAS.filter((k) => k in p);
  assert.deepEqual(sobran, [], `pricing.ts no debe exportar ${sobran.join(", ")} (sin alta, D-316)`);
  assert.equal(p.MONTHLY_AMOUNT, 250);
  assert.equal(p.CURRENCY, "ILS");
  assert.equal(typeof p.monthlyChargeFor, "function", "pricing.ts debe exportar monthlyChargeFor");
  for (const c of [{}, { plan: "solo_web" }, { plan: "web_crm" }, { plan: "completo" }, { tier: "base" }, { tier: "pro" }, { tier: "enterprise" }, { plan: "x", tier: 3 }]) {
    assert.equal(p.monthlyChargeFor(c), 250, `monthlyChargeFor(${JSON.stringify(c)}) debe dar 250`);
  }
});

test("el primer cobro en persona es la cuota: el hub_payments pendiente que crea POST /api/payments/contract lleva type \"recurring\" y amount 250 aunque el cliente no tenga ningún pago, /api/cardcom/create-payment le pide a Cardcom 250 con el producto «(mensualidad)», y src/lib/charges.ts no existe", () => {
  const contrato = fuente("src/app/api/payments/contract/route.ts");
  // Sin ninguna consulta de pagos previos: el tipo y el importe no dependen de si el cliente ya pagó algo.
  assert.ok(!/resolveClientCharge|@\/lib\/charges|"initial"|getChargeAmount|setupAmount/.test(contrato),
    "contract/route.ts no debe decidir el cobro por los pagos previos ni por un alta (resolveClientCharge, charges, \"initial\", getChargeAmount, setupAmount)");
  assert.match(contrato, /\btype\s*(=|:)\s*"recurring"/, "el hub_payments pendiente debe llevar type \"recurring\" fijo");
  assert.match(contrato, /\bamount\s*(=|:)\s*MONTHLY_AMOUNT\b/, "el importe del pendiente debe ser MONTHLY_AMOUNT");
  assert.match(contrato, /import\s*\{[^}]*\bMONTHLY_AMOUNT\b[^}]*\}\s*from\s*"@\/lib\/pricing"/);
  assert.match(contrato, /collection\("hub_payments"\)\.add\(\{[\s\S]*?\bamount\b[\s\S]*?\btype\b[\s\S]*?status:\s*"pending"/, "el add de hub_payments lleva amount, type y status pending");
  const pago = fuente("src/app/api/cardcom/create-payment/route.ts");
  assert.ok(!/resolveClientCharge|@\/lib\/charges|\(alta\)|"alta"|getChargeAmount/.test(pago), "create-payment no debe cobrar un alta");
  assert.match(pago, /\bamount\s*(=|:)\s*MONTHLY_AMOUNT\b/, "create-payment debe pedirle a Cardcom MONTHLY_AMOUNT");
  assert.match(pago, /\(mensualidad\)/, "el producto de create-payment dice «(mensualidad)»");
  assert.ok(!existe("src/lib/charges.ts"), "src/lib/charges.ts no debe existir");
});

test("la compra por la web cobra lo mismo: /api/cardcom/create-onboarding-payment y cardcom-promote usan MONTHLY_AMOUNT (250) y el producto dice «(primer mes)», no «(alta)»", async () => {
  const web = fuente("src/app/api/cardcom/create-onboarding-payment/route.ts");
  assert.ok(!/getChargeAmount|SETUP_AMOUNT|\(alta\)/.test(web), "create-onboarding-payment no debe cobrar el alta (getChargeAmount, SETUP_AMOUNT, «(alta)»)");
  assert.match(web, /\bamount\s*(=|:)\s*MONTHLY_AMOUNT\b/);
  assert.match(web, /\(primer mes\)/, "el producto de la compra web dice «(primer mes)»");
  const promote = fuente("src/lib/cardcom-promote.ts");
  assert.ok(!/getChargeAmount|SETUP_AMOUNT/.test(promote), "cardcom-promote no debe usar el alta");
  assert.match(promote, /\bamount\s*(=|:)\s*MONTHLY_AMOUNT\b/);
  assert.equal((await importarModulo("src/lib/pricing.ts"))?.MONTHLY_AMOUNT, 250);
});

test("un pago nuevo es siempre una cuota: POST /api/payments responde 400 con type \"initial\" y acepta \"recurring\"; la insignia de un pago de type \"initial\" (datos viejos) dice «Alta (histórico)»", async () => {
  const ruta = fuente("src/app/api/payments/route.ts");
  const post = ruta.slice(ruta.indexOf("export const POST"), ruta.indexOf("export const", ruta.indexOf("export const POST") + 1) >>> 0 || undefined);
  assert.match(post, /if\s*\(\s*type\s*!==\s*"recurring"\s*\)\s*\{\s*return\s+NextResponse\.json\([\s\S]{0,200}?status:\s*400/,
    "POST /api/payments debe responder 400 a todo type distinto de \"recurring\" (también \"initial\")");
  assert.ok(!/type\s*!==\s*"initial"|type\s*===\s*"initial"/.test(post), "POST /api/payments no debe aceptar \"initial\"");
  const m = await importarModulo("src/components/payment-badges.tsx");
  assert.ok(m?.PaymentTypeBadge, "payment-badges.tsx exporta PaymentTypeBadge");
  const html = await pintar(m.PaymentTypeBadge, { type: "initial" });
  assert.match(html, /Alta \(histórico\)/);
  assert.match(await pintar(m.PaymentTypeBadge, { type: "recurring" }), /Mensual/);
});

test("los pagos del hub se leen con un solo vocabulario: src/lib/pago-mostrado.ts da \"recurring\" para \"subscription_recurring\" y \"subscription_initial\", \"initial\" sólo para \"initial\", \"paid\" para \"success\" y \"paid\", \"pending\" para un estado desconocido o ausente, y ordena por billingDate o, sin ella, por createdAt, del más reciente al más viejo y los sin fecha al final; src/lib/repos/payments.ts lo usa en listPayments y listClientPayments y ninguna de las dos consultas ordena por billingDate en Firestore", async () => {
  const m = await importarModulo("src/lib/pago-mostrado.ts");
  assert.ok(m, "src/lib/pago-mostrado.ts debe existir");
  for (const f of ["estadoMostrado", "tipoMostrado", "fechaDePago", "ordenarPagos"]) assert.equal(typeof m[f], "function", `pago-mostrado.ts exporta ${f}`);
  assert.equal(m.tipoMostrado("subscription_recurring"), "recurring");
  assert.equal(m.tipoMostrado("subscription_initial"), "recurring");
  assert.equal(m.tipoMostrado("recurring"), "recurring");
  assert.equal(m.tipoMostrado("initial"), "initial");
  assert.equal(m.tipoMostrado(undefined), "recurring");
  assert.equal(m.estadoMostrado("success"), "paid");
  assert.equal(m.estadoMostrado("paid"), "paid");
  assert.equal(m.estadoMostrado("failed"), "failed");
  assert.equal(m.estadoMostrado("cancelled"), "cancelled");
  assert.equal(m.estadoMostrado("rarisimo"), "pending");
  assert.equal(m.estadoMostrado(undefined), "pending");
  const d = (s: string) => new Date(s);
  const pagos = [
    { id: "sin-fecha" },
    { id: "cron-oct", createdAt: d("2026-10-10") },
    { id: "pago-sep", billingDate: d("2026-09-01"), createdAt: d("2026-11-30") },
    { id: "pago-nov", billingDate: d("2026-11-01") },
  ];
  assert.deepEqual(m.ordenarPagos(pagos).map((p: { id: string }) => p.id), ["pago-nov", "cron-oct", "pago-sep", "sin-fecha"]);
  assert.equal(m.fechaDePago({ billingDate: d("2026-09-01"), createdAt: d("2026-11-30") })?.toISOString(), d("2026-09-01").toISOString());
  assert.equal(m.fechaDePago({ createdAt: d("2026-10-10") })?.toISOString(), d("2026-10-10").toISOString());
  const repo = fuente("src/lib/repos/payments.ts");
  assert.match(repo, /from\s*"@\/lib\/pago-mostrado"/, "repos/payments.ts importa de pago-mostrado");
  for (const f of ["listPayments", "listClientPayments"]) {
    const i = repo.indexOf(`export async function ${f}(`);
    assert.ok(i >= 0, `repos/payments.ts define ${f}`);
    const cuerpo = repo.slice(i, repo.indexOf("\n}", i));
    assert.match(cuerpo, /ordenarPagos\(/, `${f} ordena con ordenarPagos`);
    assert.ok(!/orderBy\(/.test(cuerpo), `${f} no ordena en Firestore (deja afuera los cobros del cron sin billingDate)`);
  }
  assert.ok(!/orderBy\(\s*"billingDate"/.test(repo), "repos/payments.ts no ordena por billingDate en Firestore");
  assert.match(repo, /estadoMostrado\(/);
  assert.match(repo, /tipoMostrado\(/);
});
