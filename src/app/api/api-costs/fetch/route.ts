import { NextRequest, NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  fetchVercelUsage,
  fetchAnthropicUsage,
  fetchTwilioUsage,
  fetchRailwayUsage,
  type CostFetchResult,
} from "@/lib/api-cost-fetchers";

interface StoredKeys {
  anthropic_admin_key?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  railway_token?: string;
}

interface FetchResult {
  serviceId: string;
  success: boolean;
  data?: CostFetchResult;
  error?: string;
}

async function runFetcher(
  serviceId: string,
  fn: () => Promise<CostFetchResult>,
): Promise<FetchResult> {
  try {
    const data = await fn();
    return { serviceId, success: true, data };
  } catch (err) {
    return {
      serviceId,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function persistResult(serviceId: string, result: FetchResult): Promise<void> {
  const now = FieldValue.serverTimestamp();
  if (result.success && result.data) {
    await db
      .collection("hub_api_costs")
      .doc(serviceId)
      .set(
        {
          ...(result.data.costUsd !== undefined && { monthlyCostUsd: result.data.costUsd }),
          ...(result.data.costIls !== undefined && { monthlyCostIls: result.data.costIls }),
          usageMetric: result.data.usageMetric,
          usagePeriod: result.data.usagePeriod,
          lastUpdated: now,
          lastAutoFetch: now,
        },
        { merge: true },
      );
  } else {
    await db
      .collection("hub_api_costs")
      .doc(serviceId)
      .set({ lastAutoFetch: now, autoFetchError: result.error ?? "Error desconocido" }, { merge: true });
  }
}

export const POST = withOwner(async (_req: NextRequest, _session, _ctx) => {
  const snap = await db.collection("hub_api_keys").doc("keys").get();
  const keys = (snap.data() ?? {}) as StoredKeys;

  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  const tasks: { serviceId: string; fn: () => Promise<CostFetchResult> }[] = [];

  if (vercelToken) {
    tasks.push({
      serviceId: "vercel",
      fn: () => fetchVercelUsage(vercelToken, vercelTeamId),
    });
  }

  if (keys.anthropic_admin_key) {
    tasks.push({
      serviceId: "anthropic",
      fn: () => fetchAnthropicUsage(keys.anthropic_admin_key!),
    });
  }

  if (keys.twilio_account_sid && keys.twilio_auth_token) {
    tasks.push({
      serviceId: "twilio",
      fn: () => fetchTwilioUsage(keys.twilio_account_sid!, keys.twilio_auth_token!),
    });
  }

  if (keys.railway_token) {
    tasks.push({
      serviceId: "railway",
      fn: () => fetchRailwayUsage(keys.railway_token!),
    });
  }

  const results = await Promise.all(tasks.map((t) => runFetcher(t.serviceId, t.fn)));

  await Promise.all(results.map((r) => persistResult(r.serviceId, r)));

  return NextResponse.json({ results });
});
