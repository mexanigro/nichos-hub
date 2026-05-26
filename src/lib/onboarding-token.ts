import { SignJWT, jwtVerify } from "jose";
import type { PlanType } from "@/lib/pricing";

const SECRET = process.env.NEXTAUTH_SECRET;
const ISSUER = "arzac-studio";
const AUDIENCE = "onboarding";

function getKey(): Uint8Array {
  if (!SECRET) {
    throw new Error("NEXTAUTH_SECRET is required to sign onboarding tokens");
  }
  return new TextEncoder().encode(SECRET);
}

export type OnboardingMode = "paid" | "resubmit";

export interface OnboardingTokenPayload {
  leadId: string;
  clientId: string;
  plan: PlanType;
  /** Marca el origen — futuro: "free-demo" para tokens del flow gratis. */
  source?: "paid";
  /**
   * Tipo de flow: "paid" = post-pago (default), "resubmit" = cliente vuelve a
   * editar tras un changes_requested. Diferencia exp y validación defensive
   * en los endpoints (ver upload/client-info routes).
   */
  mode?: OnboardingMode;
}

/**
 * Firma un token short-lived (24h) para el flow post-pago.
 * El token va en la URL ?token=... cuando la success page redirige a /info.
 * Permite prefill server-side sin que email/clientId sean adivinables.
 */
export async function signOnboardingToken(
  payload: OnboardingTokenPayload,
): Promise<string> {
  return new SignJWT({
    leadId: payload.leadId,
    clientId: payload.clientId,
    plan: payload.plan,
    source: payload.source || "paid",
    mode: payload.mode || "paid",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(getKey());
}

/**
 * Firma un token de 7 días para reenvío del cliente tras un changes_requested.
 * Más largo que el de pago porque puede pasar varios días entre que Liam pide
 * cambios y el cliente reenvía. El claim `mode:"resubmit"` lo diferencia y los
 * endpoints validan defensive contra el status actual.
 *
 * leadId/plan se setean a strings stub porque solo se usan para hidratar UI
 * post-pago; en modo resubmit el clientId alcanza para todo el flow.
 */
export async function signResubmitToken(clientId: string): Promise<string> {
  return new SignJWT({
    leadId: `resubmit:${clientId}`,
    clientId,
    plan: "web_crm",
    source: "paid",
    mode: "resubmit",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(getKey());
}

export async function verifyOnboardingToken(
  token: string,
): Promise<OnboardingTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload.leadId !== "string" ||
      typeof payload.clientId !== "string" ||
      typeof payload.plan !== "string"
    ) {
      return null;
    }
    const rawMode = typeof payload.mode === "string" ? payload.mode : "paid";
    const mode: OnboardingMode = rawMode === "resubmit" ? "resubmit" : "paid";
    return {
      leadId: payload.leadId,
      clientId: payload.clientId,
      plan: payload.plan as PlanType,
      source: (payload.source as "paid") || "paid",
      mode,
    };
  } catch {
    return null;
  }
}
