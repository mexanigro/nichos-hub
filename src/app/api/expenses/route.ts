import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ExpenseCategory } from "@/types";

export const GET = withOwner(async () => {

  const snap = await db
    .collection("hub_expenses")
    .orderBy("date", "desc")
    .limit(500)
    .get();

  const expenses = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      date: d.date,
      category: d.category,
      description: d.description,
      amount: d.amount,
      paymentMethod: d.paymentMethod || "",
      createdBy: d.createdBy,
      createdAt: d.createdAt?.toDate?.() || new Date(),
    };
  });

  return NextResponse.json(expenses);
});

export const POST = withOwner(async (req, session) => {

  const body = await req.json();
  const { date, category, description, amount, paymentMethod } = body as {
    date: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    paymentMethod?: string;
  };

  if (!date || !category || !description || amount == null) {
    return NextResponse.json({ error: "Campos requeridos: date, category, description, amount" }, { status: 400 });
  }

  const ref = await db.collection("hub_expenses").add({
    date,
    category,
    description,
    amount: Number(amount),
    paymentMethod: paymentMethod || "",
    createdBy: session.user.email,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
});

export const DELETE = withOwner(async (req) => {

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await db.collection("hub_expenses").doc(id).delete();
  return NextResponse.json({ ok: true });
});
