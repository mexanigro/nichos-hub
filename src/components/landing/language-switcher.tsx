"use client";

import { useT, LOCALE_CODES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useT();

  return (
    <div
      className="flex items-center overflow-hidden rounded-[var(--l-radius-sm)] border border-[var(--l-border)] bg-[var(--l-surface)]"
      role="radiogroup"
      aria-label="Language"
    >
      {LOCALE_CODES.map(({ code, label }, i) => (
        <button
          key={code}
          role="radio"
          aria-checked={code === locale}
          onClick={() => setLocale(code)}
          className={`px-2.5 py-1.5 text-[0.78rem] font-semibold tracking-wide transition-colors duration-150 ${
            i < LOCALE_CODES.length - 1 ? "border-e border-[var(--l-border)]" : ""
          } ${
            code === locale
              ? "bg-[var(--l-accent-muted)] text-[var(--l-text)]"
              : "text-[var(--l-text-3)] hover:text-[var(--l-text)]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
