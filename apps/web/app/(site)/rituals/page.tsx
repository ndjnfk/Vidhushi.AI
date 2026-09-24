"use client";

import { useEffect, useState } from "react";
import { listRituals, type RitualServiceOut } from "@/lib/rituals";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RitualsPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<RitualServiceOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRituals().then(setServices).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("rituals.pageTitle")}</h1>
        <p className="text-gray-600 max-w-lg">{t("rituals.pageSubtitle")}</p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s) => (
          <a key={s.id} href={`/rituals/${s.id}`} className="border rounded p-4 flex flex-col gap-1 hover:shadow">
            <h2 className="font-semibold">{s.name}</h2>
            <p className="text-sm text-gray-600">{s.description}</p>
            <span className="text-sm mt-2 font-bold text-orange-600">
              ₹{s.price_min.toFixed(0)} – ₹{s.price_max.toFixed(0)} / week
            </span>
          </a>
        ))}
      </div>
      {services.length === 0 && !error && <p className="text-gray-500">{t("rituals.noServices")}</p>}
    </div>
  );
}
