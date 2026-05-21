// PATCH /api/appointments/[id]/cancel — cancelar un turno
// Portado de master-template src/services/db.ts (removeIntervalFromManifest)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";
import {
  parse,
  startOfDay,
  setHours,
  setMinutes,
  addMinutes,
  format,
} from "date-fns";

type RouteCtx = { params: Promise<{ id: string }> };

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

function sumarMinutos(hora: string, minutos: number): string {
  const date = new Date(2000, 0, 1);
  const [h, m] = hora.split(":").map(Number);
  const t = setMinutes(setHours(startOfDay(date), h), m);
  return format(addMinutes(t, minutos), "HH:mm");
}

export const PATCH = withAgentAuth(async (req: NextRequest, ctx?) => {
  const { id } = await (ctx as RouteCtx).params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const clientId = body.clientId as string;
  if (!clientId || !CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }

  // Leer appointment
  const appointmentRef = db.collection("appointments").doc(id);
  const appointmentSnap = await appointmentRef.get();

  if (!appointmentSnap.exists) {
    return NextResponse.json(
      { success: false, error: "Turno no encontrado" },
      { status: 404 }
    );
  }

  const appointment = appointmentSnap.data()!;

  if (appointment.clientId !== clientId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json(
      { success: false, error: "Turno ya cancelado" },
      { status: 409 }
    );
  }

  // Leer config para obtener buffer
  const configSnap = await db.collection("config").doc(clientId).get();
  const rules = (configSnap.exists ? configSnap.data()?.businessRules : {}) || {};
  const bufferMinutes =
    typeof rules.bufferMinutes === "number" ? rules.bufferMinutes : 10;

  const staffId = appointment.staffId || "";
  const dateStr = appointment.date || "";
  const time = appointment.time || "";
  const duration = appointment.duration || 30;

  // Transaccion: cancelar appointment + limpiar manifest
  const manifestId = `${clientId}_${staffId}_${dateStr}`;
  const manifestRef = db.collection("daily_manifests").doc(manifestId);

  try {
    await db.runTransaction(async (transaction) => {
      // Actualizar status del appointment
      transaction.update(appointmentRef, { status: "cancelled" });

      // Limpiar intervalo del manifest
      const manifestSnap = await transaction.get(manifestRef);
      if (!manifestSnap.exists) return;

      const intervals: { start: string; end: string }[] =
        manifestSnap.data()?.intervals ?? [];

      const endWithBuffer = sumarMinutos(time, duration + bufferMinutes);
      const filtered = intervals.filter(
        (inv) => !(inv.start === time && inv.end === endWithBuffer)
      );

      if (filtered.length < intervals.length) {
        transaction.update(manifestRef, { intervals: filtered });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[appointments/cancel] transaction error:", err);
    return NextResponse.json(
      { success: false, error: "Error al cancelar turno" },
      { status: 500 }
    );
  }
});
