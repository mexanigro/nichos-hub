"use client";
import { useState, useEffect, useMemo, useId, useRef, type ReactNode, type KeyboardEvent } from "react";

export interface RotatingTab {
  id: string;
  label: string;
}

/**
 * Pestañas que avanzan solas, con una barra de progreso bajo la activa. LANDING-01 (WCAG 2.2.2, 2.1.1):
 * con prefers-reduced-motion no avanzan; el botón de pausa las detiene y reanuda; elegir una pestaña las
 * detiene; las flechas del teclado mueven entre pestañas (en RTL la flecha izquierda avanza) con un solo
 * tabindex activo. El panel lo pinta `children(activeId, panelProps)`.
 */
export function AutoRotatingTabs({
  tabs,
  intervalMs = 3500,
  tabsClassName = "art-tabs",
  tabClassName = "art-tab",
  activeTabClassName = "on",
  pauseLabel,
  playLabel,
  children,
}: {
  tabs: RotatingTab[];
  intervalMs?: number;
  tabsClassName?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  pauseLabel: string;
  playLabel: string;
  children: (activeId: string, panel: { id: string; role: "tabpanel"; "aria-labelledby": string }) => ReactNode;
}) {
  const base = useId();
  const ids = useMemo(() => tabs.map((t) => t.id).join("|"), [tabs]);
  const [active, setActive] = useState(tabs[0]?.id);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const running = !paused && !reduce;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setActive((prev) => {
        const idx = tabs.findIndex((t) => t.id === prev);
        return tabs[(idx + 1) % tabs.length].id;
      });
    }, intervalMs);
    return () => clearInterval(tick);
  }, [running, ids, intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(id: string) {
    setActive(id);
    setPaused(true);
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key as "ArrowRight" | "ArrowLeft"];
    let j: number | undefined;
    if (next) j = (i + next + tabs.length) % tabs.length;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = tabs.length - 1;
    if (j === undefined) return;
    e.preventDefault();
    pick(tabs[j].id);
    refs.current[j]?.focus();
  }

  const tabId = (id: string) => `${base}-tab-${id}`;
  const panelId = `${base}-panel`;

  return (
    <>
      <div className="art-tabs-row">
        <div className={tabsClassName} role="tablist">
          {tabs.map((t, i) => {
            const on = t.id === active;
            return (
              <button
                key={t.id}
                ref={(el) => { refs.current[i] = el; }}
                type="button"
                role="tab"
                id={tabId(t.id)}
                aria-selected={on}
                aria-controls={panelId}
                tabIndex={on ? 0 : -1}
                className={`${tabClassName}${on ? ` ${activeTabClassName}` : ""}`}
                onClick={() => pick(t.id)}
                onKeyDown={(e) => onKey(e, i)}
              >
                {t.label}
                {on && running && (
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
        {!reduce && (
          <button
            type="button"
            className="art-pause"
            onClick={() => setPaused((p) => !p)}
          >
            <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
            <span className="art-pause-label">{paused ? playLabel : pauseLabel}</span>
          </button>
        )}
      </div>
      {children(active, { id: panelId, role: "tabpanel", "aria-labelledby": tabId(active) })}
    </>
  );
}
