import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;

  const hubDoc = await db.collection("hub_clients").doc(clientId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const internalClientId = hubDoc.data()?.clientId;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [appointmentsSnap, customersSnap, recentBookingsSnap] = await Promise.all([
    db.collection("appointments")
      .where("clientId", "==", internalClientId)
      .count()
      .get(),
    db.collection("customers")
      .where("clientId", "==", internalClientId)
      .count()
      .get(),
    db.collection("appointments")
      .where("clientId", "==", internalClientId)
      .where("date", ">=", sevenDaysAgoStr)
      .count()
      .get(),
  ]);

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
    totalCustomers: customersSnap.data().count,
    lastBookingAt,
  });
});
