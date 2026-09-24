"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BirthDetailsForm from "@/components/forms/BirthDetailsForm";
import GunaMilanResult from "@/components/GunaMilanResult";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { computeGunaMilan, type BirthDetailsIn, type GunaMilanOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function PersonCard({
  title,
  saved,
  onSave,
}: {
  title: string;
  saved: BirthDetailsIn | null;
  onSave: (d: BirthDetailsIn) => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl uppercase tracking-[0.05em] text-gold">{title}</h2>
        {saved && (
          <span className="flex items-center gap-2 border border-gold/50 px-3 py-1 text-[12px] font-extrabold uppercase tracking-[0.12em] text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M5 12l5 5 9-10" />
            </svg>
            {t("matching.savedPrefix")} {saved.name}
          </span>
        )}
      </div>
      <BirthDetailsForm submitLabel={t("matching.saveButton")} onSubmit={onSave} />
    </section>
  );
}

export default function MatchingPage() {
  const { t } = useLanguage();
  const [boy, setBoy] = useState<BirthDetailsIn | null>(null);
  const [girl, setGirl] = useState<BirthDetailsIn | null>(null);
  const [result, setResult] = useState<GunaMilanOut | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

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
    <div className="relative -mx-6 -my-8 overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={47} />
      <Planet className="pointer-events-none absolute -right-[10%] -top-[6%] w-[min(38vw,480px)] opacity-80" />
      <Planet variant="grey" className="pointer-events-none absolute left-[4%] top-[42%] w-[min(5vw,60px)]" />

      <div className="relative mx-auto max-w-[1400px] px-6 pb-24 pt-20 md:px-16">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <span className="text-gold">{t("nav.matching")}</span>
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.6rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t("matching.pageTitle")}
        </h1>
        <p className="mt-6 max-w-2xl text-[1.15rem] leading-relaxed text-cream/85">{t("matching.pageSubtitle")}</p>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <PersonCard title={t("matching.groomDetails")} saved={boy} onSave={setBoy} />
          <PersonCard title={t("matching.brideDetails")} saved={girl} onSave={setGirl} />
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleCompute}
            disabled={!boy || !girl || busy}
            className="inline-flex items-center gap-3 bg-white px-10 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:border disabled:border-line disabled:bg-transparent disabled:text-cream/50"
          >
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {busy ? t("matching.computing") : t("matching.computeButton")}
          </button>
          {!(boy && girl) && <p className="text-sm text-cream/60">{t("matching.saveBothHint")}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {result && (
          <div ref={resultRef} className="mt-14 scroll-mt-8">
            <GunaMilanResult result={result} />
          </div>
        )}
      </div>
    </div>
  );
}
