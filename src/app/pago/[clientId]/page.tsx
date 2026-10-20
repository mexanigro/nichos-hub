import type { Metadata } from "next";
import { cache } from "react";
import { db } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { idiomaDePago, metadataDePago } from "@/lib/pago-idioma";
import PagoClient from "./pago-client";

interface Props {
  params: Promise<{ clientId: string }>;
}

// Find the client doc by clientId field (una sola lectura para la metadata y la página).
const buscarCliente = cache(async (clientId: string) => {
  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0];
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientId } = await params;
  const doc = await buscarCliente(clientId);
  return { ...metadataDePago(idiomaDePago(doc?.data().language)), robots: { index: false, follow: false } };
}

export default async function PagoPage({ params }: Props) {
  const { clientId } = await params;
  const doc = await buscarCliente(clientId);
  if (!doc) return notFound();

  const data = doc.data();
  const lang = idiomaDePago(data.language);

  return (
    <PagoClient
      clientId={clientId}
      clientDocId={doc.id}
      businessName={data.businessName || data.name || clientId}
      lang={lang}
    />
  );
}
