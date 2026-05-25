import { Suspense } from "react";
import { PaidWizardClient } from "./paid-wizard-client";

export default function OnboardingInfoPage() {
  return (
    <Suspense fallback={<div className="wiz"><div className="wiz-loading" /></div>}>
      <PaidWizardClient />
    </Suspense>
  );
}
