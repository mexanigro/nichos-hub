import { db } from "@/lib/firebase-admin";
import type { Payment } from "@/types";

function mapPaymentDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Payment {
  const d = doc.data();
  return {
    id: doc.id,
    clientId: d.clientId,
    clientDocId: d.clientDocId,
    businessName: d.businessName,
    amount: d.amount,
    currency: d.currency,
    type: d.type ?? "recurring",
    status: d.status,
    billingDate: d.billingDate?.toDate(),
    nextBillingDate: d.nextBillingDate?.toDate(),
    cardLastFour: d.cardLastFour,
    failureReason: d.failureReason,
    cardcomTransactionId: d.cardcomTransactionId,
    contractAccepted: d.contractAccepted ?? false,
    contractAcceptedAt: d.contractAcceptedAt?.toDate(),
    contractVersion: d.contractVersion,
    createdAt: d.createdAt?.toDate(),
    updatedAt: d.updatedAt?.toDate(),
  };
}

export async function listPayments(): Promise<Payment[]> {
  const snap = await db
    .collection("hub_payments")
    .orderBy("billingDate", "desc")
    .get();
  return snap.docs.map(mapPaymentDoc);
}

export async function listClientPayments(clientDocId: string): Promise<Payment[]> {
  const snap = await db
    .collection("hub_payments")
    .where("clientDocId", "==", clientDocId)
    .orderBy("billingDate", "desc")
    .get();
  return snap.docs.map(mapPaymentDoc);
}
