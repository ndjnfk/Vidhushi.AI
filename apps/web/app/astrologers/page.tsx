"use client";

import { useEffect, useState } from "react";
import { listAstrologers, type AstrologerOut } from "@/lib/astrologers";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AstrologersPage() {
  const { t } = useLanguage();
  const [astrologers, setAstrologers] = useState<AstrologerOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAstrologers().then(setAstrologers).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("astrologers.pageTitle")}</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {astrologers.map((a) => (
          <a key={a.id} href={`/astrologers/${a.id}`} className="border rounded p-4 flex flex-col gap-1 hover:shadow">
            <div className="flex justify-between items-start">
              <h2 className="font-semibold">{a.name}</h2>
              {a.is_online && <span className="text-xs text-green-600 font-medium">● {t("astrologers.online")}</span>}
            </div>
            <p className="text-sm text-gray-600">{a.bio}</p>
            <p className="text-xs text-gray-500">{a.languages.join(", ")} &middot; {a.experience_years} yrs experience</p>
            <div className="flex justify-between text-sm mt-2">
              <span>{a.specialties.join(", ")}</span>
              {a.rate_per_session != null && <span className="font-bold text-orange-600">₹{a.rate_per_session.toFixed(0)}/session</span>}
            </div>
          </a>
        ))}
      </div>
      {astrologers.length === 0 && !error && <p className="text-gray-500">{t("astrologers.noAstrologers")}</p>}
    </div>
  );
}
