#!/usr/bin/env node
/**
 * E2E test del sandbox de Cardcom.
 *
 * Flujo completo:
 *   1. Crea sesion Low Profile (Operation=1 — cobro + token)
 *   2. Muestra la URL del iframe (en sandbox, no necesita tarjeta real)
 *   3. Simula el "pago" enviando la tarjeta de test directamente al iframe
 *   4. Verifica el pago con BillGoldGetLowProfileIndicator
 *
 * Uso:
 *   node scripts/test-cardcom-sandbox.mjs
 *
 * Tarjetas de test:
 *   - Israeli (con cuotas): 4580280000000008, CVV 123, exp cualquier fecha futura
 *   - Turista (sin cuotas):  4580000000000000, CVV 123, exp cualquier fecha futura
 *   - Monto < 5000 NIS → aprobado
 *   - Monto > 5000 NIS → rechazado
 */

const TERMINAL = "1000";
const API_NAME = "CardTest1994";
const CARDCOM_BASE = "https://secure.cardcom.solutions/Interface";

// Test config
const TEST_AMOUNT = 770; // NIS — precio de la suscripcion
const TEST_CARD = "4580280000000008";
const TEST_CVV = "123";
const TEST_EXP_MONTH = "12";
const TEST_EXP_YEAR = "30";
const TEST_CLIENT_ID = "test-e2e-" + Date.now();

