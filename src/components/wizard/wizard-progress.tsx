"use client";

interface WizardProgressProps {
  progress: number; // 0..1
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ progress, currentStep, totalSteps }: WizardProgressProps) {
  return (
    <div className="wiz-progress">
      <div className="wiz-progress-track">
        <div
          className="wiz-progress-bar"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <span className="wiz-progress-label">
        {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
}
