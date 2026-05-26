import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

type RouteCtx = { params: Promise<{ clientId: string }> };
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * GET /api/config/{clientId}/history?limit=
 *
 * Returns the most recent audit entries for this client's config. Written
 * by PUT /api/config/{clientId} as a best-effort side effect.
 *
 * Response shape: { entries: Array<{ id, changedAt, changedBy, changeCount, truncated, changes }> }
 */
export const GET = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 50) : 20;

  try {
    const snap = await db
      .collection("config_history")
      .doc(clientId)
      .collection("entries")
      .orderBy("changedAt", "desc")
      .limit(limit)
      .get();

    const entries = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        changedAt: data.changedAt?.toDate?.()?.toISOString() ?? null,
        changedBy: data.changedBy ?? null,
        changeCount: data.changeCount ?? 0,
        truncated: !!data.truncated,
        changes: Array.isArray(data.changes) ? data.changes : [],
        kind: typeof data.kind === "string" ? data.kind : null,
      };
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[api/config history GET]", err);
    return NextResponse.json({ entries: [], error: "No se pudo leer el historial" }, { status: 200 });
  }
});
