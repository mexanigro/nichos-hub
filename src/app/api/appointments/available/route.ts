// GET /api/appointments/available — horarios disponibles para un servicio
// Portado de master-template src/lib/booking.ts (generateSlots)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";
import {
  addMinutes,
  parse,
  startOfDay,
  isBefore,
  isAfter,
  setHours,
  setMinutes,
  getDay,
  isSameDay,
  addHours,
  format,
} from "date-fns";
import type {
  StaffMember,
  AppointmentService,
  Appointment,
  WorkDay,
  DateOverride,
} from "@/types";

// --- Constantes de scheduling (portadas de master-template constants.ts) ---
const SLOT_INTERVAL = 15;
const DEFAULT_DURATION = 30;
const DEFAULT_BUFFER = 10;
const DEFAULT_MIN_ADVANCE_HOURS = 0;

// --- Helpers ---

function parseTimeString(time: string, date: Date): Date {
  const [hours, minutes] = time.split(":").map(Number);
  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

function getWorkDayForDate(
  date: Date,
  schedule: StaffMember["schedule"]
): WorkDay {
  const dayIndex = getDay(date);
  const days: (keyof StaffMember["schedule"])[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return schedule[days[dayIndex]];
}

function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}

function generarSlots(
  date: Date,
  staff: StaffMember,
  servicio: AppointmentService,
  citasExistentes: Appointment[],
  bufferMinutes: number,
  minAdvanceHours: number
): string[] {
  const slots: string[] = [];
  const dateStr = format(date, "yyyy-MM-dd");

  const override = staff.dateOverrides?.[dateStr] as DateOverride | undefined;
  if (override?.type === "dayOff") return [];

  const workDay = getWorkDayForDate(date, staff.schedule);
  if (!workDay.isOpen && !override) return [];

  const effectiveHours =
    override?.type === "customHours"
      ? { start: override.start, end: override.end }
      : workDay.hours;

  const dayStart = parseTimeString(effectiveHours.start, date);
  const dayEnd = parseTimeString(effectiveHours.end, date);

  // Hora actual en Israel para filtrar slots pasados
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jerusalem" })
  );
  const minBookable = addHours(now, minAdvanceHours);

  let currentTime = dayStart;

  while (isBefore(currentTime, dayEnd)) {
    const slotStart = currentTime;
    const slotEnd = addMinutes(slotStart, servicio.duration);
    const slotEndWithBuffer = addMinutes(slotEnd, bufferMinutes);

    const isPast = isBefore(slotStart, now);
    const violatesMinAdvance =
      isSameDay(date, now) && isBefore(slotStart, minBookable);
    const exceedsWorkHours = isAfter(slotEnd, dayEnd);

    const overlapsBreak = workDay.breaks.some((brk) => {
      const breakStart = parseTimeString(brk.start, date);
      const breakEnd = parseTimeString(brk.end, date);
      return isOverlapping(slotStart, slotEnd, breakStart, breakEnd);
    });

    const hasOverlap = citasExistentes.some((app) => {
      if (
        app.date !== dateStr ||
        app.staffId !== staff.id ||
        app.status === "cancelled"
      )
        return false;
      const appStart = parse(app.time, "HH:mm", startOfDay(date));
      const appEnd = addMinutes(appStart, app.duration || DEFAULT_DURATION);
      const appEndWithBuffer = addMinutes(appEnd, bufferMinutes);
      return isOverlapping(slotStart, slotEndWithBuffer, appStart, appEndWithBuffer);
    });

    const hasBlockedSlot = staff.blockedSlots?.some((block) => {
      if (block.date !== dateStr) return false;
      const blockStart = parseTimeString(block.start, date);
      const blockEnd = parseTimeString(block.end, date);
      return isOverlapping(slotStart, slotEnd, blockStart, blockEnd);
    });

    const isBlockedDate = staff.blockedDates?.includes(dateStr);

    if (
      !isPast &&
      !violatesMinAdvance &&
      !exceedsWorkHours &&
      !overlapsBreak &&
      !hasOverlap &&
      !hasBlockedSlot &&
      !isBlockedDate
    ) {
      slots.push(format(slotStart, "HH:mm"));
    }

    currentTime = addMinutes(currentTime, SLOT_INTERVAL);
  }

  return slots;
}

