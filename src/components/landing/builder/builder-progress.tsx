"use client";

interface Props {
  steps: readonly string[];
  current: number;
  labels: Record<string, string>;
}

export function BuilderProgress({ steps, current, labels }: Props) {
  return (
    <div className="flex items-start">
      {steps.map((key, i) => {
        const isActive = i <= current;
        const isLast = i === steps.length - 1;
        return (
          <div key={key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  isActive ? "bg-[var(--l-accent)]" : "bg-[var(--l-border)]"
                }`}
              />
              <span
                className={`hidden text-[0.7rem] font-medium transition-colors duration-200 sm:block ${
                  isActive ? "text-[var(--l-text)]" : "text-[var(--l-text-3)]"
                }`}
              >
                {labels[key]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-2 mt-1 h-[2px] flex-1 rounded-full transition-colors duration-300 ${
                  i < current ? "bg-[var(--l-accent)]" : "bg-[var(--l-border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
