"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { drawReading } from "@/lib/tarot";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TarotPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [spread, setSpread] = useState<"single" | "three_card">("single");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDraw() {
    setBusy(true);
    setError(null);
    try {
      const reading = await drawReading(spread, question || undefined);
      router.push(`/tarot/${reading.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draw a reading");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">{t("tarot.pageTitle")}</h1>
        <p className="text-gray-600">{t("tarot.pageSubtitle")}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setSpread("single")}
          className={`border rounded px-4 py-2 text-sm ${spread === "single" ? "bg-orange-600 text-white border-orange-600" : ""}`}
        >
          {t("tarot.singleCard")}
        </button>
        <button
          onClick={() => setSpread("three_card")}
          className={`border rounded px-4 py-2 text-sm ${spread === "three_card" ? "bg-orange-600 text-white border-orange-600" : ""}`}
        >
          {t("tarot.threeCardSpread")}
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("tarot.questionLabel")}</span>
        <textarea
          className="border rounded px-3 py-2 min-h-20"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("tarot.questionPlaceholder")}
        />
      </label>

      <button onClick={handleDraw} disabled={busy} className="bg-orange-600 text-white rounded px-5 py-2.5 w-fit disabled:opacity-50">
        {busy ? t("tarot.shuffling") : t("tarot.drawButton")}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
