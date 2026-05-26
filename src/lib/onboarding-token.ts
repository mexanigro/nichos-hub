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

export interface OnboardingTokenPayload {
  leadId: string;
  clientId: string;
  plan: PlanType;
  /** Marca el origen — futuro: "free-demo" para tokens del flow gratis. */
  source?: "paid";
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
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
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
    return {
      leadId: payload.leadId,
      clientId: payload.clientId,
      plan: payload.plan as PlanType,
      source: (payload.source as "paid") || "paid",
    };
  } catch {
    return null;
  }
}
