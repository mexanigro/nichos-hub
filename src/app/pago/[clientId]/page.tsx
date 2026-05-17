import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import PagoClient from "./pago-client";

interface Props {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ plan?: string; upgrade?: string }>;
}

export default async function PagoPage({ params, searchParams }: Props) {
  const { clientId } = await params;
  const { plan, upgrade } = await searchParams;

  // Find the client doc by clientId field
  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) return notFound();

  const doc = snap.docs[0];
  const data = doc.data();

  const lang: "he" | "en" | "es" | "ru" = data.language === "he" ? "he" : data.language === "es" ? "es" : data.language === "ru" ? "ru" : "en";
  const defaultPlan = plan === "completo" ? "completo" : plan === "web_crm" ? "web_crm" : undefined;

  return (
    <PagoClient
      clientId={clientId}
      clientDocId={doc.id}
      businessName={data.businessName || data.name || clientId}
      lang={lang}
      defaultPlan={defaultPlan}
      isUpgrade={upgrade === "true"}
    />
  );
}
