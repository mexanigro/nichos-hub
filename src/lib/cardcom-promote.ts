import { db } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { verifyPayment } from "@/lib/cardcom";
import { getPlanAmount, type PlanType } from "@/lib/pricing";

export interface ProcessPaymentResult {
  ok: boolean;
  alreadyProcessed?: boolean;
  reason?: string;
  clientId?: string;
  plan?: PlanType;
  transactionId?: string;
  /** true si el cliente ya completo el wizard /info (saltar y enviar a /mi-cuenta). */
  infoSubmitted?: boolean;
  /** ISO string del proximo cobro recurrente (para mostrar al usuario). */
  nextChargeAt?: string;
}

interface LeadDoc {
  email?: string;
  name?: string;
  plan?: PlanType;
  contractVersion?: string;
  contractAcceptedAt?: Timestamp;
  contractIp?: string;
  paymentStatus?: string;
  hubClientId?: string;
  cardcomTransactionId?: string;
}

/**
 * Procesa un pago confirmado por Cardcom de punta a punta:
 *   1. Verifica con Cardcom usando lowProfileCode (idempotente del lado Cardcom).
 *   2. Actualiza hub_contract_leads con token, transactionId y paymentStatus=paid.
 *   3. Promueve a hub_clients (crea si no existe; si existe, solo toca campos de
 *      pago sin pisar businessName/niche/infoSubmitted/etc).
 *   4. Sync a clients/{clientId} para que el template tenga el flag.
 *   5. Registra el cobro inicial en hub_payments.
 *
 * Idempotente: si el lead ya tiene paymentStatus=paid + hubClientId, retorna
 * alreadyProcessed=true sin re-procesar.
 *
 * Llamado por:
 *   - /api/cardcom/verify-onboarding-payment (success page, useEffect)
 *   - /api/cardcom/webhook (server-to-server, IndicatorUrl de Cardcom)
 */
