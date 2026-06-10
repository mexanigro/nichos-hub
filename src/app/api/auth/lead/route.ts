import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase-admin";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(ip, "auth-lead", 10, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  // Auth: solo el dueño del uid puede leer su lead (PII).
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.nextUrl.searchParams.get("idToken");
  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 401 });
  }
  let decodedUid: string;
  try {
    const decoded = await auth.verifyIdToken(idToken);
    decodedUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  if (decodedUid !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snap = await db.collection("hub_leads").doc(uid).get();
    if (!snap.exists) {
      return NextResponse.json({ lead: null });
    }
    // Solo devolver campos necesarios para el flujo de onboarding
    const data = snap.data() as Record<string, unknown>;
    return NextResponse.json({
      lead: {
        businessName: data.businessName,
        email: data.email,
        niche: data.niche,
        status: data.status,
      },
    });
  } catch (err) {
    console.error("get-lead error:", err);
    return NextResponse.json({ error: "Failed to get lead" }, { status: 500 });
  }
}
