import { OnboardingPagoClient } from "./onboarding-pago-client";
import type { PlanType } from "@/lib/pricing";

const VALID_PLANS = new Set<PlanType>(["solo_web", "base", "pro", "enterprise", "web_crm", "completo"]);

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function OnboardingPagoPage({ searchParams }: Props) {
  const { plan } = await searchParams;
  const validPlan: PlanType = plan && VALID_PLANS.has(plan as PlanType)
    ? (plan as PlanType)
    : "base";

  return <OnboardingPagoClient defaultPlan={validPlan} />;
}
