import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("calendar_config").doc(clientId).get();
  if (!snap.exists) return NextResponse.json({ connected: false });

  const data = snap.data()!;
  return NextResponse.json({
    connected: true,
    enabled: data.enabled ?? false,
    calendarId: data.calendarId ?? "primary",
    connectedAt: data.connectedAt ?? null,
  });
});

export const DELETE = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  await db.collection("calendar_config").doc(clientId).delete();
  return NextResponse.json({ ok: true });
});
