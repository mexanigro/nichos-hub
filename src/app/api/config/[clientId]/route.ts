import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";

type RouteCtx = { params: Promise<{ clientId: string }> };

/** GET /api/config/:clientId — read Firestore config/{clientId} */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  const snap = await db.collection("config").doc(clientId).get();
  return NextResponse.json(snap.exists ? snap.data() : {});
});

/** PUT /api/config/:clientId — overwrite Firestore config/{clientId} */
export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  const body = await req.json();

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  // Use set with merge so partial updates work and don't nuke existing fields
  await db.collection("config").doc(clientId).set(body, { merge: true });
  return NextResponse.json({ ok: true });
});
