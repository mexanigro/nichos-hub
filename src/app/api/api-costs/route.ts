import { NextResponse } from "next/server";
import { withOwner } from "@/lib/auth";
import { db } from "@/lib/firebase-admin";
import type { ApiServiceId, ApiServiceCost } from "@/types";

/** Servicios default con valores en 0 — no se escriben a Firestore */
const DEFAULT_SERVICES: ApiServiceCost[] = [
  {
    serviceId: "anthropic",
    name: "Anthropic (Claude)",
    category: "ia",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://console.anthropic.com/settings/billing",
    monthlyBudgetUsd: 0,
    autoFetchable: true,
  },
  {
    serviceId: "twilio",
    name: "Twilio (WhatsApp)",
    category: "whatsapp",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://console.twilio.com/us1/billing/manage-billing/billing-history",
    monthlyBudgetUsd: 0,
    autoFetchable: true,
  },
  {
    serviceId: "firebase",
    name: "Firebase",
    category: "database",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://console.firebase.google.com/project/_/usage",
    monthlyBudgetUsd: 0,
  },
  {
    serviceId: "vercel",
    name: "Vercel",
    category: "hosting",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://vercel.com/dashboard/usage",
    monthlyBudgetUsd: 0,
    autoFetchable: true,
  },
  {
    serviceId: "railway",
    name: "Railway",
    category: "hosting",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://railway.com/account/billing",
    monthlyBudgetUsd: 0,
    autoFetchable: true,
  },
  {
    serviceId: "resend",
    name: "Resend",
    category: "email",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://resend.com/settings/billing",
    monthlyBudgetUsd: 0,
  },
  {
    serviceId: "cardcom",
    name: "Cardcom",
    category: "payments",
    monthlyCostUsd: 0,
    monthlyCostIls: 0,
    usageMetric: "",
    usagePeriod: "",
    notes: "",
    lastUpdated: "",
    docUrl: "https://secure.cardcom.solutions",
    monthlyBudgetUsd: 0,
  },
];

const VALID_IDS = new Set<ApiServiceId>(DEFAULT_SERVICES.map((s) => s.serviceId));

export { VALID_IDS };

export const GET = withOwner(async () => {
  const snap = await db.collection("hub_api_costs").get();

  if (snap.empty) {
    return NextResponse.json(DEFAULT_SERVICES);
  }

  // Merge Firestore data con defaults
  const stored = new Map<string, FirebaseFirestore.DocumentData>();
  for (const doc of snap.docs) {
    stored.set(doc.id, doc.data());
  }

  const result: ApiServiceCost[] = DEFAULT_SERVICES.map((def) => {
    const data = stored.get(def.serviceId);
    if (!data) return def;
    return {
      ...def,
      monthlyCostUsd: data.monthlyCostUsd ?? def.monthlyCostUsd,
      monthlyCostIls: data.monthlyCostIls ?? def.monthlyCostIls,
      usageMetric: data.usageMetric ?? def.usageMetric,
      usagePeriod: data.usagePeriod ?? def.usagePeriod,
      notes: data.notes ?? def.notes,
      lastUpdated: data.lastUpdated?.toDate?.()?.toISOString?.() ?? data.lastUpdated ?? def.lastUpdated,
      monthlyBudgetUsd: data.monthlyBudgetUsd ?? def.monthlyBudgetUsd,
    };
  });

  return NextResponse.json(result);
});
