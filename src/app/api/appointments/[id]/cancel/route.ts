// Cancelación atómica con intervalo persistido; no reconstruye datos antiguos.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";

type RouteCtx = { params: Promise<{ id: string }> };
type Interval = { start: string; end: string };
const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

function validInterval(start: unknown, end: unknown): boolean {
  return typeof start === "string" && typeof end === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(start) &&
    /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(end) && end > start;
}

export const PATCH = withAgentAuth(async (req: NextRequest, ctx?) => {
  const { id } = await (ctx as RouteCtx).params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body invalido" }, { status: 400 }); }
  const clientId = body.clientId;
  if (typeof clientId !== "string" || !CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }
  try {
    const outcome = await db.runTransaction(async transaction => {
      const ref = db.collection("appointments").doc(id);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { status: 404, error: "Turno no encontrado" };
      const appointment = snapshot.data()!;
      if (appointment.clientId !== clientId) return { status: 403, error: "No autorizado" };
      if (appointment.status === "cancelled") return { status: 409, error: "Turno ya cancelado" };
      const { staffId, date, time, manifestEnd } = appointment;
      if (typeof staffId !== "string" || !staffId || typeof date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) || !validInterval(time, manifestEnd)) {
        return { status: 409, error: "occupancy_unverifiable" };
      }
      const manifestRef = db.collection("daily_manifests").doc(
        `${clientId}_${staffId}_${date}`,
      );
      const manifest = await transaction.get(manifestRef);
      const data = manifest.data();
      const intervals: Interval[] | undefined = data?.intervals;
      if (!manifest.exists || data?.clientId !== clientId || !Array.isArray(intervals) ||
          !intervals.every(i => i && validInterval(i.start, i.end))) {
        return { status: 409, error: "occupancy_unverifiable" };
      }
      const index = intervals.findIndex(i => i.start === time && i.end === manifestEnd);
      if (index < 0) return { status: 409, error: "occupancy_unverifiable" };
      const retained = [...intervals.slice(0, index), ...intervals.slice(index + 1)];
      transaction.update(ref, { status: "cancelled" });
      transaction.update(manifestRef, { intervals: retained });
      return { status: 200 };
    });
    return NextResponse.json(outcome.status === 200 ? { success: true } :
      { success: false, error: outcome.error }, { status: outcome.status });
  } catch (err) {
    console.error("[appointments/cancel] transaction error:", err);
    return NextResponse.json({ success: false, error: "Error al cancelar turno" }, { status: 500 });
  }
});
