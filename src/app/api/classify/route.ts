import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { classifyMessage } from "@/lib/classify";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { messageId } = await request.json();
  if (!messageId) {
    return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
  }

  const doc = await db.collection("provider_messages").doc(messageId).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const messageText = doc.data()?.message;
  if (!messageText) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const result = await classifyMessage(messageText);

  await db.collection("provider_messages").doc(messageId).update({
    category: result.category,
    categoryReason: result.reason,
  });

  return NextResponse.json(result);
}
