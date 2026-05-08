import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { parentId, clientId, businessName, message } = await request.json();

  if (!parentId || !clientId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = getDb();
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
}
