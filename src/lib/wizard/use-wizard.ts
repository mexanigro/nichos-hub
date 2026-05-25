"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { WizardData, StepConfig } from "./wizard-types";
import { createEmptyWizardData } from "./wizard-types";
import { saveWizardDraft, loadWizardDraft } from "./wizard-storage";

interface UseWizardOptions {
  steps: StepConfig[];
  variant: "free" | "paid";
  clientId?: string;
  locale?: string;
}

interface UseWizardReturn {
  currentStep: number;
  direction: 1 | -1;
  data: WizardData;
  errors: string[];
  activeSteps: StepConfig[];
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  canSkip: boolean;
  goNext: () => boolean;
  goBack: () => void;
  goTo: (step: number) => void;
  updateField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  updateNested: (path: string, value: unknown) => void;
  clearErrors: () => void;
}

export function useWizard({
  steps,
  variant,
  clientId,
  locale = "en",
}: UseWizardOptions): UseWizardReturn {
  const [data, setData] = useState<WizardData>(() =>
    createEmptyWizardData(locale),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Compute active steps (skip steps whose skip() returns true)
  const activeSteps = steps.filter((s) => !s.skip?.(data));

  // ── Hydrate from localStorage on mount ──
  useEffect(() => {
    const saved = loadWizardDraft(variant, clientId, locale);
    setData(saved);
    setHydrated(true);
  }, [variant, clientId, locale]);

  // ── Auto-save to localStorage (debounced 500ms) ──
  useEffect(() => {
    if (!hydrated) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWizardDraft(data, variant, clientId);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [data, hydrated, variant, clientId]);

  // ── History state for browser back button ──
  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState({ wizardStep: currentStep }, "");
  }, [currentStep, hydrated]);

  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      const step = e.state?.wizardStep;
      if (typeof step === "number" && step >= 0 && step < activeSteps.length) {
        setDirection(step < currentStep ? -1 : 1);
        setCurrentStep(step);
        setErrors([]);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, activeSteps.length]);

  // ── Field updates ──
  const updateField = useCallback(
    <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      setErrors([]);
    },
    [],
  );

  const updateNested = useCallback((path: string, value: unknown) => {
    setData((prev) => {
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const next = { ...prev } as any;
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
    setErrors([]);
  }, []);

  // ── Navigation ──
  const goNext = useCallback((): boolean => {
    const step = activeSteps[currentStep];
    if (step?.validate) {
      const err = step.validate(data);
      if (err) {
        setErrors([err]);
        return false;
      }
    }
    setErrors([]);
    if (currentStep < activeSteps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
    return true;
  }, [currentStep, activeSteps, data]);

  const goBack = useCallback(() => {
    setErrors([]);
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const goTo = useCallback(
    (step: number) => {
      if (step >= 0 && step < activeSteps.length) {
        setDirection(step > currentStep ? 1 : -1);
        setCurrentStep(step);
        setErrors([]);
      }
    },
    [currentStep, activeSteps.length],
  );

  const clearErrors = useCallback(() => setErrors([]), []);

  const progress =
    activeSteps.length > 1
      ? currentStep / (activeSteps.length - 1)
      : 0;

  const canSkip = !activeSteps[currentStep]?.validate;

  return {
    currentStep,
    direction,
    data,
    errors,
    activeSteps,
    progress,
    isFirst: currentStep === 0,
    isLast: currentStep === activeSteps.length - 1,
    canSkip,
    goNext,
    goBack,
    goTo,
    updateField,
    updateNested,
    clearErrors,
  };
}
