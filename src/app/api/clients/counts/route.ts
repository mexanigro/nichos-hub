import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export const GET = withOwner(async () => {
  const snap = await db.collection("hub_clients").get();

  const counts = {
    total: 0,
    active: 0,
    demo: 0,
    suspended: 0,
    trial: 0,
    maintenance: 0,
    archived: 0,
    pending_review: 0,
    pending_provision: 0,
    changes_requested: 0,
  };

  for (const doc of snap.docs) {
    const status = (doc.data().status || "active") as keyof typeof counts;
    counts.total += 1;
    if (status in counts && status !== "total") {
      counts[status] += 1;
    }
  }

  return NextResponse.json(counts);
});
