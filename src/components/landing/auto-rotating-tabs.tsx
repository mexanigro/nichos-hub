"use client";
import { useState, useEffect, useMemo, type ReactNode } from "react";

export interface RotatingTab {
  id: string;
  label: string;
}

/**
 * Tablist that auto-advances on an interval, pauses after a manual pick,
 * and shows a progress bar under the active tab that fills 0 -> 100% over
 * the interval. The panel is rendered via `children(activeId)` so callers
 * keep full control of the preview (and its crossfade). Reusable across
 * niches: pass tab classNames so it inherits each brand's tab styling.
 */
export function AutoRotatingTabs({
  tabs,
  intervalMs = 3500,
  pauseMs = 9000,
  resetKey,
  tabsClassName = "art-tabs",
  tabClassName = "art-tab",
  activeTabClassName = "on",
  children,
}: {
  tabs: RotatingTab[];
  intervalMs?: number;
  pauseMs?: number;
  resetKey?: string | number;
  tabsClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  children: (activeId: string) => ReactNode;
}) {
  const ids = useMemo(() => tabs.map((t) => t.id).join("|"), [tabs]);
  const [active, setActive] = useState(tabs[0]?.id);
  const [paused, setPaused] = useState(false);

  // Snap back to the first tab when the tab set changes (e.g. viewport swap).
  useEffect(() => {
    setActive(tabs[0]?.id);
    setPaused(false);
  }, [resetKey, ids]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      setActive((prev) => {
        const idx = tabs.findIndex((t) => t.id === prev);
        return tabs[(idx + 1) % tabs.length].id;
      });
    }, intervalMs);
    return () => clearInterval(tick);
  }, [paused, ids, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(id: string) {
    setActive(id);
    setPaused(true);
    setTimeout(() => setPaused(false), pauseMs);
  }

  return (
    <>
      <div className={tabsClassName} role="tablist">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              className={`${tabClassName}${on ? ` ${activeTabClassName}` : ""}`}
              onClick={() => pick(t.id)}
            >
              {t.label}
              {on && !paused && (
                <span
                  key={active}
                  className="art-tab-progress"
                  style={{ animationDuration: `${intervalMs}ms` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      {children(active)}
    </>
  );
}
