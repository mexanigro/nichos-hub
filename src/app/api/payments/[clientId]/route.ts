import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { listClientPayments } from "@/lib/repos/payments";

export const GET = withOwner(async (_req, _session, ctx) => {
  const { clientId } = await ctx.params;
  return NextResponse.json(await listClientPayments(clientId));
});
