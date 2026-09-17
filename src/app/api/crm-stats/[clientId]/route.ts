import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { coreContactAdapterFromEnvironment, CoreContactAdapterError } from "@/lib/core-contact-adapter";
import { readContactSummary } from "@/lib/core-contact-shell";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;

  const hubDoc = await db.collection("hub_clients").doc(clientId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const internalClientId = hubDoc.data()?.clientId;
  if (typeof internalClientId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(internalClientId)) {
    return NextResponse.json({ error: "Cliente sin identidad CRM valida" }, { status: 409 });
  }

  let contactAdapter;
  try {
    contactAdapter = coreContactAdapterFromEnvironment();
    contactAdapter.assertScope(internalClientId, "hub-crm-stats");
  } catch (error) {
    const failure = error instanceof CoreContactAdapterError ? error : new CoreContactAdapterError(503, "contact_adapter_unavailable");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  let appointmentsSnap, contactSummary, recentBookingsSnap;
  try {
    [appointmentsSnap, contactSummary, recentBookingsSnap] = await Promise.all([
    db.collection("appointments")
      .where("clientId", "==", internalClientId)
      .count()
      .get(),
    readContactSummary(contactAdapter, internalClientId),
    db.collection("appointments")
      .where("clientId", "==", internalClientId)
      .where("date", ">=", sevenDaysAgoStr)
      .count()
      .get(),
    ]);
  } catch (error) {
    const failure = error instanceof CoreContactAdapterError ? error : new CoreContactAdapterError(503, "contact_projection_unavailable");
    return NextResponse.json({ error: failure.code }, { status: failure.status });
  }

  // Last booking date
  const lastBookingSnap = await db
    .collection("appointments")
    .where("clientId", "==", internalClientId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const lastBookingAt = lastBookingSnap.empty
    ? null
    : lastBookingSnap.docs[0].data().createdAt?.toDate?.() ?? null;

  return NextResponse.json({
    totalBookings: appointmentsSnap.data().count,
    bookingsThisWeek: recentBookingsSnap.data().count,
    totalCustomers: contactSummary.active,
    archivedCustomers: contactSummary.archived,
    contactsCoverage: contactSummary.coverage,
    lastBookingAt,
  });
});
