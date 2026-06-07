import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { TIER_ORDER } from "@/lib/pricing";
import type { BookingTier, TierChangeEvent } from "@/types";

/**
 * PUT /api/clients/[clientId]/tier
 *
 * Cambio manual de tier (solo owner). Registra en tierHistory.
 * Body: { tier: "base" | "pro" | "enterprise" }
 */
export const PUT = withOwner(async (req, _session, ctx) => {
  const { clientId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const newTier = body.tier as BookingTier;

  if (!newTier || !TIER_ORDER.includes(newTier)) {
    return NextResponse.json(
      { error: "tier inválido. Valores: base, pro, enterprise" },
      { status: 400 },
    );
  }

  const doc = await db.collection("hub_clients").doc(clientId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  const data = doc.data()!;
  const currentTier = (data.tier || "base") as BookingTier;

  if (currentTier === newTier) {
    return NextResponse.json({ ok: true, tier: newTier, unchanged: true });
  }

  const changeEvent: TierChangeEvent = {
    from: currentTier,
    to: newTier,
    reason: "manual",
    at: new Date().toISOString(),
    bookingCountAtChange: data.bookingCount || 0,
  };

  await doc.ref.update({
    tier: newTier,
    tierAutoUpgraded: false,
    tierAutoUpgradedAt: null,
    tierHistory: FieldValue.arrayUnion(changeEvent),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    tier: newTier,
    previousTier: currentTier,
  });
});
