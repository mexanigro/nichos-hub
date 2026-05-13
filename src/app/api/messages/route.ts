import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { classifyMessage } from "@/lib/classify";

async function autoClassify(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<Record<string, { category: string; categoryReason: string }>> {
  const classified: Record<string, { category: string; categoryReason: string }> = {};
  const unclassified = docs.filter((doc) => !doc.data().category && doc.data().message);
  if (unclassified.length === 0) return classified;

  const results = await Promise.allSettled(
    unclassified.map(async (doc) => {
      const result = await classifyMessage(doc.data().message);
      await db.collection("provider_messages").doc(doc.id).update({
        category: result.category,
        categoryReason: result.reason,
      });
      classified[doc.id] = { category: result.category, categoryReason: result.reason };
    }),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) console.error(`[auto-classify] ${failed}/${unclassified.length} failed`);
  return classified;
}

export const GET = withOwner(async (req) => {
  const category = req.nextUrl.searchParams.get("category");

  let query = db.collection("provider_messages")
    .where("sender", "==", "client")
    .orderBy("createdAt", "desc")
    .limit(100);

  if (category) {
    query = db.collection("provider_messages")
      .where("sender", "==", "client")
      .where("category", "==", category)
      .orderBy("createdAt", "desc")
      .limit(100);
  }

  const snap = await query.get();
  const newClassifications = await autoClassify(snap.docs);

  const messages = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    ...newClassifications[doc.id],
    createdAt: doc.data().createdAt?.toDate(),
  }));

  return NextResponse.json(messages);
});

export const PATCH = withOwner(async (req) => {
  const { id, status } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id es requerido" }, { status: 400 });
  }

  const validStatuses = ["new", "read"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status invalido" }, { status: 400 });
  }

  try {
    await db.collection("provider_messages").doc(id).update({ status });
  } catch (err) {
    console.error("[api/messages PATCH]", err);
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
