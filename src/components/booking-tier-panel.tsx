"use client";

import { useState } from "react";
import {
  ArrowUpCircle,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from "lucide-react";
import { TierBadge } from "@/components/tier-badge";
import { TIER_LIMITS, TIER_PRICING, TIER_LABELS, TIER_ORDER } from "@/lib/pricing";
import type { BookingTier, TierChangeEvent } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface BookingTierPanelProps {
  clientDocId: string;
  tier: BookingTier;
  bookingCount: number;
  tierAutoUpgraded: boolean;
  tierAutoUpgradedAt: string | null;
  tierHistory: TierChangeEvent[];
  onTierChange: (newTier: BookingTier) => void;
}

export function BookingTierPanel({
  clientDocId,
  tier,
  bookingCount,
  tierAutoUpgraded,
  tierAutoUpgradedAt,
  tierHistory,
  onTierChange,
}: BookingTierPanelProps) {
  const [changing, setChanging] = useState(false);
  const [showTierSelect, setShowTierSelect] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const limit = TIER_LIMITS[tier];
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((bookingCount / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isOverLimit = !isUnlimited && bookingCount >= limit;

  async function handleTierChange(newTier: BookingTier) {
    if (newTier === tier) return;
    setChanging(true);
    try {
      const res = await fetch(`/api/clients/${clientDocId}/tier`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        onTierChange(newTier);
        setShowTierSelect(false);
      }
    } catch {
      // silently fail
    }
    setChanging(false);
  }

  const barColor = isOverLimit
    ? "bg-red-500"
    : isNearLimit
      ? "bg-amber-500"
      : "bg-accent";

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-text-muted">
          <Zap size={12} />
          Plan & Bookings
        </h3>
        <TierBadge tier={tier} />
      </div>

      {/* Auto-upgrade alert */}
      {tierAutoUpgraded && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2">
          <ArrowUpCircle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="min-w-0 text-[11px]">
            <p className="font-semibold text-amber-300">Auto-upgrade aplicado</p>
            <p className="text-amber-300/70">
              Este cliente superó el límite de su tier anterior.
              {tierAutoUpgradedAt && (
                <> · {formatDistanceToNow(new Date(tierAutoUpgradedAt), { addSuffix: true, locale: es })}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Booking counter & progress */}
      <div className="mb-1 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-text">{bookingCount}</span>
          <span className="text-xs text-text-muted">
            / {isUnlimited ? "∞" : limit}
          </span>
        </div>
        <span className="text-[10px] text-text-muted">bookings este mes</span>
      </div>

      {!isUnlimited && (
        <div className="mb-1 h-2 overflow-hidden rounded-full bg-bg-elevated">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}

      {isUnlimited && (
        <div className="mb-1 h-2 overflow-hidden rounded-full bg-bg-elevated">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-500/30 via-amber-500/50 to-amber-500/30 opacity-50" />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between text-[10px] text-text-muted">
        <span>
          {isUnlimited
            ? "Sin límite"
            : isOverLimit
              ? `Sobre el límite (+${bookingCount - limit})`
              : `${limit - bookingCount} restantes`}
        </span>
        <span>₪{TIER_PRICING[tier].toLocaleString()}/mes</span>
      </div>

      {/* Manual tier change */}
      <div className="border-t border-border pt-3">
        <button
          onClick={() => setShowTierSelect(!showTierSelect)}
          disabled={changing}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-[11px] font-medium text-text-secondary transition-colors hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
        >
          <span>Cambiar tier manualmente</span>
          {changing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : showTierSelect ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )}
        </button>

        {showTierSelect && (
          <div className="mt-2 space-y-1">
            {TIER_ORDER.map((t) => {
              const active = t === tier;
              const tierLimit = TIER_LIMITS[t];
              return (
                <button
                  key={t}
                  onClick={() => handleTierChange(t)}
                  disabled={active || changing}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] transition-colors ${
                    active
                      ? "border border-accent/30 bg-accent/10 text-accent"
                      : "border border-border text-text-secondary hover:border-accent/20 hover:bg-bg-hover"
                  } disabled:opacity-50`}
                >
                  <div>
                    <span className="font-semibold">{TIER_LABELS[t]}</span>
                    <span className="ml-2 text-text-muted">
                      {isFinite(tierLimit) ? `hasta ${tierLimit} bookings` : "ilimitado"}
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    ₪{TIER_PRICING[t].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tier history */}
      {tierHistory.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between text-[10px] font-medium text-text-muted hover:text-text"
          >
            <span>Historial de cambios ({tierHistory.length})</span>
            {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          {showHistory && (
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
              {[...tierHistory].reverse().map((event, i) => (
                <div
                  key={`${event.at}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-bg-elevated px-2.5 py-1.5 text-[10px]"
                >
                  <CalendarCheck size={10} className="shrink-0 text-text-muted" />
                  <span className="text-text-secondary">
                    <TierBadge tier={event.from} />
                    <span className="mx-1.5 text-text-muted">→</span>
                    <TierBadge tier={event.to} />
                  </span>
                  <span className="ml-auto whitespace-nowrap text-text-muted">
                    {event.reason === "auto_upgrade" ? "auto" : "manual"} ·{" "}
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(event.at), { addSuffix: true, locale: es });
                      } catch {
                        return event.at;
                      }
                    })()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
