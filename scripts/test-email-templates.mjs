/**
 * Smoke test puro de los 5 templates de email.
 *
 * Renderiza cada template con data de prueba y muestra:
 *   - subject
 *   - preview del texto plano
 *   - check de placeholders (que no queden ${} o undefined visible)
 *
 * No envía nada. Para test real con Resend, ver test-resend-send.mjs.
 *
 * Uso: NEXT_PUBLIC_SITE_URL=https://arzac.studio node scripts/test-email-templates.mjs
 */

// Node 22 + --experimental-strip-types permite importar .ts directo.
const tpl = await import("../src/lib/email-templates.ts");

const CASES = [
  {
    name: "paymentConfirmed (web_crm)",
    fn: () =>
      tpl.paymentConfirmed({
        name: "Liam Arzac",
        plan: "web_crm",
        amount: 800,
        nextChargeAt: "2026-06-27T12:00:00Z",
        onboardingUrl: "https://arzac.studio/onboarding/info?token=eyJxxx",
      }),
  },
  {
    name: "paymentConfirmed (completo, sin nextChargeAt)",
    fn: () =>
      tpl.paymentConfirmed({
        name: "Sara",
        plan: "completo",
        amount: 1200,
        onboardingUrl: "https://arzac.studio/onboarding/info?token=eyJxxx",
      }),
  },
  {
    name: "infoSubmittedThanks",
    fn: () =>
      tpl.infoSubmittedThanks({
        name: "Liam",
        businessName: "Barbería del Centro",
        statusUrl: "https://arzac.studio/onboarding/status/abc123",
      }),
  },
  {
    name: "demoLeadNotification (full)",
    fn: () =>
      tpl.demoLeadNotification({
        email: "prospect@gmail.com",
        whatsapp: "+972501234567",
        businessName: "Café Aristano",
        niche: "cafeteria",
        previewUrl: "https://arzac.studio/onboarding/preview",
      }),
  },
  {
    name: "demoLeadNotification (sin whatsapp)",
    fn: () =>
      tpl.demoLeadNotification({
        email: "prospect@gmail.com",
        businessName: "Tatuajes Roma",
        niche: "tattoo",
        previewUrl: "https://arzac.studio/onboarding/preview",
      }),
  },
  {
    name: "changesRequested",
    fn: () =>
      tpl.changesRequested({
        name: "Liam",
        businessName: "Barbería del Centro",
        message:
          "Faltan las fotos del local y los precios de los servicios.\nTambién hay que arreglar los horarios del domingo.",
        onboardingUrl: "https://arzac.studio/onboarding/info?token=resubmit-xxx",
      }),
  },
  {
    name: "changesResubmitted",
    fn: () =>
      tpl.changesResubmitted({
        clientId: "abc123",
        businessName: "Barbería del Centro",
        customerEmail: "owner@barberia.com",
        customerName: "Pedro",
        previousMessage: "Faltan fotos del local.",
        reviewUrl: "https://arzac.studio/clients/abc123",
      }),
  },
];

function check(rendered, name) {
  const issues = [];
  const joined = (rendered.subject || "") + (rendered.text || "") + (rendered.html || "");
  if (joined.includes("${")) issues.push("placeholder ${} sin substituir");
  if (joined.includes("undefined")) issues.push("'undefined' visible");
  if (joined.includes("[object Object]")) issues.push("'[object Object]' visible");
  if (!rendered.subject) issues.push("subject vacío");
  if (!rendered.text) issues.push("text vacío");
  return issues;
}

let failed = 0;
for (const c of CASES) {
  const out = c.fn();
  const issues = check(out, c.name);
  const status = issues.length === 0 ? "OK" : "FAIL";
  console.log(`\n=== ${c.name} [${status}] ===`);
  console.log(`Subject: ${out.subject}`);
  console.log(`Text preview (200 chars):\n${out.text.slice(0, 200)}${out.text.length > 200 ? "…" : ""}`);
  console.log(`HTML present: ${!!out.html}`);
  if (issues.length > 0) {
    failed++;
    console.log(`Issues: ${issues.join(", ")}`);
  }
}

console.log(`\n--- ${CASES.length - failed}/${CASES.length} templates ok ---`);
process.exit(failed > 0 ? 1 : 0);
