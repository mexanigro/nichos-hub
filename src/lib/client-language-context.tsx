"use client";

import { createContext, useContext } from "react";
import {
  type ClientLanguage,
  DEFAULT_CLIENT_LANGUAGE,
} from "@/lib/client-language";
import {
  placeholderFor,
  type PlaceholderKey,
} from "@/lib/dashboard-placeholders";

/**
 * Context que comparte el idioma del cliente entre el banner (que lo cambia) y
 * los editores anidados (que lo usan para sus placeholders). Evita prop-drilling
 * a través de varios componentes (Section → Editor → Sub-editor).
 *
 * Si un componente lo consume sin un provider, devuelve el default — así los
 * editores pueden seguir renderizándose en tests o en otros contextos sin
 * romperse.
 */
const ClientLanguageContext = createContext<ClientLanguage>(DEFAULT_CLIENT_LANGUAGE);

export function ClientLanguageProvider({
  language,
  children,
}: {
  language: ClientLanguage;
  children: React.ReactNode;
}) {
  return (
    <ClientLanguageContext.Provider value={language}>
      {children}
    </ClientLanguageContext.Provider>
  );
}

export function useClientLanguage(): ClientLanguage {
  return useContext(ClientLanguageContext);
}

/** Atajo: lookup directo desde el componente sin pasar por placeholderFor. */
export function usePlaceholder(key: PlaceholderKey): string {
  const lang = useClientLanguage();
  return placeholderFor(lang, key);
}
