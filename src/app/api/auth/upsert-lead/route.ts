import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, name, photoURL, provider, builderData } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const ref = db.collection("hub_leads").doc(uid);

    // Builder data update only (from saveBuilderDataToLead)
    if (builderData && !email) {
      await ref.set({ builderData, lastLoginAt: new Date() }, { merge: true });
      return NextResponse.json({ ok: true });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const snap = await ref.get();

    if (snap.exists) {
      await ref.set(
        {
          email: email || "",
          name: name || "",
          photoURL: photoURL || "",
          lastLoginAt: new Date(),
        },
        { merge: true }
      );
    } else {
      await ref.set(
        {
          email: email || "",
          name: name || "",
          photoURL: photoURL || "",
          provider: provider || "google",
          plan: null,
          clientId: null,
          builderData: null,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("upsert-lead error:", err);
    return NextResponse.json(
      { error: "Failed to upsert lead" },
      { status: 500 }
    );
  }
}
