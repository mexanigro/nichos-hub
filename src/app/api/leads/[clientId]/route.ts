import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;

  // clientId here is the hub doc ID — resolve the internal clientId
  const hubDoc = await db.collection("hub_clients").doc(clientId).get();
  if (!hubDoc.exists) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  const internalClientId = hubDoc.data()?.clientId;

  const snap = await db
    .collection("contact_inbox")
    .where("clientId", "==", internalClientId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const leads = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate(),
  }));

  return NextResponse.json(leads);
});
