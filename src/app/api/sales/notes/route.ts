import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const POST = withAuth(async (req, session) => {
  const { prospectId, text } = await req.json();

  if (!prospectId || !text) {
    return NextResponse.json({ error: "Campos requeridos: prospectId, text" }, { status: 400 });
  }

  if (session.user.role === "seller") {
    const doc = await db.collection("hub_prospects").doc(prospectId).get();
    if (doc.data()?.assignedSeller !== session.user.email) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
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
});
