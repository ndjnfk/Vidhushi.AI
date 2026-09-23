"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BirthDetailsForm from "@/components/forms/BirthDetailsForm";
import { generateKundli, type BirthDetailsIn } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function KundliPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(details: BirthDetailsIn) {
    setBusy(true);
    setError(null);
    try {
      const kundli = await generateKundli(details);
      router.push(`/kundli/${kundli.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("kundli.pageTitle")}</h1>
      <p className="text-gray-600 max-w-md">{t("kundli.pageSubtitle")}</p>
      <BirthDetailsForm onSubmit={handleSubmit} busy={busy} />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
