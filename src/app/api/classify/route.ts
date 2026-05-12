import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { classifyMessage } from "@/lib/classify";

export const POST = withOwner(async (req) => {
  const { messageId } = await req.json();
  if (!messageId) {
    return NextResponse.json({ error: "messageId es requerido" }, { status: 400 });
  }

  const doc = await db.collection("provider_messages").doc(messageId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  }

  const messageText = doc.data()?.message;
  if (!messageText) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const result = await classifyMessage(messageText);

  await db.collection("provider_messages").doc(messageId).update({
    category: result.category,
    categoryReason: result.reason,
  });

  return NextResponse.json(result);
});
