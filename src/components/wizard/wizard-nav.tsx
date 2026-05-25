"use client";

interface WizardNavProps {
  isFirst: boolean;
  isLast: boolean;
  canSkip: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  submitLabel?: string;
}

export function WizardNav({
  isFirst,
  isLast,
  canSkip,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Continue",
  backLabel = "Back",
  skipLabel = "Skip",
  submitLabel,
}: WizardNavProps) {
  return (
    <div className="wiz-nav">
      <div className="wiz-nav-inner">
        {!isFirst ? (
          <button className="wiz-btn-back" onClick={onBack} type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {backLabel}
          </button>
        ) : (
          <div />
        )}
        <div className="wiz-nav-right">
          {canSkip && !isLast && onSkip && (
            <button className="wiz-btn-skip" onClick={onSkip} type="button">
              {skipLabel}
            </button>
          )}
          <button className="wiz-btn-primary" onClick={onNext} type="button">
            {isLast ? (submitLabel || nextLabel) : nextLabel}
            {!isLast && (
              <span className="wiz-btn-arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
