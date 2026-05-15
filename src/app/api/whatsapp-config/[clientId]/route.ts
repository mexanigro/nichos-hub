import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("whatsapp_config").doc(clientId).get();
  return NextResponse.json(snap.exists ? snap.data() : {});
});

function replaceNullsWithDelete(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) {
      out[k] = FieldValue.delete();
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = replaceNullsWithDelete(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const body = await req.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const cleaned = replaceNullsWithDelete(body as Record<string, unknown>);
  cleaned.updatedAt = FieldValue.serverTimestamp();

  try {
    await db.collection("whatsapp_config").doc(clientId).set(cleaned, { merge: true });
  } catch (err) {
    console.error("[api/whatsapp-config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion WhatsApp" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
