import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { chargeToken } from "@/lib/cardcom";
import { chargeDueClient, type ChargePorts, type DueClient } from "@/lib/recurring-charge";
import { safeCompare } from "@/lib/safe-compare";

/**
 * Cron mensual que ejecuta los cobros recurrentes de las suscripciones.
 *
 * Como configurar en Railway:
 *   - Cron schedule: `0 9 * * *` (diario 9am — el endpoint se ocupa de
 *     filtrar quien toca cobrar HOY mirando nextChargeAt).
 *   - Comando: `curl -H "x-cron-secret: $CRON_SECRET" https://arzac.studio/api/cron/cardcom-charges`
 *
 * Como configurar en Vercel (vercel.json):
 *   { "crons": [{ "path": "/api/cron/cardcom-charges", "schedule": "0 9 * * *" }] }
 *   (Vercel manda header `x-vercel-cron-signature`, validamos por env tambien.)
 *
 * Idempotencia: marcamos lastChargedAt = ahora antes de cobrar, y solo cobramos
 * clientes con nextChargeAt <= ahora. Si el cron corre dos veces el mismo dia,
 * la segunda vez no encuentra clientes elegibles.
 *
 * El endpoint procesa max 50 clientes por invocacion para no excederse del
 * timeout. Si hay backlog, esperar la siguiente corrida (o llamar manual).
 */
const MAX_BATCH = 50;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/cardcom-charges] CRON_SECRET no configurado");
    return false;
  }
  const xCronSecret = req.headers.get("x-cron-secret");
  const authorization = req.headers.get("authorization");
  const bearerToken =
    authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  return safeCompare(xCronSecret, secret) || safeCompare(bearerToken, secret);
}

/** P-01 (Capa A): el cobro vive en src/lib/recurring-charge.ts (puertos, con test); identidad = hub_clients.clientId (D-P1-3). */
function toDueClient(clientDoc: FirebaseFirestore.QueryDocumentSnapshot): DueClient {
  const c = clientDoc.data();
  const next = c.nextChargeAt;
  return {
    docId: clientDoc.id,
    clientId: typeof c.clientId === "string" ? c.clientId : undefined,
    businessName: c.businessName, email: c.email, adminEmail: c.adminEmail,
    cardcomToken: c.cardcomToken, cardcomTokenExpMonth: c.cardcomTokenExpMonth, cardcomTokenExpYear: c.cardcomTokenExpYear,
    paymentStatus: c.paymentStatus, pastDueAt: c.pastDueAt, plan: c.plan, tier: c.tier,
    nextChargeAt: next && typeof next.toDate === "function" ? next.toDate() : next instanceof Date ? next : null,
  };
}

const firestoreChargePorts: ChargePorts = {
  chargeToken,
  async createPayment(fields) { const ref = db.collection("hub_payments").doc(); await ref.set(fields); return ref.id; },
  async updatePayment(paymentId, fields) { await db.collection("hub_payments").doc(paymentId).update(fields); },
  async updateClient(docId, fields) { await db.collection("hub_clients").doc(docId).update(fields); },
};

function runOne(clientDoc: FirebaseFirestore.QueryDocumentSnapshot) {
  return chargeDueClient(firestoreChargePorts, toDueClient(clientDoc));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Timestamp.now();
  const due = await db
    .collection("hub_clients")
    .where("paymentStatus", "in", ["active", "past_due"])
    .where("nextChargeAt", "<=", now)
    .limit(MAX_BATCH)
    .get();

  if (due.empty) {
    return NextResponse.json({ ok: true, processed: 0, results: [] });
  }

  const results = await Promise.all(due.docs.map(runOne));
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    ok: true,
    processed: results.length,
    succeeded,
    failed,
    results,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
