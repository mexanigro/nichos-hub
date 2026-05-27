/**
 * Test real de Resend: manda 1 email de cada template a TEST_EMAIL_TO.
 *
 * Requiere en .env.local:
 *   RESEND_API_KEY=re_xxx
 *   TEST_EMAIL_TO=tu@email.com  (sobrescribible con CLI: TEST_EMAIL_TO=otro@...)
 *
 * Uso:
 *   EMAIL_PROVIDER=resend node --experimental-strip-types scripts/test-resend-send.mjs
 *   EMAIL_PROVIDER=resend node --experimental-strip-types scripts/test-resend-send.mjs payment   (solo uno)
 *
 * NUNCA loguea la API key. Solo el response.id de Resend.
 */

import { readFileSync } from "node:fs";

// Cargar .env.local mínimo (sin librería) — solo las vars que necesitamos
function loadEnvLocal() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const key = m[1];
      if (process.env[key]) continue;
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch (e) {
    console.warn("[test-resend-send] no .env.local, asumiendo env del shell");
  }
}

loadEnvLocal();

if (process.env.EMAIL_PROVIDER !== "resend") {
  console.error("ERROR: EMAIL_PROVIDER no es 'resend'. Setealo en CLI:");
  console.error("  EMAIL_PROVIDER=resend node --experimental-strip-types scripts/test-resend-send.mjs");
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error("ERROR: RESEND_API_KEY no configurado en .env.local");
  process.exit(1);
}

const TO = process.env.TEST_EMAIL_TO || "liam.arzac@gmail.com";

const { sendEmail } = await import("../src/lib/email.ts");
const tpl = await import("../src/lib/email-templates.ts");

const ALL = {
  payment: () =>
    tpl.paymentConfirmed({
      name: "Liam Arzac",
      plan: "web_crm",
      amount: 800,
      nextChargeAt: "2026-06-27T12:00:00Z",
      onboardingUrl: "https://arzac.studio/onboarding/info?token=test-token-123",
    }),
  info: () =>
    tpl.infoSubmittedThanks({
      name: "Liam",
      businessName: "Barbería de Prueba",
      statusUrl: "https://arzac.studio/onboarding/status/test-client-id",
    }),
  demo: () =>
    tpl.demoLeadNotification({
      email: "prospect-test@gmail.com",
      whatsapp: "+972501234567",
      businessName: "Café de Prueba",
      niche: "cafeteria",
      previewUrl: "https://arzac.studio/onboarding/preview",
    }),
  changes: () =>
    tpl.changesRequested({
      name: "Liam",
      businessName: "Barbería de Prueba",
      message:
        "Faltan las fotos del local y los precios de los servicios.\nTambién hay que arreglar los horarios.",
      onboardingUrl: "https://arzac.studio/onboarding/info?token=test-resubmit-token",
    }),
  resubmit: () =>
    tpl.changesResubmitted({
      clientId: "test-client-id",
      businessName: "Barbería de Prueba",
      customerEmail: "owner@test.com",
      customerName: "Pedro",
      previousMessage: "Faltan fotos del local.",
      reviewUrl: "https://arzac.studio/clients/test-client-id",
    }),
};

const only = process.argv[2];
const cases = only ? { [only]: ALL[only] } : ALL;
if (only && !ALL[only]) {
  console.error(`Nombre invalido: ${only}. Opciones: ${Object.keys(ALL).join(", ")}`);
  process.exit(1);
}

console.log(`Enviando ${Object.keys(cases).length} email(s) a ${TO} via Resend…`);

let ok = 0;
let fail = 0;
for (const [name, fn] of Object.entries(cases)) {
  const rendered = fn();
  const res = await sendEmail({
    to: TO,
    subject: `[TEST] ${rendered.subject}`,
    text: rendered.text,
    html: rendered.html,
    tag: `test_${name}`,
  });
  if (res.ok) {
    ok++;
    console.log(`  [OK]   ${name.padEnd(10)} → resend.id=${res.id || "(no id)"}`);
  } else {
    fail++;
    console.log(`  [FAIL] ${name.padEnd(10)} → ${res.error}`);
  }
}

console.log(`\n${ok}/${ok + fail} enviados via Resend.`);
process.exit(fail > 0 ? 1 : 0);
