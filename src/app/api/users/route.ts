import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const GET = withOwner(async () => {

  const snap = await db.collection("hub_users").get();
  const users = snap.docs.map((doc) => ({
    email: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(users);
});

export const POST = withOwner(async (req) => {
  const { email, name } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
  }

  await db.collection("hub_users").doc(email.toLowerCase()).set({
    name: name || email.split("@")[0],
    role: "seller",
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withOwner(async (req) => {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
  }

  await db.collection("hub_users").doc(email.toLowerCase()).delete();
  return NextResponse.json({ ok: true });
});
