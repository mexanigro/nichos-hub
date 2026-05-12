import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const GET = withOwner(async (req) => {
  const parentId = req.nextUrl.searchParams.get("parentId");
  if (!parentId) {
    return NextResponse.json({ error: "parentId es requerido" }, { status: 400 });
  }

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
});
