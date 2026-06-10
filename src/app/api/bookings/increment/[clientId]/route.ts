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

  const clientRef = clientSnap.docs[0].ref;
  const docId = clientSnap.docs[0].id;
  const dashboardUrl = `${SITE}/clients/${docId}`;

  const dedupRef = db
    .collection("hub_clients")
    .doc(docId)
    .collection("booking_dedup")
    .doc(bookingId);

  // Transacción: lectura de bookingCount + dedup + chequeo de límite +
  // increment + set del dedup, todo atómico para evitar races entre
  // requests concurrentes. Los emails (side effects) van DESPUÉS, porque
  // la transacción puede reintentarse.
  type Outcome =
    | { kind: "deduplicated"; bookingCount: number; tier: BookingTier }
    | { kind: "blocked"; bookingCount: number; tier: BookingTier; limit: number; notify100: boolean; businessName?: string }
    | { kind: "incremented"; nextCount: number; tier: BookingTier; limit: number; notify80: boolean; notify100: boolean; businessName?: string };

  const outcome: Outcome = await db.runTransaction(async (tx) => {
    const [clientFresh, dedupSnap] = await Promise.all([
      tx.get(clientRef),
      tx.get(dedupRef),
    ]);
    const clientData = clientFresh.data() || {};

    const currentTier = (clientData.tier || "base") as BookingTier;
    const currentCount = clientData.bookingCount || 0;
    const limit = TIER_LIMITS[currentTier];
    const nextCount = currentCount + 1;
    const businessName = clientData.businessName || clientData.name;

    if (dedupSnap.exists) {
      return { kind: "deduplicated", bookingCount: currentCount, tier: currentTier };
    }

    // --- Soft block: si ya alcanzó el límite, rechazar la reserva ---
    if (isFinite(limit) && currentCount >= limit) {
      const notify100 = !clientData.bookingLimitNotified100;
      if (notify100) {
        tx.update(clientRef, {
          bookingLimitNotified100: true,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return { kind: "blocked", bookingCount: currentCount, tier: currentTier, limit, notify100, businessName };
    }

    // --- Incrementar ---
    const updates: Record<string, unknown> = {
      bookingCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const notify80 =
      isFinite(limit) &&
      nextCount >= Math.ceil(limit * WARNING_THRESHOLD) &&
      !clientData.bookingLimitNotified80;
    if (notify80) updates.bookingLimitNotified80 = true;

    const notify100 =
      isFinite(limit) && nextCount >= limit && !clientData.bookingLimitNotified100;
    if (notify100) updates.bookingLimitNotified100 = true;

    tx.update(clientRef, updates);
    tx.set(dedupRef, { createdAt: FieldValue.serverTimestamp() });

    return { kind: "incremented", nextCount, tier: currentTier, limit, notify80, notify100, businessName };
  });

  if (outcome.kind === "deduplicated") {
    return NextResponse.json({
      bookingCount: outcome.bookingCount,
      tier: outcome.tier,
      blocked: false,
      deduplicated: true,
    });
  }

  if (outcome.kind === "blocked") {
    if (outcome.notify100) {
      const nextTier = getNextTier(outcome.tier);
      const nextLabel = nextTier ? `${TIER_LABELS[nextTier]} (₪${TIER_PRICING[nextTier]}/mes)` : "";

      sendEmail({
        to: OWNER_EMAIL,
        ...bookingLimitReached({
          clientId,
          businessName: outcome.businessName,
          tier: `${TIER_LABELS[outcome.tier]} — upgrade a ${nextLabel}`,
          limit: outcome.limit,
          dashboardUrl,
        }),
        tag: "booking_limit_reached",
      }).catch(() => {});
    }

    return NextResponse.json({
      blocked: true,
      bookingCount: outcome.bookingCount,
      tier: outcome.tier,
      limit: outcome.limit,
      message: "Límite de bookings alcanzado. Contactá a Arzac Studio para subir de plan.",
    }, { status: 429 });
  }

  // --- Notificación al 80% ---
  if (outcome.notify80) {
    sendEmail({
      to: OWNER_EMAIL,
      ...bookingLimitWarning({
        clientId,
        businessName: outcome.businessName,
        tier: TIER_LABELS[outcome.tier],
        bookingCount: outcome.nextCount,
        limit: outcome.limit,
        dashboardUrl,
      }),
      tag: "booking_limit_warning",
    }).catch(() => {});
  }

  // --- Notificación al 100% (justo alcanzó el límite con este booking) ---
  if (outcome.notify100) {
    sendEmail({
      to: OWNER_EMAIL,
      ...bookingLimitReached({
        clientId,
        businessName: outcome.businessName,
        tier: TIER_LABELS[outcome.tier],
        limit: outcome.limit,
        dashboardUrl,
      }),
      tag: "booking_limit_reached",
    }).catch(() => {});
  }

  return NextResponse.json({
    bookingCount: outcome.nextCount,
    tier: outcome.tier,
    blocked: false,
    deduplicated: false,
    ...(isFinite(outcome.limit) ? { limit: outcome.limit, usage: Math.round((outcome.nextCount / outcome.limit) * 100) } : {}),
  });
}
