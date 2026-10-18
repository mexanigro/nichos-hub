"use client";
import { useT } from "@/lib/i18n/context";
import { LOCALE_CODES, LOCALE_NAMES } from "@/lib/i18n/types";

export function LangSwitch({ variant = "light" }: { variant?: "light" }) {
  const { locale, setLocale, t } = useT();
  return (
    <div className={`lang-switch lang-${variant}`} role="group" aria-label={t.a11y?.languages}>
      {LOCALE_CODES.map((l) => (
        <button
          key={l.code}
          type="button"
          className={locale === l.code ? "on" : ""}
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          aria-label={LOCALE_NAMES[l.code]}
          lang={l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
