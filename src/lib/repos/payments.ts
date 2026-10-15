import { db } from "@/lib/firebase-admin";
import type { Payment } from "@/types";
import { estadoMostrado, fechaDePago, ordenarPagos, tipoMostrado } from "@/lib/pago-mostrado";

function mapPaymentDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Payment {
  const d = doc.data();
  const fechas = { billingDate: aFecha(d.billingDate), createdAt: aFecha(d.createdAt) };
  return {
    id: doc.id,
    clientId: d.clientId,
    clientDocId: d.clientDocId,
    businessName: d.businessName,
    amount: d.amount,
    currency: d.currency,
    type: tipoMostrado(d.type),
    status: estadoMostrado(d.status),
    billingDate: fechaDePago(fechas) as Date,
    nextBillingDate: d.nextBillingDate?.toDate(),
    cardLastFour: d.cardLastFour,
    failureReason: d.failureReason,
    cardcomTransactionId: d.cardcomTransactionId,
    contractAccepted: d.contractAccepted ?? false,
    contractAcceptedAt: d.contractAcceptedAt?.toDate(),
    contractVersion: d.contractVersion,
    createdAt: fechas.createdAt as Date,
    updatedAt: d.updatedAt?.toDate(),
  };
}

/** Timestamp de Firestore o Date (el cron escribe Date) → Date. */
function aFecha(v: unknown): Date | undefined {
  if (v instanceof Date) return v;
  if (v && typeof (v as { toDate?: unknown }).toDate === "function") return (v as { toDate(): Date }).toDate();
  return undefined;
}

// Sin orderBy en la consulta: Firestore deja afuera los documentos sin el campo del orden, y los cobros del cron no
// tienen billingDate. Se ordena en memoria por billingDate o createdAt (ponytail: lee la colección entera; paginar
// cuando haya miles de pagos).
export async function listPayments(): Promise<Payment[]> {
  const snap = await db.collection("hub_payments").get();
  return ordenarPagos(snap.docs.map(mapPaymentDoc));
}

export async function listClientPayments(clientDocId: string): Promise<Payment[]> {
  const snap = await db
    .collection("hub_payments")
    .where("clientDocId", "==", clientDocId)
    .get();
  return ordenarPagos(snap.docs.map(mapPaymentDoc));
}
