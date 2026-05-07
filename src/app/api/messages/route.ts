import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const category = request.nextUrl.searchParams.get("category");

  let query = db.collection("provider_messages")
    .where("sender", "==", "client")
    .orderBy("createdAt", "desc")
    .limit(100);

  if (category) {
    query = db.collection("provider_messages")
      .where("sender", "==", "client")
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .limit(100);
  }

  const snap = await query.get();

  const messages = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(messages);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing message id" }, { status: 400 });
  }

  await db.collection("provider_messages").doc(id).update({ status });
  return NextResponse.json({ ok: true });
}
