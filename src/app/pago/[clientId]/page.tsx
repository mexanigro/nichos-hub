import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import PagoClient from "./pago-client";

interface Props {
  params: Promise<{ clientId: string }>;
}

export default async function PagoPage({ params }: Props) {
  const { clientId } = await params;

  // Find the client doc by clientId field
  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) return notFound();

  const doc = snap.docs[0];
  const data = doc.data();

  // Check if initial payment already paid
  const paidInitial = await db
    .collection("hub_payments")
    .where("clientId", "==", clientId)
    .where("type", "==", "initial")
    .where("status", "==", "paid")
    .limit(1)
    .get();

  const isInitial = paidInitial.empty;
  const lang: "he" | "en" = data.language === "he" ? "he" : "en";

  return (
    <PagoClient
      clientId={clientId}
      clientDocId={doc.id}
      businessName={data.businessName || clientId}
      isInitial={isInitial}
      lang={lang}
    />
  );
}
