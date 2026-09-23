"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold">{t("home.title")}</h1>
      <p className="text-gray-600">{t("home.subtitle")}</p>
      <div className="flex gap-3">
        <a href="/kundli" className="bg-orange-600 text-white rounded px-5 py-2.5">
          {t("home.ctaKundli")}
        </a>
        <a href="/matching" className="border rounded px-5 py-2.5">
          {t("home.ctaMatching")}
        </a>
      </div>
    </div>
  );
}