// --- Route handler ---

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const GET = withAgentAuth(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const clientId = params.get("clientId");
  const dateStr = params.get("date");
  const serviceId = params.get("serviceId");
  const staffId = params.get("staffId");

  if (!clientId || !CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }
  if (!dateStr || !DATE_RE.test(dateStr)) {
    return NextResponse.json(
      { error: "date invalido (YYYY-MM-DD)" },
      { status: 400 }
    );
  }
  if (!serviceId) {
    return NextResponse.json(
      { error: "serviceId requerido" },
      { status: 400 }
    );
  }

  // Leer config
  const configSnap = await db.collection("config").doc(clientId).get();
  if (!configSnap.exists) {
    return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });
  }
  const config = configSnap.data()!;

  // Buscar servicio
  const services = (config.services || []) as AppointmentService[];
  const servicio = services.find((s) => s.id === serviceId);
  if (!servicio) {
    return NextResponse.json(
      { error: "Servicio no encontrado" },
      { status: 404 }
    );
  }

  // Business rules
  const rules = (config.businessRules || {}) as Record<string, unknown>;
  const bufferMinutes =
    typeof rules.bufferMinutes === "number" ? rules.bufferMinutes : DEFAULT_BUFFER;
  const minAdvanceHours =
    typeof rules.minAdvanceBookingHours === "number"
      ? rules.minAdvanceBookingHours
      : DEFAULT_MIN_ADVANCE_HOURS;

  // Determinar staff a consultar
  const allStaff = (config.staff || []) as StaffMember[];
  const staffList = staffId
    ? allStaff.filter((s) => s.id === staffId)
    : allStaff;

  if (staffList.length === 0) {
    return NextResponse.json(
      { error: "Staff no encontrado" },
      { status: 404 }
    );
  }

  // Leer overrides y appointments en paralelo
  const date = parse(dateStr, "yyyy-MM-dd", new Date());

  const [overridesSnap, appointmentsSnap] = await Promise.all([
    db.collection("staff_overrides").where("clientId", "==", clientId).get(),
    db
      .collection("appointments")
      .where("clientId", "==", clientId)
      .where("date", "==", dateStr)
      .where("status", "!=", "cancelled")
      .get(),
  ]);

  // Mapear overrides por staffId
  const overridesMap: Record<string, Record<string, unknown>> = {};
  overridesSnap.forEach((doc) => {
    const data = doc.data();
    if (data.staffId) overridesMap[data.staffId] = data;
  });

  // Parsear appointments existentes
  const citasExistentes: Appointment[] = [];
  appointmentsSnap.forEach((doc) => {
    citasExistentes.push({ id: doc.id, ...doc.data() } as Appointment);
  });

  // Generar slots por cada staff member
  const resultado: {
    staffId: string;
    staffName: string;
    slots: string[];
  }[] = [];

  for (const s of staffList) {
    const override = overridesMap[s.id];
    const staffConOverrides: StaffMember = override
      ? {
          ...s,
          schedule: (override.schedule as StaffMember["schedule"]) || s.schedule,
          blockedDates: (override.blockedDates as string[]) || s.blockedDates,
          blockedSlots:
            (override.blockedSlots as StaffMember["blockedSlots"]) ||
            s.blockedSlots,
          dateOverrides:
            (override.dateOverrides as StaffMember["dateOverrides"]) ||
            s.dateOverrides,
        }
      : s;

    const slots = generarSlots(
      date,
      staffConOverrides,
      servicio,
      citasExistentes,
      bufferMinutes,
      minAdvanceHours
    );

    resultado.push({
      staffId: s.id,
      staffName: s.name,
      slots,
    });
  }

  return NextResponse.json({
    date: dateStr,
    service: {
      id: servicio.id,
      name: servicio.name,
      duration: servicio.duration,
      price: servicio.price,
    },
    availability: resultado,
  });
});
