import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

type RouteCtx = { params: Promise<{ clientId: string }> };
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

/**
 * GET /api/clients/{clientId}/status-history?limit=&after=
 *
 * Lee `hub_status_history/{clientId}/entries` ordenadas por `changedAt` desc.
 * Cada endpoint que muta status/lifecycle escribe acá best-effort
 * (calendar disconnect, language change, owner messages, status transitions,
 * client info submitted/resubmit). Algunos entries no traen `kind` explícito
 * — el panel los interpreta como `status_change` cuando hay from/to.
 *
 * Cursor: `?after=<docId>` pide entries posteriores (más viejos) al doc dado.
 */
export const GET = withOwner(async (req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), MAX_LIMIT)
      : DEFAULT_LIMIT;
  const after = url.searchParams.get("after");

  try {
    const baseRef = db
      .collection("hub_status_history")
      .doc(clientId)
      .collection("entries");

    let query = baseRef.orderBy("changedAt", "desc").limit(limit);

    if (after) {
      const cursorSnap = await baseRef.doc(after).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snap = await query.get();

    const entries = snap.docs.map((d) => {
      const data = d.data();
      // Sanitizamos: clonamos solo lo que sabemos rendear. Si llega un kind
      // nuevo, el panel cae al fallback genérico — pero acá pasamos todo el
      // payload (sin timestamps internos) para no perder señal.
      return {
        id: d.id,
        kind: typeof data.kind === "string" ? data.kind : null,
        changedAt: data.changedAt?.toDate?.()?.toISOString() ?? null,
        changedBy: typeof data.changedBy === "string" ? data.changedBy : null,
        from: data.from ?? null,
        to: data.to ?? null,
        reason: typeof data.reason === "string" ? data.reason : null,
        // campos específicos de algunos kinds — los pasamos crudos
        revokeStatus: typeof data.revokeStatus === "number" ? data.revokeStatus : null,
        channel: typeof data.channel === "string" ? data.channel : null,
        messagePreview: typeof data.messagePreview === "string" ? data.messagePreview : null,
        hubDocId: typeof data.hubDocId === "string" ? data.hubDocId : null,
      };
    });

    const nextCursor =
      snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;

    return NextResponse.json({ entries, nextCursor });
  } catch (err) {
    console.error("[api/clients/status-history GET]", err);
    return NextResponse.json(
      { entries: [], nextCursor: null, error: "No se pudo leer el historial" },
      { status: 200 },
    );
  }
});
