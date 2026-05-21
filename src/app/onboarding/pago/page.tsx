import { OnboardingPagoClient } from "./onboarding-pago-client";

interface Props {
  searchParams: Promise<{ plan?: string }>;
}

export default async function OnboardingPagoPage({ searchParams }: Props) {
  const { plan } = await searchParams;
  const validPlan = plan === "web_crm" || plan === "completo" ? plan : "completo";

  return <OnboardingPagoClient defaultPlan={validPlan} />;
}
