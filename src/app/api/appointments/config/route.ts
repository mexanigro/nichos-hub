// GET /api/appointments/config — servicios, staff y reglas del negocio
// Protegido con x-agent-secret (server-to-server)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { withAgentAuth } from "@/lib/with-agent-auth";

const CLIENT_ID_RE = /^[a-zA-Z0-9_-]+$/;

export const GET = withAgentAuth(async (req: NextRequest) => {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId || !CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "clientId invalido" }, { status: 400 });
  }

  const configSnap = await db.collection("config").doc(clientId).get();
  if (!configSnap.exists) {
    return NextResponse.json({ error: "Config no encontrada" }, { status: 404 });
  }

  const config = configSnap.data()!;

  // Leer staff_overrides para schedules actualizados
  const overridesSnap = await db
    .collection("staff_overrides")
    .where("clientId", "==", clientId)
    .get();

  const overridesMap: Record<string, Record<string, unknown>> = {};
  overridesSnap.forEach((doc) => {
    const data = doc.data();
    if (data.staffId) {
      overridesMap[data.staffId] = data;
    }
  });

  // Mergear staff con overrides (schedule, blockedDates, blockedSlots, dateOverrides)
  const staffBase = (config.staff || []) as Record<string, unknown>[];
  const staff = staffBase.map((s) => {
    const override = overridesMap[s.id as string];
    if (!override) return s;
    return {
      ...s,
      schedule: override.schedule || s.schedule,
      blockedDates: override.blockedDates || s.blockedDates,
      blockedSlots: override.blockedSlots || s.blockedSlots,
      dateOverrides: override.dateOverrides || s.dateOverrides,
    };
  });

  return NextResponse.json({
    services: config.services || [],
    staff,
    businessRules: config.businessRules || {},
    businessInfo: {
      name: config.businessName || config.name || "",
      address: config.address || "",
      phone: config.phone || "",
      description: config.description || "",
    },
  });
});
