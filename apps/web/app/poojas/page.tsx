"use client";

import { useEffect, useState } from "react";
import { listPoojas, type PoojaServiceOut } from "@/lib/poojas";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PoojasPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<PoojaServiceOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPoojas().then(setServices).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("poojas.pageTitle")}</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {services.map((s) => (
          <a
            key={s.id}
            href={`/poojas/${s.id}`}
            className="border rounded p-4 flex flex-col gap-1 hover:shadow"
          >
            <h2 className="font-semibold">{s.name}</h2>
            <p className="text-sm text-gray-600">{s.description}</p>
            <div className="flex justify-between text-sm mt-2">
              <span className="capitalize">{s.service_type} &middot; {s.duration_minutes} min</span>
              <span className="font-bold text-orange-600">₹{s.price.toFixed(0)}</span>
            </div>
          </a>
        ))}
      </div>
      {services.length === 0 && !error && <p className="text-gray-500">{t("poojas.noServices")}</p>}
    </div>
  );
}
