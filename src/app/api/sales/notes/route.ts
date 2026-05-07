import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prospectId, text } = await request.json();

  if (!prospectId || !text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (session.user.role === "seller") {
    const doc = await db.collection("hub_prospects").doc(prospectId).get();
    if (doc.data()?.assignedSeller !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const note = {
    text,
    author: session.user.email || session.user.name || "unknown",
    createdAt: new Date(),
  };

  await db.collection("hub_prospects").doc(prospectId).update({
    notes: FieldValue.arrayUnion(note),
    lastContact: new Date(),
  });

  return NextResponse.json({ ok: true });
}
