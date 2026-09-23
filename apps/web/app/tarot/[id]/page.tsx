"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TarotCardFace from "@/components/tarot/TarotCardFace";
import { getReading, type TarotReadingOut } from "@/lib/tarot";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TarotReadingPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [reading, setReading] = useState<TarotReadingOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReading(params.id).then(setReading).catch((e) => setError(e.message));
  }, [params.id]);

  if (!reading) return <p>{error ?? t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t("tarot.readingTitle")}</h1>
        {reading.question && <p className="text-gray-600 mt-1">&ldquo;{reading.question}&rdquo;</p>}
      </div>

      <div className="flex flex-wrap gap-8 justify-center">
        {reading.cards.map((card) => (
          <TarotCardFace key={card.position} card={card} />
        ))}
      </div>

      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {reading.cards.map((card) => (
          <div key={card.position} className="border rounded p-4">
            <h2 className="font-semibold">
              {card.position}: {card.name} {card.is_reversed && <span className="text-red-600 text-sm">({t("tarot.reversed")})</span>}
            </h2>
            <p className="text-gray-600 mt-1">{card.meaning}</p>
            <p className="text-xs text-gray-400 mt-2">{card.keywords.join(" · ")}</p>
          </div>
        ))}
      </div>

      <a href="/tarot" className="text-orange-600 text-sm mx-auto">{t("tarot.drawAnother")}</a>
    </div>
  );
}
