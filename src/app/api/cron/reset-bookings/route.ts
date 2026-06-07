import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Cron mensual para resetear contadores de bookings.
 *
 * Ejecutar el 1ro de cada mes:
 *   Railway: `0 2 1 * *` (2am del 1ro)
 *   Vercel: { "path": "/api/cron/reset-bookings", "schedule": "0 2 1 * *" }
 *
 * - Resetea bookingCount a 0 en todos los clientes
 * - Actualiza bookingCountResetAt
 * - Limpia tierAutoUpgraded flag
 * - NO cambia el tier — Liam decide manualmente si baja a alguien
 */

const MAX_BATCH = 100;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const xCronSecret = req.headers.get("x-cron-secret");
  const authorization = req.headers.get("authorization");
  const bearerToken =
    authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  const vercelCron = req.headers.get("x-vercel-cron-signature");
  return xCronSecret === secret || bearerToken === secret || !!vercelCron;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const allClients = await db.collection("hub_clients").get();

  if (allClients.empty) {
    return NextResponse.json({ ok: true, reset: 0 });
  }

  let resetCount = 0;
  const batches: FirebaseFirestore.WriteBatch[] = [];
  let currentBatch = db.batch();
  let opsInBatch = 0;

  for (const doc of allClients.docs) {
    const data = doc.data();
    if ((data.bookingCount ?? 0) === 0 && !data.tierAutoUpgraded) continue;

    currentBatch.update(doc.ref, {
      bookingCount: 0,
      bookingCountResetAt: FieldValue.serverTimestamp(),
      tierAutoUpgraded: false,
      tierAutoUpgradedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    resetCount++;
    opsInBatch++;

    if (opsInBatch >= MAX_BATCH) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      opsInBatch = 0;
    }
  }

  if (opsInBatch > 0) {
    batches.push(currentBatch);
  }

  await Promise.all(batches.map((b) => b.commit()));

  return NextResponse.json({ ok: true, reset: resetCount });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
