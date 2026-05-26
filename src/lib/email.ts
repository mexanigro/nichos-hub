/**
 * Email transaccional con feature flag.
 *
 * Hoy: log estructurado al stdout (visible en Railway). Provider real (Resend,
 * Postmark, etc.) se enchufa cambiando EMAIL_PROVIDER y agregando la lib.
 *
 * Plantillas viven en `src/lib/email-templates/`. Cada plantilla retorna
 * { subject, text, html } para el locale pedido.
 */

type Provider = "disabled" | "log" | "resend";

const PROVIDER = (process.env.EMAIL_PROVIDER || "log") as Provider;
const FROM = process.env.EMAIL_FROM || "Liam de Arzac Studio <hola@arzac.studio>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "website@arzac.studio";

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Marca la categoria para logging/analytics (ej. "payment_confirmed"). */
  tag?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: Provider;
  id?: string;
  error?: string;
}

/**
 * Manda un email. Side-effects segun PROVIDER:
 *   - disabled: no-op, retorna ok=true.
 *   - log:      console.log estructurado (default — no requiere infraestructura).
 *   - resend:   POST a Resend API (requires RESEND_API_KEY).
 *
 * NUNCA tira excepcion al caller — fallo de email no debe romper el flow.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (PROVIDER === "disabled") {
    return { ok: true, provider: "disabled" };
  }

  if (PROVIDER === "log") {
    console.log("[email:log]", JSON.stringify({
      to: params.to,
      subject: params.subject,
      tag: params.tag,
      text: params.text.slice(0, 200) + (params.text.length > 200 ? "…" : ""),
    }));
    return { ok: true, provider: "log" };
  }

  if (PROVIDER === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[email:resend] RESEND_API_KEY no configurado");
      return { ok: false, provider: "resend", error: "no_api_key" };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          reply_to: REPLY_TO,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html,
          tags: params.tag ? [{ name: "category", value: params.tag }] : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[email:resend] failed", { status: res.status, data });
        return { ok: false, provider: "resend", error: data.message || `http_${res.status}` };
      }
      return { ok: true, provider: "resend", id: data.id };
    } catch (e) {
      console.error("[email:resend] exception", e);
      return { ok: false, provider: "resend", error: e instanceof Error ? e.message : "unknown" };
    }
  }

  return { ok: false, provider: PROVIDER, error: "unknown_provider" };
}
