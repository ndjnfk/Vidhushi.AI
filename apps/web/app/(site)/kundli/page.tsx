"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BirthDetailsForm from "@/components/forms/BirthDetailsForm";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import ZodiacWheel from "@/components/ZodiacWheel";
import { generateKundli, type BirthDetailsIn } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const FEATURES = ["kundli.featureChart", "kundli.featureDasha", "kundli.featurePanchang"];

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
    <div className="relative -mx-6 -my-8 overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={41} />
      <ZodiacWheel className="animate-spin-slow pointer-events-none absolute -left-[12%] top-[8%] w-[min(60vw,640px)] opacity-25" />
      <Planet className="pointer-events-none absolute -bottom-[18%] -right-[10%] w-[min(40vw,520px)] opacity-80" />

      <div className="relative mx-auto grid min-h-[calc(100vh-97px)] max-w-[1400px] items-center gap-14 px-6 py-20 md:px-16 lg:grid-cols-[1fr_520px] lg:gap-24">
        <div>
          <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{t("kundli.pageTitle")}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.8rem,5.5vw,5rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
            {t("kundli.pageTitle")}
          </h1>
          <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-cream/85">{t("kundli.pageSubtitle")}</p>
          <ul className="mt-10 flex flex-col gap-4">
            {FEATURES.map((key) => (
              <li key={key} className="flex items-center gap-4 text-cream/90">
                <Sparkle className="h-3.5 w-3.5 shrink-0 text-gold" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="border border-line bg-ink/85 p-8 backdrop-blur-sm md:p-10">
          <BirthDetailsForm onSubmit={handleSubmit} busy={busy} />
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
