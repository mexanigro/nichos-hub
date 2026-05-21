// POST /api/appointments/book — reservar un turno con transaccion
// Portado de master-template src/services/db.ts (saveAppointment)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";
import { FieldValue } from "firebase-admin/firestore";
import {
  parse,
  startOfDay,
  setHours,
  setMinutes,
  addMinutes,
  isBefore,
  isAfter,
  format,
} from "date-fns";
import type { AppointmentService } from "@/types";

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parseTime(time: string, date: Date): Date {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(startOfDay(date), h), m);
}

function sumarMinutos(hora: string, minutos: number): string {
  const date = new Date(2000, 0, 1);
  const t = parseTime(hora, date);
  return format(addMinutes(t, minutos), "HH:mm");
}

export const POST = withAgentAuth(async (req: NextRequest) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { clientId, customerName, customerPhone, serviceId, staffId, date, time } =
    body as Record<string, string>;

  if (!clientId || !CLIENT_ID_RE.test(clientId))
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  if (!customerName)
    return NextResponse.json({ error: "customerName requerido" }, { status: 400 });
  if (!customerPhone)
    return NextResponse.json({ error: "customerPhone requerido" }, { status: 400 });
  if (!serviceId)
    return NextResponse.json({ error: "serviceId requerido" }, { status: 400 });
  if (!staffId)
    return NextResponse.json({ error: "staffId requerido" }, { status: 400 });
  if (!date || !DATE_RE.test(date))
    return NextResponse.json({ error: "date invalido (YYYY-MM-DD)" }, { status: 400 });
  if (!time || !TIME_RE.test(time))
    return NextResponse.json({ error: "time invalido (HH:mm)" }, { status: 400 });

  // Leer config para obtener duracion del servicio y buffer
  const configSnap = await db.collection("config").doc(clientId).get();
  if (!configSnap.exists) {
    return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });
  }
  const config = configSnap.data()!;
  const services = (config.services || []) as AppointmentService[];
  const servicio = services.find((s) => s.id === serviceId);
  if (!servicio) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const staffList = (config.staff || []) as { id: string; name: string }[];
  const staffInfo = staffList.find((s) => s.id === staffId);
  if (!staffInfo) {
    return NextResponse.json({ error: "Staff no encontrado" }, { status: 404 });
  }

  const rules = (config.businessRules || {}) as Record<string, unknown>;
  const bufferMinutes =
    typeof rules.bufferMinutes === "number" ? rules.bufferMinutes : 10;

  const customerEmail = `wa_${customerPhone.replace(/\+/g, "")}@whatsapp.local`;
  const duration = servicio.duration;
  const endWithBuffer = sumarMinutos(time, duration + bufferMinutes);

  // Transaccion: verificar conflicto + escribir appointment + actualizar manifest
  const manifestId = `${clientId}_${staffId}_${date}`;
  const manifestRef = db.collection("daily_manifests").doc(manifestId);

  try {
    const appointmentId = await db.runTransaction(async (transaction) => {
      const manifestSnap = await transaction.get(manifestRef);
      const occupiedIntervals: { start: string; end: string }[] = manifestSnap.exists
        ? (manifestSnap.data()?.intervals ?? [])
        : [];

      // Verificar conflicto contra intervals existentes en el manifest
      const dateObj = parse(date, "yyyy-MM-dd", new Date());
      const slotStart = parseTime(time, dateObj);
      const slotEndWithBuffer = addMinutes(slotStart, duration + bufferMinutes);

      const conflict = occupiedIntervals.some((inv) => {
        const invStart = parseTime(inv.start, dateObj);
        const invEnd = parseTime(inv.end, dateObj);
        return isBefore(slotStart, invEnd) && isAfter(slotEndWithBuffer, invStart);
      });

      if (conflict) {
        throw new Error("CONFLICT");
      }

      // Escribir appointment
      const docRef = db.collection("appointments").doc();
      transaction.set(docRef, {
        clientId,
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        staffId,
        date,
        time,
        duration,
        status: "confirmed",
        createdAt: FieldValue.serverTimestamp(),
      });

      // Actualizar manifest
      const newIntervals = [
        ...occupiedIntervals,
        { start: time, end: endWithBuffer },
      ];
      transaction.set(manifestRef, {
        clientId,
        intervals: newIntervals,
      });

      return docRef.id;
    });

    // Fire-and-forget: upsert customer
    db.collection("customers")
      .doc(`${clientId}_${customerPhone.replace(/\+/g, "")}`)
      .set(
        {
          clientId,
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          source: "whatsapp",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
      .catch((err) =>
        console.warn("[appointments/book] customer upsert failed:", err)
      );

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointmentId,
        date,
        time,
        duration,
        staffName: staffInfo.name,
        serviceName: servicio.name,
        customerName,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "CONFLICT") {
      return NextResponse.json(
        { success: false, error: "Horario no disponible, ya fue reservado" },
        { status: 409 }
      );
    }
    console.error("[appointments/book] transaction error:", msg);
    return NextResponse.json(
      { success: false, error: "Error al reservar turno" },
      { status: 500 }
    );
  }
});