async function step(label, fn) {
  process.stdout.write(`\n▸ ${label}... `);
  try {
    const result = await fn();
    console.log("✓");
    return result;
  } catch (e) {
    console.log("✗");
    console.error(`  Error: ${e.message}`);
    throw e;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Cardcom Sandbox E2E Test");
  console.log("  Terminal: 1000 | User: CardTest1994");
  console.log(`  Amount: ${TEST_AMOUNT} NIS (< 5000 → should succeed)`);
  console.log(`  Card: ${TEST_CARD}`);
  console.log("═══════════════════════════════════════════════");

  // ── Step 1: Create Low Profile session ──
  const lowProfile = await step("Creating Low Profile session", async () => {
    const body = new URLSearchParams({
      TerminalNumber: TERMINAL,
      UserName: API_NAME,
      APIName: API_NAME,
      SumToBill: TEST_AMOUNT.toString(),
      CoinID: "1",
      Language: "he",
      Operation: "1",
      CodePage: "65001",
      SuccessRedirectUrl: "https://arzac.studio/test-success",
      ErrorRedirectUrl: "https://arzac.studio/test-error",
      ReturnValue: TEST_CLIENT_ID,
      ProductName: "E2E Test - Web+CRM",
    });

    const res = await fetch(`${CARDCOM_BASE}/LowProfile.aspx`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const text = await res.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));

    if (parsed.ResponseCode !== "0") {
      throw new Error(`ResponseCode=${parsed.ResponseCode}: ${parsed.Description || "unknown"}`);
    }

    const url = parsed.url || parsed.Url;
    if (!url) throw new Error("No URL in response");

    console.log(`\n    URL: ${url}`);
    console.log(`    LowProfileCode: ${parsed.LowProfileCode}`);

    return { url, lowProfileCode: parsed.LowProfileCode };
  });

  // ── Step 2: Submit test card to the Low Profile iframe ──
  const chargeResult = await step("Submitting test card to iframe", async () => {
    // Cardcom's Low Profile iframe accepts card data via POST to the same URL
    // In sandbox, we can submit the test card directly
    const body = new URLSearchParams({
      CardNumber: TEST_CARD,
      CardValidityMonth: TEST_EXP_MONTH,
      CardValidityYear: TEST_EXP_YEAR,
      cvv: TEST_CVV,
      // Personal ID (teudat zehut) — required field, 9 digits
      Id: "000000000",
    });

    const res = await fetch(lowProfile.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      redirect: "manual", // Don't follow redirect — we want to see where it goes
    });

    const status = res.status;
    const location = res.headers.get("location") || "";

    console.log(`\n    HTTP Status: ${status}`);
    if (location) {
      console.log(`    Redirect: ${location}`);
    }

    // 302 redirect to success URL = payment worked
    if (status === 302 || status === 301) {
      const isSuccess = location.includes("test-success");
      const isError = location.includes("test-error");
      console.log(`    Result: ${isSuccess ? "SUCCESS redirect" : isError ? "ERROR redirect" : "Unknown redirect"}`);
      return { ok: isSuccess, location };
    }

    // If we got a 200, read the body to see if there's an error or the form
    if (status === 200) {
      const html = await res.text();
      // Check for common success/error indicators
      if (html.includes("SuccessRedirectUrl") || html.includes("test-success")) {
        console.log("    Result: Success (200 with redirect URL in body)");
        return { ok: true, html: html.substring(0, 200) };
      }
      // The form page itself returns 200 — might need to check for error messages
      if (html.includes("error") || html.includes("Error") || html.includes("שגיאה")) {
        console.log("    Result: Error in response");
        // Extract error text if possible
        const errorMatch = html.match(/class="[^"]*error[^"]*"[^>]*>([^<]+)/i);
        if (errorMatch) console.log(`    Error: ${errorMatch[1]}`);
        return { ok: false, html: html.substring(0, 500) };
      }
      console.log(`    Got 200 — page length: ${html.length} chars`);
      console.log(`    Snippet: ${html.substring(0, 200).replace(/\s+/g, " ")}`);
      return { ok: null, html: html.substring(0, 500) };
    }

    return { ok: false, status };
  });

  // ── Step 3: Verify payment ──
  const verify = await step("Verifying payment with Cardcom", async () => {
    // Wait a bit for Cardcom to process
    await new Promise((r) => setTimeout(r, 2000));

    const url = new URL(`${CARDCOM_BASE}/BillGoldGetLowProfileIndicator.aspx`);
    url.searchParams.set("terminalnumber", TERMINAL);
    url.searchParams.set("username", API_NAME);
    url.searchParams.set("lowprofilecode", lowProfile.lowProfileCode);

    const res = await fetch(url.toString());
    const text = await res.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));

    const dealResponse = parsed.DealResponse ?? parsed.DealRespone;
    const opResponse = parsed.OperationResponse;

    console.log(`\n    OperationResponse: ${opResponse}`);
    console.log(`    DealResponse: ${dealResponse}`);
    console.log(`    OperationResponseText: ${parsed.OperationResponseText || "(none)"}`);

    if (opResponse === "0" && dealResponse === "0") {
      console.log(`    InternalDealNumber: ${parsed.InternalDealNumber}`);
      console.log(`    Token: ${parsed.Token ? parsed.Token.substring(0, 8) + "..." : "(none)"}`);
      console.log(`    CardNumber5: ${parsed.CardNumber5 || parsed.CardNumber || "(none)"}`);
      console.log(`    ApprovalNumber: ${parsed.ApprovalNumber || parsed["ExtShvaParams.ApprovalNumber"] || "(none)"}`);
      console.log(`    ReturnValue: ${parsed.ReturnValue}`);
      return { success: true, parsed };
    }

    // If the payment wasn't submitted yet (step 2 just returned the form),
    // the verify will show OperationResponse != 0
    console.log(`    Payment not yet completed — this is expected if the iframe POST`);
    console.log(`    returned the form page rather than processing the card.`);
    console.log(`    In production, the user fills the form in the browser.`);

    // Print all fields for debugging
    console.log(`    All fields:`);
    for (const [k, v] of Object.entries(parsed)) {
      if (!["Token", "TokenResponse", "CVV", "cvv"].includes(k)) {
        console.log(`      ${k}: ${v}`);
      }
    }

    return { success: false, parsed };
  });

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════");
  console.log("  RESULTS");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Low Profile created: ✓ (code: ${lowProfile.lowProfileCode})`);
  console.log(`  Iframe URL works:    ✓`);
  console.log(`  Card submission:     ${chargeResult.ok === true ? "✓ Success" : chargeResult.ok === false ? "✗ Failed" : "⚠ Needs browser (iframe POST returned form)"}`);
  console.log(`  Verify payment:      ${verify.success ? "✓ Confirmed" : "⚠ Not yet (expected if card wasn't submitted via API)"}`);

  if (!verify.success) {
    console.log("\n  ℹ️  The Low Profile iframe is designed for browser interaction.");
    console.log("     To complete a full E2E test:");
    console.log("     1. Open this URL in a browser: " + lowProfile.url);
    console.log("     2. Enter card: 4580280000000008, exp: 12/30, CVV: 123, ID: 000000000");
    console.log("     3. Run verify separately:");
    console.log(`        node -e "fetch('${CARDCOM_BASE}/BillGoldGetLowProfileIndicator.aspx?terminalnumber=1000&username=CardTest1994&lowprofilecode=${lowProfile.lowProfileCode}').then(r=>r.text()).then(t=>console.log(Object.fromEntries(new URLSearchParams(t))))"`);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Sandbox connection: ✓ WORKING`);
  console.log("═══════════════════════════════════════════════\n");

  process.exit(verify.success ? 0 : 1);
}

main().catch((e) => {
  console.error("\n✗ Fatal error:", e.message);
  process.exit(2);
});
