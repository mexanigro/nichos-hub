import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "hub_operational_costs";

const SEED_DATA = [
  {
    nombre: "Claude",
    monto: 200,
    moneda: "USD",
    tipo: "fijo",
    categoria: "ai",
  },
  {
    nombre: "ChatGPT",
    monto: 70,
    moneda: "ILS",
    tipo: "fijo",
    categoria: "ai",
    notas: "~$24 USD/mes",
  },
  {
    nombre: "Figma",
    monto: 20,
    moneda: "USD",
    tipo: "fijo",
    categoria: "tools",
  },
  {
    nombre: "Google Workspace",
    monto: 20,
    moneda: "USD",
    tipo: "fijo",
    categoria: "tools",
  },
  {
    nombre: "Cardcom",
    monto: 330,
    moneda: "ILS",
    tipo: "fijo",
    categoria: "payments",
    notas: "~$113 USD/mes. Plataforma de cobros.",
  },
  {
    nombre: "Vercel Pro",
    monto: 20,
    moneda: "USD",
    tipo: "fijo",
    categoria: "infra",
  },
  {
    nombre: "Railway (Hub + WhatsApp)",
    monto: 13,
    moneda: "USD",
    tipo: "fijo",
    categoria: "infra",
  },
  {
    nombre: "WhatsApp/Twilio por cliente",
    monto: 10,
    moneda: "USD",
    tipo: "variable",
    categoria: "infra",
    notas: "Mediana estimada. Rango: $3-18/mes. Extremo (300+ bookings): $25-40/mes.",
  },
];

export const POST = withOwner(async () => {
  const existing = await db.collection(COLLECTION).limit(1).get();
  if (!existing.empty) {
    return NextResponse.json(
      { error: "Ya existen costos operativos. Eliminá todos antes de re-seed." },
      { status: 409 },
    );
  }

  const batch = db.batch();
  for (const item of SEED_DATA) {
    const ref = db.collection(COLLECTION).doc();
    batch.set(ref, {
      ...item,
      activo: true,
      notas: item.notas || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return NextResponse.json({ seeded: SEED_DATA.length });
});
