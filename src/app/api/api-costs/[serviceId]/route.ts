import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { ApiServiceId } from "@/types";

const VALID_IDS = new Set<ApiServiceId>([
  "anthropic",
  "twilio",
  "firebase",
  "vercel",
  "railway",
  "resend",
  "cardcom",
]);

export const PATCH = withOwner(async (req, _session, ctx) => {
  const { serviceId } = await ctx.params;

  if (!VALID_IDS.has(serviceId as ApiServiceId)) {
    return NextResponse.json(
      { error: `serviceId invalido: ${serviceId}` },
      { status: 400 },
    );
  }

  const body = await req.json();
  const allowed = [
    "monthlyCostUsd",
    "monthlyCostIls",
    "usageMetric",
    "usagePeriod",
    "notes",
    "monthlyBudgetUsd",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar" },
      { status: 400 },
    );
  }

  // Validar tipos numéricos
  for (const numKey of ["monthlyCostUsd", "monthlyCostIls", "monthlyBudgetUsd"]) {
    if (update[numKey] !== undefined) {
      const val = Number(update[numKey]);
      if (isNaN(val) || val < 0) {
        return NextResponse.json(
          { error: `${numKey} debe ser un numero >= 0` },
          { status: 400 },
        );
      }
      update[numKey] = val;
    }
  }

  update.lastUpdated = FieldValue.serverTimestamp();

  await db
    .collection("hub_api_costs")
    .doc(serviceId)
    .set(update, { merge: true });

  return NextResponse.json({ ok: true, serviceId });
});
