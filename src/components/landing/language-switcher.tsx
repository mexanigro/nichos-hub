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
        className="flex items-center gap-1.5 rounded-[var(--l-radius-sm)] px-3 py-2 text-[0.85rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text-2)]"
      >
        <Globe size={15} />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 min-w-[120px] rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-card)] p-1.5 shadow-lg shadow-black/5">
          {(Object.keys(LOCALE_NAMES) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`block w-full rounded-[6px] px-3 py-2 text-start text-[0.85rem] transition-colors duration-150 ${
                l === locale
                  ? "bg-[var(--l-accent-muted)] font-medium text-[var(--l-accent)]"
                  : "text-[var(--l-text-2)] hover:bg-[var(--l-surface)]"
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
