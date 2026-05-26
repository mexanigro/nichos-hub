"use client";

import { useCallback, useState } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { WizardConfirmation } from "@/components/wizard/wizard-confirmation";
import { useWizard } from "@/lib/wizard/use-wizard";
import { clearWizardDraft } from "@/lib/wizard/wizard-storage";
import { useT } from "@/lib/i18n";
import type { StepConfig } from "@/lib/wizard/wizard-types";

import { StepNiche } from "@/components/wizard/steps/step-niche";
import { StepMode } from "@/components/wizard/steps/step-mode";
import { StepBusiness } from "@/components/wizard/steps/step-business";
import { StepContact } from "@/components/wizard/steps/step-contact";
import { StepBranding } from "@/components/wizard/steps/step-branding";
import { StepServices } from "@/components/wizard/steps/step-services";
import { StepHours } from "@/components/wizard/steps/step-hours";
import { StepOwner } from "@/components/wizard/steps/step-owner";
import { StepGallery } from "@/components/wizard/steps/step-gallery";

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
  { id: "branding", component: StepBranding },
  { id: "services", component: StepServices },
  { id: "hours", component: StepHours },
  { id: "owner", component: StepOwner },
  { id: "gallery", component: StepGallery },
];

export function FreeWizardClient() {
  const { locale, t, isRTL } = useT();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wizard = useWizard({
    steps: STEPS,
    variant: "free",
    locale,
  });

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const { data } = wizard;
      const body = {
        niche: data.niche,
        customNiche: data.customNiche,
        businessMode: data.businessMode || "team",
        businessName: data.businessName,
        tagline: data.tagline,
        description: data.description,
        contact: {
          phone: data.phone || data.whatsapp,
          email: data.email,
          address: { street: data.address, district: data.district, city: data.city },
          instagram: data.instagram,
          facebook: data.facebook,
          whatsapp: data.whatsapp,
        },
        hasBranding: data.hasBranding,
        wantsLiamBranding: data.wantsLiamBranding,
        colors: data.colors,
        accentColor: data.accentColor,
        logo: data.logo?.dataUrl ?? null,
        logoDark: data.logoDark?.dataUrl ?? null,
        logoBlackWhite: data.logoBlackWhite?.dataUrl ?? null,
        services: data.services.filter((s) => s.visible),
        hours: data.hours,
        ownerName: data.ownerName,
        ownerRole: data.ownerRole,
        ownerBio: data.ownerBio,
        ownerPhoto: data.ownerPhoto?.dataUrl ?? null,
        heroImage: data.heroImage?.dataUrl ?? null,
        galleryImages: data.galleryImages.map((f) => f.dataUrl),
        locale,
        variant: "free",
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        setSubmitError(err.error || "Something went wrong. Please try again.");
        return;
      }

      clearWizardDraft("free");
      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [wizard, locale]);

  if (submitted) {
    return <WizardConfirmation variant="free" />;
  }

  return (
    <>
      <WizardShell
        {...wizard}
        isRTL={isRTL}
        variant="free"
        onSubmit={handleSubmit}
        labels={{
          next: t.wizard.next,
          back: t.wizard.back,
          skip: t.wizard.skip,
          submit: submitting ? "..." : t.wizard.buildSite,
        }}
      />
      {submitError && (
        <div className="wiz-toast">
          <p>{submitError}</p>
          <button type="button" onClick={() => setSubmitError("")}>&times;</button>
        </div>
      )}
    </>
  );
}
