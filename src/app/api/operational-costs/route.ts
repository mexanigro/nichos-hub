import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COLLECTION = "hub_operational_costs";

export const GET = withOwner(async () => {
  const snap = await db.collection(COLLECTION).orderBy("nombre").get();

  const costs = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      nombre: d.nombre,
      monto: d.monto,
      moneda: d.moneda,
      tipo: d.tipo,
      categoria: d.categoria,
      activo: d.activo ?? true,
      notas: d.notas || "",
      createdAt: d.createdAt?.toDate?.() || new Date(),
      updatedAt: d.updatedAt?.toDate?.() || new Date(),
    };
  });

  return NextResponse.json(costs);
});

export const POST = withOwner(async (req) => {
  const body = await req.json();
  const { nombre, monto, moneda, tipo, categoria, notas } = body;

  if (!nombre || monto == null || !moneda || !tipo || !categoria) {
    return NextResponse.json(
      { error: "Campos requeridos: nombre, monto, moneda, tipo, categoria" },
      { status: 400 },
    );
  }

  const numMonto = Number(monto);
  if (isNaN(numMonto) || numMonto <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser un número positivo" },
      { status: 400 },
    );
  }

  const ref = await db.collection(COLLECTION).add({
    nombre,
    monto: numMonto,
    moneda,
    tipo,
    categoria,
    activo: true,
    notas: notas || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
});

export const PATCH = withOwner(async (req) => {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const allowed = ["nombre", "monto", "moneda", "tipo", "categoria", "activo", "notas"];
  const clean: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) clean[key] = updates[key];
  }

  if (clean.monto != null) clean.monto = Number(clean.monto);

  await db.collection(COLLECTION).doc(id).update({
    ...clean,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
});

export const DELETE = withOwner(async (req) => {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await db.collection(COLLECTION).doc(id).delete();
  return NextResponse.json({ ok: true });
});
