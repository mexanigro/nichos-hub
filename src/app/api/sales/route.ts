import { NextResponse } from "next/server";
import { withAuth, withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import type { ProspectStatus } from "@/types";

export const GET = withAuth(async (_req, session) => {

  let query: FirebaseFirestore.Query = db.collection("hub_prospects").orderBy("createdAt", "desc");

  if (session.user.role === "seller") {
    query = query.where("assignedSeller", "==", session.user.email);
  }

  const snap = await query.get();

  const prospects = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      businessName: d.businessName,
      city: d.city,
      nicheTarget: d.nicheTarget,
      assignedSeller: d.assignedSeller,
      lastContact: d.lastContact?.toDate(),
      notes: (d.notes || []).map((n: { text: string; author: string; createdAt: { toDate: () => Date } }) => ({
        text: n.text,
        author: n.author,
        createdAt: n.createdAt?.toDate?.() || n.createdAt,
      })),
      status: d.status,
      rejectionReason: d.rejectionReason,
      createdBy: d.createdBy,
      createdAt: d.createdAt?.toDate(),
    };
  });

  return NextResponse.json(prospects);
});

export const POST = withOwner(async (req, session) => {
  const body = await req.json();
  const { businessName, city, nicheTarget, assignedSeller } = body;

  if (!businessName || !city || !nicheTarget) {
    return NextResponse.json({ error: "Campos requeridos: businessName, city, nicheTarget" }, { status: 400 });
  }

  const docRef = await db.collection("hub_prospects").add({
    businessName,
    city,
    nicheTarget,
    assignedSeller: assignedSeller || "",
    lastContact: new Date(),
    notes: [],
    status: "following" as ProspectStatus,
    createdBy: session.user.email,
    createdAt: new Date(),
  });

  return NextResponse.json({ id: docRef.id }, { status: 201 });
});

export const PATCH = withAuth(async (req, session) => {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  if (session.user.role === "seller") {
    const doc = await db.collection("hub_prospects").doc(id).get();
    if (doc.data()?.assignedSeller !== session.user.email) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }
    const allowed = ["status", "rejectionReason", "lastContact"];
    const filtered: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) filtered[key] = updates[key];
    }
    await db.collection("hub_prospects").doc(id).update(filtered);
  } else {
    await db.collection("hub_prospects").doc(id).update(updates);
  }

  return NextResponse.json({ ok: true });
});
