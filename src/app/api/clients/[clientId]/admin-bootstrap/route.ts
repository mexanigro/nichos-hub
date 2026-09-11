import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db, auth } from "@/lib/firebase-admin";
import { bootstrapTenantOwner } from "@/lib/admin-bootstrap";

/**
 * POST /api/clients/[clientId]/admin-bootstrap  (owner)
 * [clientId] = id del doc en hub_clients (como el resto de rutas [clientId]).
 * Body: { email }. Crea admin_users/{email} con rol owner para el tenant del
 * cliente y sincroniza claims (clientId + tenantRole) revocando refresh tokens.
 * Idempotente; 409 si el email ya es admin de otro tenant (D-21).
 */
export const POST = withOwner(async (req, _session, ctx) => {
  const { clientId: hubDocId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { email?: unknown };
  const email = typeof body.email === "string" ? body.email : "";

  const doc = await db.collection("hub_clients").doc(hubDocId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const tenantId = doc.data()?.clientId as string | undefined;
  if (!tenantId) {
    return NextResponse.json({ error: "Este cliente no tiene clientId interno" }, { status: 400 });
  }

  try {
    const result = await bootstrapTenantOwner({ email, clientId: tenantId, db, auth });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[admin-bootstrap] Error:", err instanceof Error ? err.message : "desconocido");
    return NextResponse.json({ error: "Error al crear el dueño del tenant" }, { status: 500 });
  }
});
