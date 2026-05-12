import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { getMonitorData } from "@/lib/repos/health";

export const GET = withOwner(async () => {
  try {
    return NextResponse.json(await getMonitorData());
  } catch {
    return NextResponse.json({
      activeIncidents: [],
      recentIncidents: [],
      uptime: [],
      error: "PostgreSQL not available",
    });
  }
});
