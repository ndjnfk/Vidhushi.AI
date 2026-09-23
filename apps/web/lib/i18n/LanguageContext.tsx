"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE } from "@/lib/i18n/languages";
import en from "@/lib/i18n/dictionaries/en";
import hi from "@/lib/i18n/dictionaries/hi";
import pa from "@/lib/i18n/dictionaries/pa";
import mr from "@/lib/i18n/dictionaries/mr";
import gu from "@/lib/i18n/dictionaries/gu";

const DICTIONARIES: Record<string, Record<string, string>> = { en, hi, pa, mr, gu };
const STORAGE_KEY = "vidushiji_locale";

interface LanguageContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Defaults to English on both server and first client render (avoids a
  // hydration mismatch); the stored preference is applied after mount,
  // same tradeoff lib/auth.ts already accepts for the token.
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && DICTIONARIES[stored]) setLocaleState(stored);
    } catch {
      // ignore
    }
  }, []);

  function setLocale(next: string) {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function t(key: string): string {
    return DICTIONARIES[locale]?.[key] ?? DICTIONARIES[DEFAULT_LOCALE]?.[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
