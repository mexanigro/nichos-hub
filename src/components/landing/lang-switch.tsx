"use client";
import { useT } from "@/lib/i18n/context";
import { LOCALE_CODES, type Locale } from "@/lib/i18n/types";

export function LangSwitch({ variant = "light" }: { variant?: "light" }) {
  const { locale, setLocale } = useT();
  return (
    <div className={`lang-switch lang-${variant}`}>
      {LOCALE_CODES.map((l) => (
        <button
          key={l.code}
          className={locale === l.code ? "on" : ""}
          onClick={() => setLocale(l.code)}
          aria-label={l.label}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
