import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

const SECRET_FIELDS: Record<string, string[]> = {
  stripe: ["secretKey"],
  cardcom: ["apiKey"],
  paypal: ["clientSecret"],
  square: ["accessToken"],
};

function maskSecret(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (value.length <= 8) return "••••••••";
  return "••••••••" + value.slice(-4);
}

function maskCredentials(
  provider: string,
  creds: Record<string, unknown>,
): Record<string, unknown> {
  const secrets = SECRET_FIELDS[provider] || [];
  const masked = { ...creds };
  for (const field of secrets) {
    if (masked[field]) {
      masked[`${field}_masked`] = maskSecret(masked[field]);
      delete masked[field];
    }
  }
  return masked;
}

/** GET — returns credentials with secrets masked */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const snap = await db.collection("payment_credentials").doc(clientId).get();
  if (!snap.exists) return NextResponse.json({ provider: "none", credentials: {} });

  const data = snap.data() ?? {};
  const provider = (data.provider as string) || "none";
  const credentials = (data.credentials as Record<string, unknown>) || {};

  return NextResponse.json({
    provider,
    credentials: maskCredentials(provider, credentials),
    updatedAt: data.updatedAt ?? null,
  });
});

/** PUT — saves credentials to payment_credentials/{clientId} */
export const PUT = withOwner(async (req, session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const { provider, credentials } = body as {
    provider: string;
    credentials: Record<string, string>;
  };

  if (!provider || typeof provider !== "string") {
    return NextResponse.json({ error: "Provider is required" }, { status: 400 });
  }

  if (provider === "none" || provider === "manual") {
    await db.collection("payment_credentials").doc(clientId).set({
      provider,
      credentials: {},
      updatedAt: new Date().toISOString(),
      updatedBy: session.user?.email ?? "owner",
    });
    return NextResponse.json({ ok: true });
  }

  if (!credentials || typeof credentials !== "object") {
    return NextResponse.json({ error: "Credentials object is required" }, { status: 400 });
  }

  // Merge: if a secret field is absent from the payload, keep the existing value.
  // This allows the UI to omit masked fields on save without clearing them.
  const existing = await db.collection("payment_credentials").doc(clientId).get();
  const existingCreds = existing.exists
    ? ((existing.data()?.credentials as Record<string, string>) || {})
    : {};

  const secrets = SECRET_FIELDS[provider] || [];
  const merged: Record<string, string> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === "string" && value.trim()) {
      merged[key] = value.trim();
    }
  }

  // Preserve existing secrets that weren't sent (they were masked in the UI)
  for (const field of secrets) {
    if (!merged[field] && existingCreds[field]) {
      merged[field] = existingCreds[field];
    }
  }

  await db.collection("payment_credentials").doc(clientId).set({
    provider,
    credentials: merged,
    updatedAt: new Date().toISOString(),
    updatedBy: session.user?.email ?? "owner",
  });

  return NextResponse.json({ ok: true });
});
