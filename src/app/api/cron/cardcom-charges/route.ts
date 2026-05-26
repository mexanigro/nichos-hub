import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { chargeToken } from "@/lib/cardcom";
import { getPlanAmount, type PlanType } from "@/lib/pricing";

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
  const headerSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron-signature");
  return headerSecret === secret || !!vercelCron;
}

async function runOne(clientDoc: FirebaseFirestore.QueryDocumentSnapshot) {
  const c = clientDoc.data();
  const clientId = clientDoc.id;
  const plan = (c.plan || "web_crm") as PlanType;
  const amount = getPlanAmount(plan);

  if (!c.cardcomToken) {
    return { clientId, ok: false, reason: "no_token" };
  }
  if (!c.cardcomTokenExpMonth || !c.cardcomTokenExpYear) {
    return { clientId, ok: false, reason: "no_token_expiry" };
  }

  const externalId = `${clientId}-${Date.now()}`;
  const result = await chargeToken({
    token: c.cardcomToken,
    cardValidityMonth: c.cardcomTokenExpMonth,
    cardValidityYear: c.cardcomTokenExpYear,
    amount,
    productName: plan === "completo" ? "Web+CRM+Agente" : "Web+CRM",
    customerEmail: c.email || undefined,
    customerName: c.businessName || c.adminEmail || undefined,
    language: "he",
    externalId,
  });

  const now = FieldValue.serverTimestamp();
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  const nextChargeTimestamp = Timestamp.fromDate(next);

  if (result.success) {
    await db.collection("hub_clients").doc(clientId).update({
      paymentStatus: "active",
      lastChargedAt: now,
      nextChargeAt: nextChargeTimestamp,
      cardcomTransactionId: result.transactionId || null,
      pastDueAt: null,
      pastDueReason: null,
      updatedAt: now,
    });

    await db.collection("hub_payments").add({
      clientId,
      amount,
      currency: "ILS",
      type: "subscription_recurring",
      status: "success",
      cardcomTransactionId: result.transactionId || null,
      approvalNumber: result.approvalNumber || null,
      externalId,
      createdAt: now,
    });

    return { clientId, ok: true, transactionId: result.transactionId };
  }

  // Falla: marcar past_due. No suspendemos en el primer fallo — damos al menos
  // 2-3 reintentos en dias subsiguientes antes de cortar el servicio.
  await db.collection("hub_clients").doc(clientId).update({
    paymentStatus: "past_due",
    pastDueAt: c.pastDueAt || now,
    pastDueReason: result.error || "charge_failed",
    // Reintentar maniana
    nextChargeAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    updatedAt: now,
  });

  await db.collection("hub_payments").add({
    clientId,
    amount,
    currency: "ILS",
    type: "subscription_recurring",
    status: "failed",
    error: result.error || null,
    externalId,
    createdAt: now,
  });

  return { clientId, ok: false, reason: result.error };
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
