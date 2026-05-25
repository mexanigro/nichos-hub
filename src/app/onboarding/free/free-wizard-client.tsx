"use client";

import { useCallback } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { useWizard } from "@/lib/wizard/use-wizard";
import { saveBuilderDraft } from "@/lib/builder-storage";
import { useT } from "@/lib/i18n";
import type { StepConfig } from "@/lib/wizard/wizard-types";

import { StepNiche } from "@/components/wizard/steps/step-niche";
import { StepMode } from "@/components/wizard/steps/step-mode";
import { StepBusiness } from "@/components/wizard/steps/step-business";
import { StepContact } from "@/components/wizard/steps/step-contact";
import { StepStyle } from "@/components/wizard/steps/step-style";
import { StepLogoUpload } from "@/components/wizard/steps/step-logo-upload";
import { StepReview } from "@/components/wizard/wizard-review";

import {
  validateNiche,
  validateMode,
  validateBusiness,
  validateContact,
} from "@/lib/wizard/wizard-validation";

const STEPS: StepConfig[] = [
  { id: "niche", component: StepNiche, validate: validateNiche },
  { id: "mode", component: StepMode, validate: validateMode },
  { id: "business", component: StepBusiness, validate: validateBusiness },
  { id: "contact", component: StepContact, validate: validateContact },
  { id: "style", component: StepStyle },
  {
    id: "logo",
    component: StepLogoUpload,
    skip: (data) => data.logoCreate,
  },
  { id: "review", component: StepReview },
];

export function FreeWizardClient() {
  const { locale, t, isRTL } = useT();

  const wizard = useWizard({
    steps: STEPS,
    variant: "free",
    locale,
  });

  const handleSubmit = useCallback(async () => {
    const { data } = wizard;
    await saveBuilderDraft({
      niche: data.niche,
      customNiche: data.customNiche,
      businessMode: data.businessMode || "team",
      businessName: data.businessName,
      description: data.description,
      whatsapp: data.whatsapp,
      email: data.email,
      address: data.address,
      instagram: data.instagram,
      logoCreate: data.logoCreate,
      colors: data.colors,
      logo: data.logo
        ? new File(
            [await fetch(data.logo.dataUrl).then((r) => r.blob())],
            data.logo.name,
            { type: data.logo.type },
          )
        : null,
      photos: [],
      staffPhotos: [],
      locale,
    });

    window.location.href = "/onboarding/preview";
  }, [wizard, locale]);

  return (
    <WizardShell
      {...wizard}
      isRTL={isRTL}
      variant="free"
      onSubmit={handleSubmit}
      labels={{
        next: t.wizard.next,
        back: t.wizard.back,
        skip: t.wizard.skip,
        submit: t.wizard.buildSite,
      }}
    />
  );
}
