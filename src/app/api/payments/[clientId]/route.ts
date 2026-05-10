import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { clientId } = await params;

  const snap = await db
    .collection("hub_payments")
    .where("clientDocId", "==", clientId)
    .orderBy("billingDate", "desc")
    .get();

  const payments = snap.docs.map((doc) => {
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
  });

  return NextResponse.json(payments);
}
