import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated">
        <Icon size={20} className="text-text-muted" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-text">{title}</h3>
      <p className="mb-4 text-xs text-text-muted">{description}</p>
      {action}
    </div>
  );
}