export async function processCardcomPayment(
  leadId: string,
  lowProfileCode: string,
): Promise<ProcessPaymentResult> {
  const leadRef = db.collection("hub_contract_leads").doc(leadId);
  const leadSnap = await leadRef.get();

  if (!leadSnap.exists) {
    return { ok: false, reason: "lead_not_found" };
  }

  const lead = leadSnap.data() as LeadDoc;

  // Idempotencia rapida (sin verify a Cardcom)
  if (lead.paymentStatus === "paid" && lead.hubClientId) {
    const clientSnap = await db.collection("hub_clients").doc(lead.hubClientId).get();
    const c = clientSnap.data() || {};
    return {
      ok: true,
      alreadyProcessed: true,
      clientId: lead.hubClientId,
      plan: lead.plan,
      transactionId: lead.cardcomTransactionId,
      infoSubmitted: c.infoSubmitted === true,
      nextChargeAt: c.nextChargeAt?.toDate?.().toISOString() || undefined,
    };
  }

  const verify = await verifyPayment(lowProfileCode);
  if (!verify.success) {
    await leadRef.update({
      paymentStatus: "failed",
      paymentError: verify.error || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: false, reason: verify.error || "verify_failed" };
  }

  // Decision: usar leadId como clientId. Predecible, mapeable, evita colisiones.
  // Cuando Liam provisione el sitio real puede renombrar el clientId si quiere.
  const clientId = leadId;
  const plan = (lead.plan || "web_crm") as PlanType;
  const amount = getPlanAmount(plan);

  // nextChargeAt: un mes desde hoy. Calculado fuera de la transaccion porque
  // los Date hay que materializarlos a Timestamp antes de pasar a Firestore.
  const nextChargeDate = new Date();
  nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
  const nextChargeTimestamp = Timestamp.fromDate(nextChargeDate);

  let raceSkipped = false;

  await db.runTransaction(async (tx) => {
    const freshLead = await tx.get(leadRef);
    const data = (freshLead.data() || {}) as LeadDoc;

    // Race: otro proceso (webhook vs client-side) ya promovio. No-op.
    if (data.paymentStatus === "paid" && data.hubClientId) {
      raceSkipped = true;
      return;
    }

    const now = FieldValue.serverTimestamp();
    const clientRef = db.collection("hub_clients").doc(clientId);
    const clientSnap = await tx.get(clientRef);

    // 1. Update lead
    tx.update(leadRef, {
      paymentStatus: "paid",
      status: "paid",
      cardcomTransactionId: verify.transactionId || null,
      cardcomLowProfileCode: lowProfileCode,
      cardcomToken: verify.token || null,
      cardcomTokenExpMonth: verify.cardValidityMonth || null,
      cardcomTokenExpYear: verify.cardValidityYear || null,
      cardLastFour: verify.cardLastFour || null,
      hubClientId: clientId,
      updatedAt: now,
    });

    // 2. hub_clients: crear o actualizar
    if (!clientSnap.exists) {
      tx.set(clientRef, {
        clientId,
        email: data.email || null,
        adminEmail: data.email || null,
        businessName: data.name || "",
        niche: "",
        deployUrl: "",
        plan,
        paymentStatus: "active",
        cardcomToken: verify.token || null,
        cardcomTokenExpMonth: verify.cardValidityMonth || null,
        cardcomTokenExpYear: verify.cardValidityYear || null,
        cardcomTransactionId: verify.transactionId || null,
        cardLastFour: verify.cardLastFour || null,
        contractVersion: data.contractVersion || null,
        contractAcceptedAt: data.contractAcceptedAt || now,
        contractIp: data.contractIp || null,
        lastChargedAt: now,
        nextChargeAt: nextChargeTimestamp,
        status: "pending_provision",
        infoSubmitted: false,
        source: "onboarding-pago",
        leadId,
        createdAt: now,
        activationDate: now,
      });
    } else {
      // Cliente existente (ej. paso por aca con un email que ya pago antes).
      // Solo tocar campos de pago — NUNCA pisar businessName/niche/infoSubmitted.
      tx.update(clientRef, {
        plan,
        paymentStatus: "active",
        cardcomToken: verify.token || null,
        cardcomTokenExpMonth: verify.cardValidityMonth || null,
        cardcomTokenExpYear: verify.cardValidityYear || null,
        cardcomTransactionId: verify.transactionId || null,
        cardLastFour: verify.cardLastFour || null,
        lastChargedAt: now,
        nextChargeAt: nextChargeTimestamp,
        updatedAt: now,
      });
    }

    // 3. Sync a clients/{clientId} para el template
    tx.set(
      db.collection("clients").doc(clientId),
      { status: "pending_provision", paymentStatus: "active" },
      { merge: true },
    );

    // 4. Registrar el cobro inicial en hub_payments
    const paymentRef = db.collection("hub_payments").doc();
    tx.set(paymentRef, {
      clientId,
      leadId,
      amount,
      currency: "ILS",
      type: "subscription_initial",
      status: "success",
      cardcomTransactionId: verify.transactionId || null,
      cardcomLowProfileCode: lowProfileCode,
      approvalNumber: verify.approvalNumber || null,
      createdAt: now,
    });
  });

  if (raceSkipped) {
    // Releer el lead para devolver datos consistentes
    const refresh = await leadRef.get();
    const d = refresh.data() as LeadDoc;
    const clientSnap = await db.collection("hub_clients").doc(d.hubClientId || clientId).get();
    const c = clientSnap.data() || {};
    return {
      ok: true,
      alreadyProcessed: true,
      clientId: d.hubClientId || clientId,
      plan: d.plan,
      transactionId: d.cardcomTransactionId,
      infoSubmitted: c.infoSubmitted === true,
      nextChargeAt: c.nextChargeAt?.toDate?.().toISOString() || undefined,
    };
  }

  return {
    ok: true,
    clientId,
    plan,
    transactionId: verify.transactionId,
    infoSubmitted: false,
    nextChargeAt: nextChargeTimestamp.toDate().toISOString(),
  };
}
