import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// Master-template's InboxStatus — keep in sync with
// Barber-shop-template/src/types.ts (export type InboxStatus).
const VALID_STATUS = new Set(["new", "read", "replied", "archived"]);
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/**
 * GET /api/leads/{hubDocId}?limit=&after=&status=&q=
 *
 * Server-side pagination via Firestore `startAfter(cursorDoc)`. The `after`
 * param is the last lead doc id from the previous page; we fetch the cursor
 * snapshot before continuing. We do NOT do server-side full-text search —
 * that would need a separate index. Search/filter on the client over the
 * current page; users can "Cargar mas" to widen the window.
 */
export const GET = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;

  // clientId here is the hub doc ID — resolve the internal clientId
  const hubDoc = await db.collection("hub_clients").doc(clientId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const internalClientId = hubDoc.data()?.clientId;

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const after = url.searchParams.get("after");

  let query = db
    .collection("contact_inbox")
    .where("clientId", "==", internalClientId)
    .orderBy("createdAt", "desc")
    .limit(limit + 1); // fetch +1 to know if there's a next page

  if (after) {
    const cursorSnap = await db.collection("contact_inbox").doc(after).get();
    if (cursorSnap.exists) {
      query = query.startAfter(cursorSnap);
    }
  }

  const snap = await query.get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;

  const leads = pageDocs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? null,
      repliedAt: data.repliedAt?.toDate?.() ?? null,
    };
  });

  return NextResponse.json({
    leads,
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1].id : null,
    pageSize: limit,
  });
});

/**
 * PUT /api/leads/{hubDocId}
 *
 * Body: { leadId: string; status: "new"|"read"|"replied"|"archived" }
 *
 * Mutates a contact_inbox lead's status. Verifies the lead belongs to this
 * client before writing (defense-in-depth against parameter tampering).
 * Sets `repliedAt` server-side when transitioning to "replied".
 */
export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }
  const { leadId, status } = body as { leadId?: unknown; status?: unknown };
  if (typeof leadId !== "string" || !leadId) {
    return NextResponse.json({ error: "leadId requerido" }, { status: 400 });
  }
  if (typeof status !== "string" || !VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "status invalido" }, { status: 400 });
  }

  const hubDoc = await db.collection("hub_clients").doc(clientId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const internalClientId = hubDoc.data()?.clientId;

  const leadRef = db.collection("contact_inbox").doc(leadId);
  const leadSnap = await leadRef.get();
  if (!leadSnap.exists) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }
  if (leadSnap.data()?.clientId !== internalClientId) {
    // Don't leak existence of leads belonging to other clients.
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === "replied" && !leadSnap.data()?.repliedAt) {
    updates.repliedAt = Timestamp.now();
  }
  await leadRef.update(updates);

  return NextResponse.json({ ok: true });
});
