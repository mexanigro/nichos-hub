"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { useWizard } from "@/lib/wizard/use-wizard";
import { clearWizardDraft } from "@/lib/wizard/wizard-storage";
import { useT } from "@/lib/i18n";
import type { StepConfig } from "@/lib/wizard/wizard-types";

import { StepNiche } from "@/components/wizard/steps/step-niche";
import { StepMode } from "@/components/wizard/steps/step-mode";
import { StepBusiness } from "@/components/wizard/steps/step-business";
import { StepContact } from "@/components/wizard/steps/step-contact";
import { StepBrand } from "@/components/wizard/steps/step-brand";
import { StepServices } from "@/components/wizard/steps/step-services";
import { StepHours } from "@/components/wizard/steps/step-hours";
import { StepOwner } from "@/components/wizard/steps/step-owner";
import { StepGallery } from "@/components/wizard/steps/step-gallery";
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
  { id: "brand", component: StepBrand },
  { id: "services", component: StepServices },
  { id: "hours", component: StepHours },
  { id: "owner", component: StepOwner },
  { id: "gallery", component: StepGallery },
  { id: "review", component: StepReview },
];

export function PaidWizardClient() {
  const params = useSearchParams();
  const clientId = params.get("clientId") || "";
  const { locale, t, isRTL } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wizard = useWizard({
    steps: STEPS,
    variant: "paid",
    clientId,
    locale,
  });

  const handleSubmit = useCallback(async () => {
    if (!clientId) {
      setSubmitError(t.wizard.noClientIdSub);
      return;
    }
    setSubmitting(true);
    setSubmitError("");

    try {
      const { data } = wizard;
      const body = {
        clientId,
        niche: data.niche,
        customNiche: data.customNiche,
        businessMode: data.businessMode || "team",
        businessName: data.businessName,
        tagline: data.tagline,
        description: data.description,
        contact: {
          phone: data.phone || data.whatsapp,
          email: data.email,
          address: {
            street: data.address,
            district: data.district,
            city: data.city,
          },
          instagram: data.instagram,
          facebook: data.facebook,
          whatsapp: data.whatsapp,
        },
        colors: data.colors,
        accentColor: data.accentColor,
        services: data.services.filter((s) => s.visible),
        hours: data.hours,
        ownerName: data.ownerName,
        ownerRole: data.ownerRole,
        ownerBio: data.ownerBio,
        locale,
      };

      const res = await fetch("/api/onboarding/client-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        setSubmitError(err.error || "Something went wrong. Please try again.");
        return;
      }

      clearWizardDraft("paid", clientId);
      window.location.href = `/onboarding/status/${clientId}`;
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [wizard, clientId, locale, t]);

  if (!clientId) {
    return (
      <div className="wiz" dir={isRTL ? "rtl" : "ltr"}>
        <div className="wiz-empty">
          <h2>{t.wizard.noClientId}</h2>
          <p>{t.wizard.noClientIdSub}</p>
          <a href="/" className="wiz-btn-primary" style={{ display: "inline-flex", width: "auto" }}>
            ← Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <WizardShell
        {...wizard}
        isRTL={isRTL}
        variant="paid"
        onSubmit={handleSubmit}
        labels={{
          next: t.wizard.next,
          back: t.wizard.back,
          skip: t.wizard.skip,
          submit: submitting ? "..." : t.wizard.submitInfo,
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
