import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyPayment, checkPaymentTerminal, TERMINAL, SANDBOX } from "@/lib/cardcom";
import { FieldValue } from "firebase-admin/firestore";
import { isRateLimited } from "@/lib/rate-limit";
import { creditVerifiedPayment, type CreditPorts } from "@/lib/payment-credit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "verify-payment", 10, 60_000)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }

  let body: { lowProfileCode?: string; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { lowProfileCode, clientId } = body;

  if (!lowProfileCode || !clientId) {
    return NextResponse.json(
      { error: "lowProfileCode y clientId son requeridos" },
      { status: 400 },
    );
  }

  // Idempotencia antes de llamar a Cardcom (mismo comportamiento que antes): un lowProfileCode ya acreditado no se re-verifica.
  const ports = firestoreCreditPorts();
  const already = await ports.findPaidByLowProfile(lowProfileCode);
  if (already) {
    return NextResponse.json({ success: true, transactionId: already.transactionId, cardLastFour: already.cardLastFour, alreadyVerified: true });
  }

  const result = await verifyPayment(lowProfileCode);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Validar el terminal ANTES de marcar el pago como pagado o activar al
  // cliente: un cobro del terminal de prueba (credenciales de sandbox mezcladas
  // en un deploy productivo) no puede acreditarse como real. Fail closed.
  const terminalCheck = checkPaymentTerminal({
    reported: result.terminalNumber,
    expected: TERMINAL,
    sandboxMode: SANDBOX,
    isProduction: process.env.NODE_ENV === "production",
  });
  if (!terminalCheck.ok) {
    console.error("[verify-payment] ALERTA: terminal invalido, no se acredita", {
      clientId,
      lowProfileCode,
      reason: terminalCheck.reason,
      detail: terminalCheck.detail,
    });
    // Mensaje generico al cliente — el motivo queda solo en el log.
    return NextResponse.json(
      { error: "El pago no pudo ser validado" },
      { status: 409 },
    );
  }
  if (!result.terminalNumber) {
    console.warn("[verify-payment] Cardcom no devolvió TerminalNumber — solo se validó el configurado", {
      clientId,
      lowProfileCode,
    });
  }

  if (result.returnValue && result.returnValue !== clientId) {
    return NextResponse.json(
      { error: "clientId no coincide con el pago" },
      { status: 403 },
    );
  }

  // P-01 (Capa A): la acreditación vive en src/lib/payment-credit.ts (puertos, con test). Persiste el token de
  // Cardcom, su vigencia, últimos 4, nextChargeAt (+1 mes) y activa al cliente demo (D-P1-1); idempotente por lowProfileCode.
  const credit = await creditVerifiedPayment(ports, { clientId, lowProfileCode, verify: result });

  if (credit.outcome === "already_verified") {
    return NextResponse.json({ success: true, transactionId: credit.transactionId, cardLastFour: credit.cardLastFour, alreadyVerified: true });
  }
  if (credit.outcome === "amount_mismatch") {
    console.error("[verify-payment] ALERTA: monto cobrado no coincide con el esperado", { clientId, lowProfileCode, charged: credit.charged, expected: credit.expected });
    return NextResponse.json({ error: "El monto del pago no coincide con el esperado" }, { status: 409 });
  }
  if (credit.outcome === "no_pending") {
    console.warn("[verify-payment] no pending payment found", { clientId, lowProfileCode });
    return NextResponse.json({ error: "No se encontro un pago pendiente para este cliente" }, { status: 404 });
  }
  if (result.amount === undefined) {
    console.warn("[verify-payment] Cardcom no devolvió monto (Sum36) — no se pudo validar", { clientId, lowProfileCode });
  }
  if (!credit.clientDocId) {
    console.warn("[verify-payment] pago acreditado sin hub_clients para clientId", { clientId, lowProfileCode });
  }

  return NextResponse.json({
    success: true,
    transactionId: result.transactionId,
    cardLastFour: result.cardLastFour,
    activated: credit.activated,
    nextChargeAt: credit.nextChargeAt.toISOString(),
  });
}

/** Puertos Firestore para creditVerifiedPayment (hub_payments / hub_clients por campo clientId). */
function firestoreCreditPorts(): CreditPorts {
  return {
    async findPaidByLowProfile(lowProfileCode) {
      const snap = await db.collection("hub_payments").where("cardcomLowProfileCode", "==", lowProfileCode).where("status", "==", "paid").limit(1).get();
      if (snap.empty) return null;
      const d = snap.docs[0].data();
      return { transactionId: d.cardcomTransactionId ?? null, cardLastFour: d.cardLastFour ?? null };
    },
    async findLatestPending(clientId) {
      const snap = await db.collection("hub_payments").where("clientId", "==", clientId).where("status", "==", "pending").orderBy("createdAt", "desc").limit(1).get();
      if (snap.empty) return null;
      const d = snap.docs[0].data();
      return { id: snap.docs[0].id, amount: typeof d.amount === "number" ? d.amount : undefined, type: d.type };
    },
    async markPaid(paymentId, fields) {
      const ref = db.collection("hub_payments").doc(paymentId);
      return db.runTransaction(async (tx) => {
        const fresh = await tx.get(ref);
        if (!fresh.exists || fresh.data()?.status !== "pending") return false;
        tx.update(ref, { ...fields, updatedAt: FieldValue.serverTimestamp() });
        return true;
      });
    },
    async findClient(clientId) {
      const snap = await db.collection("hub_clients").where("clientId", "==", clientId).limit(1).get();
      if (snap.empty) return null;
      return { id: snap.docs[0].id, status: snap.docs[0].data().status };
    },
    async updateClient(docId, fields) {
      await db.collection("hub_clients").doc(docId).update({ ...fields, updatedAt: FieldValue.serverTimestamp() });
    },
  };
}
