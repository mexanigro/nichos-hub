"use client";

import { WizardProgress } from "./wizard-progress";
import { WizardNav } from "./wizard-nav";
import { WizardTransition } from "./wizard-transition";
import type { StepConfig, StepProps, WizardData } from "@/lib/wizard/wizard-types";

interface WizardShellProps {
  currentStep: number;
  direction: 1 | -1;
  data: WizardData;
  errors: string[];
  activeSteps: StepConfig[];
  progress: number;
  isFirst: boolean;
  isLast: boolean;
  canSkip: boolean;
  isRTL: boolean;
  variant: "free" | "paid";
  goNext: () => boolean;
  goBack: () => void;
  updateField: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  updateNested: (path: string, value: unknown) => void;
  clearErrors: () => void;
  onSubmit: () => void;
  labels: {
    next: string;
    back: string;
    skip: string;
    submit: string;
  };
}

export function WizardShell({
  currentStep,
  direction,
  data,
  errors,
  activeSteps,
  progress,
  isFirst,
  isLast,
  canSkip,
  isRTL,
  variant,
  goNext,
  goBack,
  updateField,
  updateNested,
  clearErrors,
  onSubmit,
  labels,
}: WizardShellProps) {
  const activeStep = activeSteps[currentStep];
  if (!activeStep) return null;

  const StepComponent = activeStep.component;

  const stepProps: StepProps = {
    data,
    updateField,
    updateNested,
    isRTL,
    variant,
    errors,
  };

  function handleNext() {
    if (isLast) {
      onSubmit();
    } else {
      goNext();
    }
  }

  function handleSkip() {
    clearErrors();
    goNext();
  }

  return (
    <div className="wiz" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="wiz-header">
        <div className="wiz-header-inner">
          <a href="/" className="wiz-brand">
            <span className="wm">Arzac <em>Studio</em></span>
          </a>
          <WizardProgress
            progress={progress}
            currentStep={currentStep}
            totalSteps={activeSteps.length}
          />
        </div>
      </header>

      {/* Body */}
      <main className="wiz-body">
        <div className="wiz-content">
          <WizardTransition
            stepKey={activeStep.id}
            direction={direction}
            isRTL={isRTL}
          >
            <StepComponent {...stepProps} />
          </WizardTransition>
        </div>
      </main>

      {/* Nav */}
      <WizardNav
        isFirst={isFirst}
        isLast={isLast}
        canSkip={canSkip}
        onBack={goBack}
        onNext={handleNext}
        onSkip={handleSkip}
        nextLabel={labels.next}
        backLabel={labels.back}
        skipLabel={labels.skip}
        submitLabel={labels.submit}
      />
    </div>
  );
}
