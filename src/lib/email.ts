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

/** Regex pragmatico — no es RFC 5322 completo, pero atrapa errores tipicos. */
const EMAIL_RE = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

const FAILURE_WINDOW_MS = 24 * 60 * 60 * 1000;
const failureTimestamps: number[] = [];
let lastTestEmailAt: number | null = null;

function recordFailure() {
  const now = Date.now();
  failureTimestamps.push(now);
  // Trim viejos para no crecer sin limite.
  while (failureTimestamps.length > 0 && now - failureTimestamps[0] > FAILURE_WINDOW_MS) {
    failureTimestamps.shift();
  }
}

export function getRecentFailureCount(): number {
  const now = Date.now();
  while (failureTimestamps.length > 0 && now - failureTimestamps[0] > FAILURE_WINDOW_MS) {
    failureTimestamps.shift();
  }
  return failureTimestamps.length;
}

export function getLastTestEmailAt(): string | undefined {
  return lastTestEmailAt ? new Date(lastTestEmailAt).toISOString() : undefined;
}

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Manda un email. Side-effects segun PROVIDER:
 *   - disabled: no-op, retorna ok=true.
 *   - log:      console.log estructurado (default — no requiere infraestructura).
 *   - resend:   POST a Resend API con retry en 429/5xx (requires RESEND_API_KEY).
 *
 * NUNCA tira excepcion al caller — fallo de email no debe romper el flow.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const startedAt = Date.now();

  if (!EMAIL_RE.test(params.to)) {
    console.error("[email:send] invalid recipient", { to: params.to, tag: params.tag });
    return { ok: false, provider: PROVIDER, error: "invalid_email" };
  }

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
    if (params.tag?.startsWith("test_")) lastTestEmailAt = Date.now();
    return { ok: true, provider: "log" };
  }

  if (PROVIDER === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[email:resend] RESEND_API_KEY no configurado");
      recordFailure();
      return { ok: false, provider: "resend", error: "no_api_key" };
    }

    const body = JSON.stringify({
      from: FROM,
      reply_to: REPLY_TO,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
      tags: params.tag ? [{ name: "category", value: params.tag }] : undefined,
    });

    const maxAttempts = 3;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body,
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          const durationMs = Date.now() - startedAt;
          console.log("[email:resend] sent", {
            to: params.to,
            tag: params.tag,
            id: data.id,
            attempt,
            durationMs,
          });
          if (params.tag?.startsWith("test_")) lastTestEmailAt = Date.now();
          return { ok: true, provider: "resend", id: data.id };
        }

        const retriable = res.status === 429 || res.status >= 500;
        lastError = data.message || `http_${res.status}`;
        console.error("[email:resend] failed", {
          attempt,
          status: res.status,
          retriable,
          error: lastError,
        });

        if (!retriable || attempt === maxAttempts) {
          recordFailure();
          return { ok: false, provider: "resend", error: lastError };
        }

        // Backoff exponencial: 500ms, 1500ms.
        await sleep(500 * Math.pow(3, attempt - 1));
      } catch (e) {
        lastError = e instanceof Error ? e.message : "unknown";
        console.error("[email:resend] exception", { attempt, error: lastError });
        if (attempt === maxAttempts) {
          recordFailure();
          return { ok: false, provider: "resend", error: lastError };
        }
        await sleep(500 * Math.pow(3, attempt - 1));
      }
    }

    recordFailure();
    return { ok: false, provider: "resend", error: lastError || "max_attempts" };
  }

  return { ok: false, provider: PROVIDER, error: "unknown_provider" };
}
