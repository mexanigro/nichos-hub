"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { useWizard } from "@/lib/wizard/use-wizard";
import { clearWizardDraft } from "@/lib/wizard/wizard-storage";
import { uploadSerializedFiles } from "@/lib/wizard/upload-helpers";
import { useT } from "@/lib/i18n";
import type { StepConfig } from "@/lib/wizard/wizard-types";
import type { SerializedFile } from "@/lib/builder-storage";

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

interface PaidWizardClientProps {
  initialClientId?: string;
  initialEmail?: string;
  initialPlan?: "web_crm" | "completo" | "";
  /** JWT del flow post-pago, requerido para subir imagenes al endpoint protegido. */
  uploadToken?: string;
}

export function PaidWizardClient({
  initialClientId = "",
  initialEmail = "",
  uploadToken = "",
}: PaidWizardClientProps = {}) {
  const params = useSearchParams();
  // Prioridad: props del server (token verificado) → query string → vacio.
  const clientId = initialClientId || params.get("clientId") || "";
  const { locale, t, isRTL } = useT();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wizard = useWizard({
    steps: STEPS,
    variant: "paid",
    clientId,
    locale,
    initialData: initialEmail ? { email: initialEmail } : undefined,
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

      // 1. Subir uploads (si hay token). Si no hay token, ignoramos uploads
      //    silenciosamente — flow legacy ?clientId=... no podia subir tampoco.
      let logoUrl: string | undefined;
      let logoDarkUrl: string | undefined;
      let ownerPhotoUrl: string | undefined;
      let heroImageUrl: string | undefined;
      let staffPhotoUrls: string[] = [];
      let galleryImageUrls: string[] = [];

      if (uploadToken) {
        const single = async (f: SerializedFile | null): Promise<string | undefined> => {
          if (!f) return undefined;
          const r = await uploadSerializedFiles([f], uploadToken);
          if (!r.ok) throw new Error(r.error || "Upload failed");
          return r.urls?.[0];
        };
        const many = async (files: SerializedFile[]): Promise<string[]> => {
          if (files.length === 0) return [];
          const r = await uploadSerializedFiles(files, uploadToken);
          if (!r.ok) throw new Error(r.error || "Upload failed");
          return r.urls || [];
        };

        [logoUrl, logoDarkUrl, ownerPhotoUrl, heroImageUrl, staffPhotoUrls, galleryImageUrls] = await Promise.all([
          single(data.logo),
          single(data.logoDark),
          single(data.ownerPhoto),
          single(data.heroImage),
          many(data.staffPhotos),
          many(data.galleryImages),
        ]);
      }

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
        logoUrl,
        logoDarkUrl,
        ownerPhotoUrl,
        heroImageUrl,
        staffPhotoUrls,
        galleryImageUrls,
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
