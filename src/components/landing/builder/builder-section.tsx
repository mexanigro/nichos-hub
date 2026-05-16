"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { AnimatedSection } from "../animated-section";
import { StepNiche } from "./step-niche";
import { StepPhotos } from "./step-photos";
import { StepDetails } from "./step-details";
import { StepBranding } from "./step-branding";
import { BuilderProgress } from "./builder-progress";

export interface BuilderData {
  niche: string;
  photos: File[];
  staffPhotos: File[];
  businessName: string;
  description: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  logo: File | null;
  logoCreate: boolean;
  colors: string;
}

const INITIAL_DATA: BuilderData = {
  niche: "",
  photos: [],
  staffPhotos: [],
  businessName: "",
  description: "",
  whatsapp: "",
  email: "",
  address: "",
  instagram: "",
  logo: null,
  logoCreate: false,
  colors: "",
};

const STEPS = ["niche", "photos", "details", "branding"] as const;

export function BuilderSection() {
  const { t } = useT();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BuilderData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(partial: Partial<BuilderData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("niche", data.niche);
    formData.append("businessName", data.businessName);
    formData.append("description", data.description);
    formData.append("whatsapp", data.whatsapp);
    formData.append("email", data.email);
    formData.append("address", data.address);
    formData.append("instagram", data.instagram);
    formData.append("logoCreate", String(data.logoCreate));
    formData.append("colors", data.colors);
    if (data.logo) formData.append("logo", data.logo);
    data.photos.forEach((f) => formData.append("photos", f));
    data.staffPhotos.forEach((f) => formData.append("staffPhotos", f));

    try {
      const res = await fetch("/api/onboarding", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        setError(err.error || "Submission failed");
        return;
      }
      const { clientId } = await res.json();
      window.location.href = `/onboarding/status/${clientId}`;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatedSection className="mx-auto max-w-2xl px-5 py-20" id="builder">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-text sm:text-3xl">{t.builder.title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t.builder.subtitle}</p>
      </div>

      <div className="rounded-md border border-border bg-bg-card p-6 sm:p-8">
        <BuilderProgress steps={STEPS} current={step} labels={t.builder.steps} />

        <div className="mt-8 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <StepNiche data={data} update={update} />}
              {step === 1 && <StepPhotos data={data} update={update} />}
              {step === 2 && <StepDetails data={data} update={update} />}
              {step === 3 && <StepBranding data={data} update={update} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-danger/10 px-4 py-2 text-xs text-danger">{error}</p>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-md px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text disabled:invisible"
          >
            &larr; Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={step === 0 && !data.niche}
              className="rounded-md bg-gradient-to-r from-accent-from to-accent-to px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !data.businessName}
              className="rounded-md bg-gradient-to-r from-accent-from to-accent-to px-5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? t.builder.generating : t.builder.submit}
            </button>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}
