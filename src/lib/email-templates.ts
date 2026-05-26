/**
 * Plantillas de email transaccional. Cada una retorna { subject, text, html }
 * para el locale pedido. Texto plano + HTML simple — sin frameworks para
 * mantener el bundle chico y los emails accesibles.
 *
 * Convencion: el sujeto del email es de Liam (1ra persona), consistente con
 * el copy del wizard y el sitio.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arzac.studio";

interface PaymentConfirmedVars {
  name?: string;
  plan: "web_crm" | "completo";
  amount: number;
  nextChargeAt?: string;
  onboardingUrl: string;
  locale?: string;
}

export function paymentConfirmed(v: PaymentConfirmedVars) {
  const planLabel = v.plan === "completo" ? "Web + CRM + Agente" : "Web + CRM";
  const name = v.name?.split(" ")[0] || "";
  const nextLine = v.nextChargeAt
    ? `\nPróximo cobro: ${new Date(v.nextChargeAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}.\n`
    : "";

  return {
    subject: `Recibimos tu pago — ${planLabel}`,
    text: [
      `Hola${name ? " " + name : ""},`,
      ``,
      `Confirmado el pago de ₪${v.amount} por el plan ${planLabel}.`,
      nextLine,
      `Próximo paso: completá la info de tu sitio acá:`,
      v.onboardingUrl,
      ``,
      `Apenas tenga la primera versión te escribo por WhatsApp.`,
      ``,
      `Liam`,
      `Arzac Studio · ${SITE}`,
    ].join("\n"),
    html: `<p>Hola${name ? " " + escape(name) : ""},</p>
<p>Confirmado el pago de <strong>₪${v.amount}</strong> por el plan <strong>${planLabel}</strong>.${v.nextChargeAt ? `<br>Próximo cobro: <strong>${new Date(v.nextChargeAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</strong>.` : ""}</p>
<p>Próximo paso: completá la info de tu sitio.</p>
<p><a href="${v.onboardingUrl}" style="display:inline-block;background:#0f0f0f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Completar mi info →</a></p>
<p>Apenas tenga la primera versión te escribo por WhatsApp.</p>
<p>—<br>Liam<br><a href="${SITE}">Arzac Studio</a></p>`,
  };
}

interface InfoSubmittedVars {
  name?: string;
  businessName?: string;
  statusUrl: string;
}

export function infoSubmittedThanks(v: InfoSubmittedVars) {
  const name = v.name?.split(" ")[0] || "";
  return {
    subject: `Recibí la info de ${v.businessName || "tu negocio"}`,
    text: [
      `Hola${name ? " " + name : ""},`,
      ``,
      `Recibí toda la info de tu sitio. En menos de 24hs te escribo por WhatsApp con la primera versión.`,
      ``,
      `Vas a poder revisarla y pedir cambios antes de que salga online.`,
      ``,
      `Mientras tanto, podés seguir el estado de tu sitio acá:`,
      v.statusUrl,
      ``,
      `Liam`,
      `Arzac Studio · ${SITE}`,
    ].join("\n"),
    html: `<p>Hola${name ? " " + escape(name) : ""},</p>
<p>Recibí toda la info de tu sitio. En menos de 24hs te escribo por WhatsApp con la primera versión.</p>
<p>Vas a poder revisarla y pedir cambios antes de que salga online.</p>
<p><a href="${v.statusUrl}" style="display:inline-block;background:#0f0f0f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Ver estado →</a></p>
<p>—<br>Liam<br><a href="${SITE}">Arzac Studio</a></p>`,
  };
}

interface DemoLeadVars {
  email: string;
  whatsapp?: string;
  businessName?: string;
  niche?: string;
  previewUrl: string;
}

export function demoLeadNotification(v: DemoLeadVars) {
  return {
    subject: `Nuevo lead demo · ${v.businessName || v.email}`,
    text: [
      `Nuevo lead que probó la demo gratis:`,
      ``,
      `Negocio: ${v.businessName || "(sin nombre)"}`,
      `Nicho: ${v.niche || "(sin nicho)"}`,
      `Email: ${v.email}`,
      `WhatsApp: ${v.whatsapp || "(no dejó)"}`,
      ``,
      `Preview: ${v.previewUrl}`,
    ].join("\n"),
  };
}

interface ChangesRequestedVars {
  name?: string;
  businessName?: string;
  message: string;
  onboardingUrl: string;
}

export function changesRequested(v: ChangesRequestedVars) {
  const name = v.name?.split(" ")[0] || "";
  return {
    subject: `Pedí algunos cambios en el sitio de ${v.businessName || "tu negocio"}`,
    text: [
      `Hola${name ? " " + name : ""},`,
      ``,
      `Revisé la info que cargaste y me gustaría que ajustemos algunas cosas antes de publicar el sitio:`,
      ``,
      v.message,
      ``,
      `Volvé al wizard para editar lo que haga falta:`,
      v.onboardingUrl,
      ``,
      `Cuando termines, vuelvo a revisarlo y publico.`,
      ``,
      `Liam`,
      `Arzac Studio · ${SITE}`,
    ].join("\n"),
    html: `<p>Hola${name ? " " + escape(name) : ""},</p>
<p>Revisé la info que cargaste y me gustaría que ajustemos algunas cosas antes de publicar el sitio:</p>
<blockquote style="border-left:3px solid #0f0f0f;margin:0;padding:8px 14px;color:#444;background:#fafafa">${escape(v.message).replace(/\n/g, "<br>")}</blockquote>
<p><a href="${v.onboardingUrl}" style="display:inline-block;background:#0f0f0f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Editar mi info →</a></p>
<p>Cuando termines, vuelvo a revisarlo y publico.</p>
<p>—<br>Liam<br><a href="${SITE}">Arzac Studio</a></p>`,
  };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
