import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parentId = request.nextUrl.searchParams.get("parentId");
  if (!parentId) {
    return NextResponse.json({ error: "Missing parentId" }, { status: 400 });
  }

  const db = getDb();
  const snap = await db
    .collection("provider_messages")
    .where("parentId", "==", parentId)
    .orderBy("createdAt", "asc")
    .get();

  const messages = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(messages);
}
