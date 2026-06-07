import type { BookingTier } from "@/types";

const tierStyles: Record<BookingTier, { label: string; className: string }> = {
  base: {
    label: "Base",
    className: "text-zinc-300 bg-zinc-500/10 ring-1 ring-zinc-500/20",
  },
  pro: {
    label: "Pro",
    className: "text-blue-300 bg-blue-500/10 ring-1 ring-blue-500/25",
  },
  enterprise: {
    label: "Enterprise",
    className: "text-amber-300 bg-amber-500/10 ring-1 ring-amber-500/25",
  },
};

export function TierBadge({ tier }: { tier: BookingTier }) {
  const config = tierStyles[tier] ?? tierStyles.base;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.className}`}
    >
      {config.label}
    </span>
  );
}
