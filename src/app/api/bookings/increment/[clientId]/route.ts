import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { TIER_LIMITS, TIER_LABELS, TIER_PRICING, getNextTier } from "@/lib/pricing";
import { isRateLimited } from "@/lib/rate-limit";
import { safeCompare } from "@/lib/safe-compare";
import { sendEmail } from "@/lib/email";
import { bookingLimitWarning, bookingLimitReached } from "@/lib/email-templates";
import type { BookingTier } from "@/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://arzac.studio";
const OWNER_EMAIL = process.env.OWNER_EMAIL || "website@arzac.studio";
const WARNING_THRESHOLD = 0.8;

/**
 * POST /api/bookings/increment/[clientId]
 *
 * Llamado por master-template y whatsapp-agentkit cuando se crea un booking.
 * Incrementa bookingCount, valida límites del tier:
 *   - 80%: notifica al owner para que ofrezca upgrade
 *   - 100%: bloquea la reserva y notifica al owner
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

  if (!secret || (!safeCompare(xCronSecret, secret) && !safeCompare(bearerToken, secret))) {
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
      blocked: false,
      deduplicated: true,
    });
  }

  const currentTier = (clientData.tier || "base") as BookingTier;
  const currentCount = (clientData.bookingCount || 0);
  const limit = TIER_LIMITS[currentTier];
  const nextCount = currentCount + 1;
  const dashboardUrl = `${SITE}/clients/${docId}`;
  const businessName = clientData.businessName || clientData.name;

  // --- Soft block: si ya alcanzó el límite, rechazar la reserva ---
  if (isFinite(limit) && currentCount >= limit) {
    // Notificar al owner si no se hizo todavía este periodo
    if (!clientData.bookingLimitNotified100) {
      clientDoc.ref.update({
        bookingLimitNotified100: true,
        updatedAt: FieldValue.serverTimestamp(),
      }).catch(() => {});

      const nextTier = getNextTier(currentTier);
      const nextLabel = nextTier ? `${TIER_LABELS[nextTier]} (₪${TIER_PRICING[nextTier]}/mes)` : "";

      sendEmail({
        to: OWNER_EMAIL,
        ...bookingLimitReached({
          clientId,
          businessName,
          tier: `${TIER_LABELS[currentTier]} — upgrade a ${nextLabel}`,
          limit,
          dashboardUrl,
        }),
        tag: "booking_limit_reached",
      }).catch(() => {});
    }

    return NextResponse.json({
      blocked: true,
      bookingCount: currentCount,
      tier: currentTier,
      limit,
      message: "Límite de bookings alcanzado. Contactá a Arzac Studio para subir de plan.",
    }, { status: 429 });
  }

  // --- Incrementar ---
  const updates: Record<string, unknown> = {
    bookingCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // --- Notificación al 80% ---
  if (
    isFinite(limit) &&
    nextCount >= Math.ceil(limit * WARNING_THRESHOLD) &&
    !clientData.bookingLimitNotified80
  ) {
    updates.bookingLimitNotified80 = true;

    sendEmail({
      to: OWNER_EMAIL,
      ...bookingLimitWarning({
        clientId,
        businessName,
        tier: TIER_LABELS[currentTier],
        bookingCount: nextCount,
        limit,
        dashboardUrl,
      }),
      tag: "booking_limit_warning",
    }).catch(() => {});
  }

  // --- Notificación al 100% (justo alcanzó el límite con este booking) ---
  if (
    isFinite(limit) &&
    nextCount >= limit &&
    !clientData.bookingLimitNotified100
  ) {
    updates.bookingLimitNotified100 = true;

    sendEmail({
      to: OWNER_EMAIL,
      ...bookingLimitReached({
        clientId,
        businessName,
        tier: TIER_LABELS[currentTier],
        limit,
        dashboardUrl,
      }),
      tag: "booking_limit_reached",
    }).catch(() => {});
  }

  await clientDoc.ref.update(updates);
  await dedupRef.set({ createdAt: FieldValue.serverTimestamp() });

  return NextResponse.json({
    bookingCount: nextCount,
    tier: currentTier,
    blocked: false,
    deduplicated: false,
    ...(isFinite(limit) ? { limit, usage: Math.round((nextCount / limit) * 100) } : {}),
  });
}
