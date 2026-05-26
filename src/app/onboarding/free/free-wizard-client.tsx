"use client";

import { useCallback, useState } from "react";
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
import { StepDemoContact } from "@/components/wizard/steps/step-demo-contact";

import {
  validateNiche,
  validateMode,
  validateBusiness,
  validateContact,
  validateDemoContact,
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
  // Step final: captura email + WhatsApp para que Liam pueda contactar al
  // prospect. Sin esto las demos quedan solo en IndexedDB del browser.
  { id: "demo-contact", component: StepDemoContact, validate: validateDemoContact },
];

export function FreeWizardClient() {
  const { locale, t, isRTL } = useT();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const wizard = useWizard({
    steps: STEPS,
    variant: "free",
    locale,
  });

  const handleSubmit = useCallback(async () => {
    const { data } = wizard;
    setError("");
    setSubmitting(true);

    try {
      // 1. Guardar lead en Firestore — fuente de verdad comercial
      const res = await fetch("/api/free/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          whatsapp: data.whatsapp,
          businessName: data.businessName,
          niche: data.niche,
          customNiche: data.customNiche,
          businessMode: data.businessMode,
          description: data.description,
          address: data.address,
          instagram: data.instagram,
          colors: data.colors,
          logoCreate: data.logoCreate,
          locale,
        }),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "No pudimos guardar tus datos. Reintentá.");
        setSubmitting(false);
        return;
      }

      // 2. Guardar el draft local para que /preview pueda mostrar la demo
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

      setSubmitted(true);
    } catch {
      setError("Network error. Reintentá.");
      setSubmitting(false);
    }
  }, [wizard, locale]);

  if (submitted) {
    const w = t.wizard;
    return (
      <div className="wiz" dir={isRTL ? "rtl" : "ltr"}>
        <div className="wiz-empty" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>✓</div>
          <h2>{w.demoThanksTitle}</h2>
          <p>{w.demoThanksBody}</p>
          <a
            href="/onboarding/preview"
            className="wiz-btn-primary"
            style={{ display: "inline-flex", width: "auto", marginTop: 12 }}
          >
            {w.demoThanksCta} →
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
        variant="free"
        onSubmit={handleSubmit}
        labels={{
          next: t.wizard.next,
          back: t.wizard.back,
          skip: t.wizard.skip,
          submit: submitting ? "..." : t.wizard.demoSubmit,
        }}
      />
      {error && (
        <div className="wiz-toast">
          <p>{error}</p>
          <button type="button" onClick={() => setError("")}>&times;</button>
        </div>
      )}
    </>
  );
}
