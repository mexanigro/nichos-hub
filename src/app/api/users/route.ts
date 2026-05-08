import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/firebase-admin";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const snap = await db.collection("hub_users").get();
  const users = snap.docs.map((doc) => ({
    email: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const db = getDb();
  await db.collection("hub_users").doc(email.toLowerCase()).set({
    name: name || email.split("@")[0],
    role: "seller",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const db = getDb();
  await db.collection("hub_users").doc(email.toLowerCase()).delete();
  return NextResponse.json({ ok: true });
}
