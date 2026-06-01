import { NextRequest, NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

interface StoredKeys {
  anthropic_admin_key?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  railway_token?: string;
}

export const GET = withOwner(async (_req: NextRequest, _session, _ctx) => {
  const snap = await db.collection("hub_api_keys").doc("keys").get();
  const data = (snap.data() ?? {}) as StoredKeys;

  return NextResponse.json({
    configured: {
      anthropic: !!data.anthropic_admin_key,
      twilio: !!(data.twilio_account_sid && data.twilio_auth_token),
      railway: !!data.railway_token,
      vercel: !!process.env.VERCEL_TOKEN,
    },
  });
});

export const PUT = withOwner(async (req: NextRequest, _session, _ctx) => {
  const body = (await req.json()) as Partial<StoredKeys>;

  const allowed: (keyof StoredKeys)[] = [
    "anthropic_admin_key",
    "twilio_account_sid",
    "twilio_auth_token",
    "railway_token",
  ];

  const update: Partial<StoredKeys> = {};
  for (const key of allowed) {
    if (body[key] !== undefined && typeof body[key] === "string" && body[key]!.trim() !== "") {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
  }

  await db.collection("hub_api_keys").doc("keys").set(update, { merge: true });

  return NextResponse.json({ ok: true });
});
