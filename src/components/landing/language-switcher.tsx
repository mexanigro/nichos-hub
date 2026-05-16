"use client";

import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useT, LOCALE_NAMES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-hover hover:text-text"
      >
        <Globe size={14} />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-1 min-w-[120px] rounded-md border border-border bg-bg-card p-1 shadow-lg">
          {(Object.keys(LOCALE_NAMES) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`block w-full rounded px-3 py-1.5 text-start text-xs transition-colors ${
                l === locale
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text"
              }`}
            >
              {LOCALE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
