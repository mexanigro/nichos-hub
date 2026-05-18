import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  try {
    const snap = await db.collection("hub_leads").doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ lead: null });
    }
    return NextResponse.json({ lead: snap.data() });
  } catch (err) {
    console.error("get-lead error:", err);
    return NextResponse.json({ error: "Failed to get lead" }, { status: 500 });
  }
}
