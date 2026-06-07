import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { ProspectFollowUpStatus, ProspectChannel } from "@/types";

const COLLECTION = "hub_prospect_followups";

function computeFollowUpDue(
  status: ProspectFollowUpStatus,
  webSentAt?: string
): string | null {
  if (status !== "web_sent" || !webSentAt) return null;
  const sent = new Date(webSentAt);
  const day3 = new Date(sent);
  day3.setDate(day3.getDate() + 3);
  return day3.toISOString();
}

export const GET = withOwner(async (req) => {
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const pendingOnly = searchParams.get("pending") === "true";

  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (statusFilter) {
    query = query.where("status", "==", statusFilter);
  }

  const snap = await query.orderBy("updatedAt", "desc").get();
  const now = new Date();

  const prospects = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt,
    } as Record<string, any> & { id: string };
  });

  if (pendingOnly) {
    const pending = prospects.filter((p) => {
      if (!p.followUpDue) return false;
      return new Date(p.followUpDue as string) <= now &&
        !["paid", "not_interested"].includes(p.status as string);
    });
    return NextResponse.json(pending);
  }

  return NextResponse.json(prospects);
});

export const POST = withOwner(async (req) => {
  const body = await req.json();
  const {
    clientId,
    businessName,
    contactName,
    contactPhone,
    niche,
    deployUrl,
    status = "web_created",
  } = body;

  if (!businessName) {
    return NextResponse.json(
      { error: "businessName es requerido" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const doc = {
    clientId: clientId || null,
    businessName,
    contactName: contactName || null,
    contactPhone: contactPhone || null,
    niche: niche || null,
    deployUrl: deployUrl || null,
    status,
    statusHistory: [{ status, date: now }],
    webSentAt: null,
    webSentVia: null,
    followUpDue: null,
    lastContactAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection(COLLECTION).add(doc);
  return NextResponse.json({ id: ref.id });
});

export const PATCH = withOwner(async (req) => {
  const body = await req.json();
  const { id, status, note, channel, webSentAt } = body as {
    id: string;
    status?: ProspectFollowUpStatus;
    note?: string;
    channel?: ProspectChannel;
    webSentAt?: string;
  };

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const current = snap.data()!;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (status) {
    updates.status = status;
    const now = new Date().toISOString();
    updates.statusHistory = [
      ...(current.statusHistory || []),
      { status, date: now, note: note || undefined },
    ];
    updates.lastContactAt = now;

    if (status === "web_sent") {
      const sentAt = webSentAt || now;
      updates.webSentAt = sentAt;
      updates.webSentVia = channel || null;
      updates.followUpDue = computeFollowUpDue("web_sent", sentAt);
    }

    if (status === "paid" || status === "not_interested") {
      updates.followUpDue = null;
    }
  }

  await ref.update(updates);
  return NextResponse.json({ ok: true });
});

export const DELETE = withOwner(async (req) => {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }
  await db.collection(COLLECTION).doc(id).delete();
  return NextResponse.json({ ok: true });
});
