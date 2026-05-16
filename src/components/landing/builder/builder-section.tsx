"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { saveBuilderDraft } from "@/lib/builder-storage";
import { StepNiche } from "./step-niche";
import { StepPhotos } from "./step-photos";
import { StepDetails } from "./step-details";
import { StepBranding } from "./step-branding";
import { BuilderProgress } from "./builder-progress";

export interface BuilderData {
  niche: string;
  customNiche: string;
  businessMode: "solo" | "team";
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
  customNiche: "",
  businessMode: "team",
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
    setError("");
    try {
      await saveBuilderDraft(data as unknown as Record<string, unknown>);
      window.location.href = "/onboarding/preview";
    } catch {
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="l-section-lg" id="builder">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-10 text-center">
          <span
            style={{ fontFamily: "var(--l-display)" }}
            className="inline-block rounded-[var(--l-radius-pill)] bg-[var(--l-accent-muted)] px-3.5 py-1.5 text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-[var(--l-accent)]"
          >
            {t.builder.badge || "BUILD YOUR SITE"}
          </span>
          <h2
            style={{ fontFamily: "var(--l-display)", fontSize: "var(--l-h2)" }}
            className="mt-4 font-bold leading-[1.15] tracking-[-0.02em] text-[var(--l-text)]"
          >
            {t.builder.title}
          </h2>
          <p className="mt-3 text-[0.95rem] text-[var(--l-text-2)]">{t.builder.subtitle}</p>
        </div>

        <div
          className="rounded-[var(--l-radius-lg)] border border-[var(--l-border)] bg-[var(--l-card)] p-7 sm:p-9"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
        >
          <BuilderProgress steps={STEPS} current={step} labels={t.builder.steps} />

          <div className="mt-8 min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && <StepNiche data={data} update={update} />}
                {step === 1 && <StepPhotos data={data} update={update} />}
                {step === 2 && <StepDetails data={data} update={update} />}
                {step === 3 && <StepBranding data={data} update={update} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {error && (
            <p className="mt-4 rounded-[var(--l-radius-sm)] bg-red-50 px-4 py-2.5 text-[0.85rem] text-red-600">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-[var(--l-border-subtle)] pt-5">
            <button
              onClick={prev}
              disabled={step === 0}
              className="px-4 py-2.5 text-[0.88rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text)] disabled:invisible"
            >
              &larr; Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                disabled={step === 0 && (!data.niche || (data.niche === "otro" && !data.customNiche.trim()))}
                style={{ fontFamily: "var(--l-display)" }}
                className="rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-7 py-2.5 text-[0.88rem] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              >
                Next &rarr;
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !data.businessName}
                style={{ fontFamily: "var(--l-display)" }}
                className="rounded-[var(--l-radius-pill)] bg-[var(--l-accent)] px-7 py-2.5 text-[0.88rem] font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? t.builder.generating : t.builder.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
