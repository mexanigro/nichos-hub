import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const POST = withOwner(async (req, session) => {
  const { prospectId, text } = await req.json();

  if (!prospectId || !text) {
    return NextResponse.json({ error: "Campos requeridos: prospectId, text" }, { status: 400 });
  }

  const note = {
    text,
    author: session.user.email || session.user.name || "unknown",
    createdAt: new Date(),
  };

  try {
    await db.collection("hub_prospects").doc(prospectId).update({
      notes: FieldValue.arrayUnion(note),
      lastContact: new Date(),
    });
  } catch (err) {
    console.error("[api/sales/notes POST]", err);
    return NextResponse.json({ error: "Error al agregar nota" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
});
