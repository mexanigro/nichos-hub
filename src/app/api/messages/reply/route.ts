import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const POST = withOwner(async (req) => {
  const { parentId, clientId, businessName, message } = await req.json();

  if (!parentId || !clientId || !message) {
    return NextResponse.json({ error: "Campos requeridos: parentId, clientId, message" }, { status: 400 });
  }

  await db.collection("provider_messages").doc(parentId).update({ status: "read" });

  const docRef = await db.collection("provider_messages").add({
    clientId,
    businessName,
    message,
    sender: "provider",
    parentId,
    status: "new",
    createdAt: new Date(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
});
