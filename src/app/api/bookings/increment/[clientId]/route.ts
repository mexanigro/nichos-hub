import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { TIER_LIMITS, getNextTier } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";
import type { BookingTier, TierChangeEvent } from "@/types";

/**
 * POST /api/bookings/increment/[clientId]
 *
 * Llamado por master-template y whatsapp-agentkit cuando se crea un booking.
 * Incrementa bookingCount, verifica límites del tier y auto-upgradea si corresponde.
 *
 * Body: { bookingId: string } — usado como dedup key para idempotencia.
 * Auth: CRON_SECRET header (servicios internos) o API key.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  const secret = process.env.CRON_SECRET;
  const xCronSecret = req.headers.get("x-cron-secret");
  const authorization = req.headers.get("authorization");
  const bearerToken =
    authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!secret || (xCronSecret !== secret && bearerToken !== secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip, "bookings-increment", 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { bookingId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body inválido — se espera { bookingId: string }" },
      { status: 400 },
    );
  }

  const { bookingId } = body;
  if (!bookingId || typeof bookingId !== "string") {
    return NextResponse.json(
      { error: "bookingId es requerido para deduplicación" },
      { status: 400 },
    );
  }

  const clientSnap = await db.collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (clientSnap.empty) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const clientDoc = clientSnap.docs[0];
  const clientData = clientDoc.data();
  const docId = clientDoc.id;

  const dedupRef = db
    .collection("hub_clients")
    .doc(docId)
    .collection("booking_dedup")
    .doc(bookingId);

  const dedupSnap = await dedupRef.get();
  if (dedupSnap.exists) {
    return NextResponse.json({
      bookingCount: clientData.bookingCount ?? 0,
      tier: clientData.tier ?? "base",
      upgraded: false,
      deduplicated: true,
    });
  }

  const currentTier = (clientData.tier || "base") as BookingTier;
  const currentCount = (clientData.bookingCount || 0) + 1;
  const limit = TIER_LIMITS[currentTier];

  let upgraded = false;
  let newTier = currentTier;

  const updates: Record<string, unknown> = {
    bookingCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (currentCount > limit) {
    const next = getNextTier(currentTier);
    if (next) {
      newTier = next;
      upgraded = true;

      const changeEvent: TierChangeEvent = {
        from: currentTier,
        to: next,
        reason: "auto_upgrade",
        at: new Date().toISOString(),
        bookingCountAtChange: currentCount,
      };

      updates.tier = next;
      updates.tierAutoUpgraded = true;
      updates.tierAutoUpgradedAt = FieldValue.serverTimestamp();
      updates.tierHistory = FieldValue.arrayUnion(changeEvent);
    }
  }

  await clientDoc.ref.update(updates);
  await dedupRef.set({ createdAt: FieldValue.serverTimestamp() });

  return NextResponse.json({
    bookingCount: currentCount,
    tier: newTier,
    upgraded,
    deduplicated: false,
  });
}
