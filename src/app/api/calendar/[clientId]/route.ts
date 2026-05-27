import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { withOwner } from "@/lib/auth";

type RouteCtx = { params: Promise<{ clientId: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";

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

/**
 * Desconecta el calendar: revoca el token en Google y luego borra el doc local.
 *
 * Por qué revocar primero: si solo borramos el doc local, Google sigue
 * recordando la autorización y, al reconectar, salta el consent screen — el
 * cliente piensa que algo está mal porque no le piden permisos otra vez.
 * Revocar el refresh_token invalida toda la autorización (Google revoca el
 * access_token asociado), así la próxima conexión arranca limpia.
 */
export const DELETE = withOwner(async (_req, session, ctx) => {
  const { clientId } = await (ctx as RouteCtx).params;
  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const ref = db.collection("calendar_config").doc(clientId);
  const snap = await ref.get();

  let revokeStatus: "revoked" | "already_invalid" | "no_token" = "no_token";
  if (snap.exists) {
    const data = snap.data() || {};
    // Preferimos refresh_token (revoca todo el grant). Caemos a access_token
    // si no hay refresh_token guardado (cuentas viejas / scopes one-shot).
    const token =
      (typeof data.refreshToken === "string" && data.refreshToken) ||
      (typeof data.accessToken === "string" && data.accessToken) ||
      "";

    if (token) {
      try {
        const res = await fetch(REVOKE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token }).toString(),
        });
        if (res.ok) {
          revokeStatus = "revoked";
        } else if (res.status === 400 || res.status === 401) {
          // Token ya inválido — proceder igual con el borrado local.
          revokeStatus = "already_invalid";
        } else {
          const errText = await res.text().catch(() => "");
          console.error(`[calendar DELETE] revoke ${res.status}:`, errText);
          return NextResponse.json(
            { error: "No pude revocar el token en Google. Probá de nuevo en un minuto." },
            { status: 502 },
          );
        }
      } catch (err) {
        console.error("[calendar DELETE] revoke fetch failed:", err);
        return NextResponse.json(
          { error: "No pude revocar el token en Google. Probá de nuevo en un minuto." },
          { status: 502 },
        );
      }
    }
  }

  await ref.delete();

  // Audit log paralelo a otros endpoints (hub_status_history/{clientId}/entries).
  const approverEmail = session?.user?.email ?? "owner";
  try {
    await db
      .collection("hub_status_history")
      .doc(clientId)
      .collection("entries")
      .add({
        kind: "calendar_disconnect",
        changedBy: approverEmail,
        changedAt: FieldValue.serverTimestamp(),
        revokeStatus,
      });
  } catch (err) {
    console.error("[calendar DELETE] audit log failed:", err);
  }

  return NextResponse.json({ ok: true, revokeStatus });
});
