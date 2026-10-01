"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

// Translated text for server-rendered pages: the HTML carries the default
// (English) string, and it switches when the visitor picks another language.
export default function T({ k }: { k: string }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}
