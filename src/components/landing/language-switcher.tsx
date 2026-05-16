"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Globe } from "lucide-react";
import { useT, LOCALE_NAMES } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const locales = Object.keys(LOCALE_NAMES) as Locale[];

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard: Escape closes, arrows navigate
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      const list = listRef.current;
      if (!list) return;
      const items = list.querySelectorAll<HTMLElement>('[role="option"]');
      if (items.length === 0) return;
      const currentIndex = Array.from(items).indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[next].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prev].focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, close]);

  // Focus first option when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        const active = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
        (active || listRef.current?.querySelector<HTMLElement>('[role="option"]'))?.focus();
      });
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Idioma"
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-[var(--l-radius-sm)] px-3 py-2 text-[0.85rem] font-medium text-[var(--l-text-3)] transition-colors duration-200 hover:text-[var(--l-text-2)]"
      >
        <Globe size={15} aria-hidden="true" />
        <span>{LOCALE_NAMES[locale]}</span>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Seleccionar idioma"
          className="absolute end-0 top-full z-50 mt-2 min-w-[120px] rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-card)] p-1.5 shadow-lg shadow-black/5"
        >
          {locales.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              tabIndex={0}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`block w-full rounded-[6px] px-3 py-2 text-start text-[0.85rem] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--l-accent)]/30 ${
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
