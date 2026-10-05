import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";
import { CLIENT_ID_RE, guardarConfig, normalizeConfigShape } from "@/lib/guardar-config";

type RouteCtx = { params: Promise<{ clientId: string }> };

// PLANTILLA-01 (D-255): la forma del cuerpo, el nicho del hub, la validación, paraFirestore, el set con merge y la auditoría viven en
// src/lib/guardar-config.ts, que usan también las consolas (scripts/desde-plantilla.ts, scripts/textos.ts): una sola lógica de guardado.

/** GET /api/config/:clientId — read Firestore config/{clientId} */
export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }
  const snap = await db.collection("config").doc(clientId).get();
  if (!snap.exists) return NextResponse.json({});
  const data = snap.data() ?? {};
  return NextResponse.json(normalizeConfigShape(data));
});

/** PUT /api/config/:clientId — merge into Firestore config/{clientId} (la lógica, en guardarConfig) */
export const PUT = withOwner(async (req, session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  const body = await req.json();
  try {
    const r = await guardarConfig(clientId, body, { quien: session.user?.email ?? "owner" });
    if (!r.ok) return NextResponse.json(r.status === 422 ? { error: r.error, issues: r.issues } : { error: r.error }, { status: r.status });
    return NextResponse.json(r);
  } catch (err) {
    console.error("[api/config PUT]", err);
    return NextResponse.json({ error: "Error al guardar configuracion" }, { status: 500 });
  }
});
