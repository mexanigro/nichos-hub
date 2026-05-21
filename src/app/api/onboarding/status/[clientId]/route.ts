import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const { clientId } = await params;

  // Find hub_clients doc by clientId field
  const snap = await db
    .collection("hub_clients")
    .where("clientId", "==", clientId)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const doc = snap.docs[0];
  const data = doc.data();
  const projectId = data.vercelProjectId;

  if (!projectId || !VERCEL_TOKEN) {
    return NextResponse.json({
      status: data.deployStatus || "pending",
      domain: data.domain,
    });
  }

  // Check Vercel deployment status
  try {
    const url = new URL(
      `/v6/deployments?projectId=${projectId}&limit=1`,
      "https://api.vercel.com",
    );
    if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });

    if (res.ok) {
      const { deployments } = await res.json();
      if (deployments && deployments.length > 0) {
        const latest = deployments[0];
        const vercelState = latest.state || latest.readyState;

        let status: string;
        if (vercelState === "READY") {
          status = "ready";
        } else if (vercelState === "ERROR" || vercelState === "CANCELED") {
          status = "error";
        } else {
          status = "building";
        }

        if (status !== data.deployStatus) {
          await doc.ref.update({ deployStatus: status });
        }

        return NextResponse.json({
          status,
          domain: data.domain,
          url: latest.url ? `https://${latest.url}` : null,
        });
      }

      // Project exists but zero deployments — build never started
      if (data.deployStatus === "building") {
        await doc.ref.update({ deployStatus: "error", deployError: "Build never started in Vercel" });
        return NextResponse.json({ status: "error", domain: data.domain });
      }
    }
  } catch (error) {
    console.error("Status check error:", error);
  }

  return NextResponse.json({
    status: data.deployStatus || "building",
    domain: data.domain,
  });
}
