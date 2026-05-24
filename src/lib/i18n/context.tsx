"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Locale, Translations } from "./types";
import { RTL_LOCALES } from "./types";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { ru } from "./locales/ru";
import { he } from "./locales/he";
import { ar } from "./locales/ar";

const locales: Record<Locale, Translations> = { en, es, ru, he, ar };

/** Get translations object for a given locale string. Falls back to English. */
export function getTranslations(locale?: string): Translations {
  if (locale && locales[locale as Locale]) return locales[locale as Locale];
  return en;
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("arzac-locale") as Locale | null;
    if (stored && locales[stored]) return stored;
  } catch {}

  try {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === "he" || browserLang === "iw") return "he";
    if (browserLang === "ar") return "ar";
    if (browserLang === "ru") return "ru";
    if (browserLang === "es") return "es";
  } catch {}
  return "en";
}

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: en,
  setLocale: () => {},
  isRTL: false,
});

export function LandingI18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("arzac-locale", l); } catch {}
    document.documentElement.lang = l;
    document.documentElement.dir = RTL_LOCALES.includes(l) ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{ locale, t: locales[locale], setLocale, isRTL: RTL_LOCALES.includes(locale) }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
