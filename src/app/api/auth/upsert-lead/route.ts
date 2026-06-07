import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "upsert-lead", 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { uid, email, name, photoURL, provider, builderData, idToken } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    if (idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        if (decoded.uid !== uid) {
          return NextResponse.json({ error: "UID mismatch" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
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
