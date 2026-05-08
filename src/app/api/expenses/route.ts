import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ExpenseCategory } from "@/types";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  await db.collection("hub_expenses").doc(id).delete();
  return NextResponse.json({ ok: true });
}
