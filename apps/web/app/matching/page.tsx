"use client";

import { useState } from "react";
import BirthDetailsForm from "@/components/forms/BirthDetailsForm";
import GunaMilanResult from "@/components/GunaMilanResult";
import { computeGunaMilan, type BirthDetailsIn, type GunaMilanOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MatchingPage() {
  const { t } = useLanguage();
  const [boy, setBoy] = useState<BirthDetailsIn | null>(null);
  const [girl, setGirl] = useState<BirthDetailsIn | null>(null);
  const [result, setResult] = useState<GunaMilanOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompute() {
    if (!boy || !girl) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await computeGunaMilan(boy, girl));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{t("matching.pageTitle")}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold mb-3">{t("matching.groomDetails")}</h2>
          <BirthDetailsForm submitLabel={t("matching.saveButton")} onSubmit={setBoy} />
          {boy && <p className="text-sm text-green-600 mt-2">{t("matching.savedPrefix")} {boy.name}</p>}
        </div>
        <div>
          <h2 className="font-semibold mb-3">{t("matching.brideDetails")}</h2>
          <BirthDetailsForm submitLabel={t("matching.saveButton")} onSubmit={setGirl} />
          {girl && <p className="text-sm text-green-600 mt-2">{t("matching.savedPrefix")} {girl.name}</p>}
        </div>
      </div>

      <button
        onClick={handleCompute}
        disabled={!boy || !girl || busy}
        className="bg-orange-600 text-white rounded px-5 py-2.5 w-fit disabled:opacity-50"
      >
        {busy ? t("matching.computing") : t("matching.computeButton")}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && <GunaMilanResult result={result} />}
    </div>
  );
}
