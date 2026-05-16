"use client";

interface Props {
  steps: readonly string[];
  current: number;
  labels: Record<string, string>;
}

export function BuilderProgress({ steps, current, labels }: Props) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((key, i) => (
        <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={`h-1 w-full rounded-sm transition-colors ${
              i <= current ? "bg-accent" : "bg-border"
            }`}
          />
          <span
            className={`text-[10px] font-medium transition-colors ${
              i <= current ? "text-text" : "text-text-muted"
            }`}
          >
            {labels[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
