/**
 * Validacion de terminal en el flujo de pago Cardcom.
 *
 * Escenario que cubre: si se mezclan credenciales de sandbox y produccion entre
 * deploys, un cobro hecho en el terminal de prueba (1000) NO puede acreditarse
 * como un cliente real. El monto solo ya no alcanza: 770 NIS en sandbox son
 * indistinguibles de 770 NIS reales.
 */
import test from "node:test";
import assert from "node:assert/strict";

// cardcom.ts congela TERMINAL/SANDBOX al importarse: fijamos el env antes.
process.env.CARDCOM_SANDBOX = "false";
process.env.CARDCOM_TERMINAL = "189298";
process.env.CARDCOM_API_NAME = "test-api-user";

const { checkPaymentTerminal, verifyPayment, TERMINAL, SANDBOX_TERMINALS } =
  await import("./cardcom.ts");

const PROD_TERMINAL = "189298";
const SANDBOX_TERMINAL = "1000";

test("checkPaymentTerminal: terminal productivo en produccion -> acredita", () => {
  const r = checkPaymentTerminal({
    reported: PROD_TERMINAL,
    expected: PROD_TERMINAL,
    sandboxMode: false,
    isProduction: true,
  });
  assert.equal(r.ok, true);
});

test("checkPaymentTerminal: pago de sandbox en deploy productivo -> RECHAZA", () => {
  // Credenciales de sandbox quedaron en el deploy prod: Cardcom confirma el
  // cobro (terminal 1000) y el monto coincide con el plan. Sin esta validacion
  // el lead se promovia a hub_clients como pago real.
  const r = checkPaymentTerminal({
    reported: SANDBOX_TERMINAL,
    expected: SANDBOX_TERMINAL,
    sandboxMode: true,
    isProduction: true,
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "sandbox_terminal_in_production");
});

test("checkPaymentTerminal: terminal 1000 sin flag sandbox en produccion -> RECHAZA", () => {
  // Variante: CARDCOM_SANDBOX=false pero CARDCOM_TERMINAL apunta al de prueba.
  const r = checkPaymentTerminal({
    reported: SANDBOX_TERMINAL,
    expected: SANDBOX_TERMINAL,
    sandboxMode: false,
    isProduction: true,
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "sandbox_terminal_in_production");
});

test("checkPaymentTerminal: Cardcom reporta otro terminal -> RECHAZA por mismatch", () => {
  const r = checkPaymentTerminal({
    reported: SANDBOX_TERMINAL,
    expected: PROD_TERMINAL,
    sandboxMode: false,
    isProduction: true,
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "terminal_mismatch");
});

test("checkPaymentTerminal: sandbox fuera de produccion -> acredita (no rompe dev/local)", () => {
  const r = checkPaymentTerminal({
    reported: SANDBOX_TERMINAL,
    expected: SANDBOX_TERMINAL,
    sandboxMode: true,
    isProduction: false,
  });
  assert.equal(r.ok, true);
});

test("checkPaymentTerminal: sin terminal configurado -> fail closed", () => {
  const r = checkPaymentTerminal({
    reported: PROD_TERMINAL,
    expected: "",
    sandboxMode: false,
    isProduction: true,
  });
  assert.equal(r.ok, false);
  assert.equal(r.ok === false && r.reason, "terminal_not_configured");
});

test("checkPaymentTerminal: Cardcom no devuelve TerminalNumber -> no bloquea el pago real", () => {
  const r = checkPaymentTerminal({
    reported: undefined,
    expected: PROD_TERMINAL,
    sandboxMode: false,
    isProduction: true,
  });
  assert.equal(r.ok, true);
});

test("SANDBOX_TERMINALS incluye el terminal de prueba 1000", () => {
  assert.ok(SANDBOX_TERMINALS.includes(SANDBOX_TERMINAL));
});

test("verifyPayment: extrae TerminalNumber y el deal de sandbox no pasa el check", async () => {
  // Respuesta con la forma real de BillGoldGetLowProfileIndicator.aspx
  // (doc Cardcom Name-to-Value, "Parameters table, answer reciving").
  const body = new URLSearchParams({
    ResponseCode: "0",
    Description: "Low Profile Code Found",
    TerminalNumber: SANDBOX_TERMINAL,
    LowProfileCode: "5BAF4BD5-76FB-4C81-8654-DF481B22EDF3",
    Operation: "1",
    OperationResponse: "0",
    DealResponse: "0",
    InternalDealNumber: "987654321",
    Token: "12F678C4-BC08-4607-ACF2-755FD7FCD3DE",
    CardValidityMonth: "12",
    CardValidityYear: "2030",
    ReturnValue: "lead-123",
    "ExtShvaParams.Sum36": "77000", // 770 NIS — el monto exacto del plan base
    "ExtShvaParams.CardNumber5": "0008",
  }).toString();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(body, { status: 200 })) as typeof fetch;

  try {
    const v = await verifyPayment("5BAF4BD5-76FB-4C81-8654-DF481B22EDF3");

    assert.equal(v.success, true);
    assert.equal(v.amount, 770, "el monto coincide con el plan: la validacion de monto pasa");
    assert.equal(v.terminalNumber, SANDBOX_TERMINAL);

    // Hub configurado en prod (189298) recibiendo un deal del terminal 1000.
    const r = checkPaymentTerminal({
      reported: v.terminalNumber,
      expected: TERMINAL,
      sandboxMode: false,
      isProduction: true,
    });
    assert.equal(r.ok, false, "un deal de sandbox no puede acreditarse como real");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
