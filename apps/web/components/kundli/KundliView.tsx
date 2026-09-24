"use client";

import Link from "next/link";
import ChartCard from "@/components/chart/ChartCard";
import DashaTimeline from "@/components/DashaTimeline";
import PanchangCard from "@/components/PanchangCard";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import type { KundliOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function KundliView({ kundli }: { kundli: KundliOut }) {
  const { t } = useLanguage();
  const moon = kundli.d1_chart.planets.find((p) => p.planet === "Moon");

  const summary: [string, string][] = [
    ["kundli.ascendant", kundli.d1_chart.ascendant_sign],
    ["kundli.moonSign", moon?.sign ?? "—"],
    ["kundli.nakshatra", moon ? `${moon.nakshatra} · ${t("kundli.pada")} ${moon.pada}` : "—"],
  ];

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      {/* Banner */}
      <header className="relative overflow-hidden border-b border-line px-6 pb-16 pt-20 md:px-16 lg:px-[6%]">
        <Starfield seed={43} />
        <Planet className="pointer-events-none absolute -right-[8%] -top-[30%] w-[min(38vw,480px)] opacity-85" />
        <div className="relative">
          <p className="flex flex-wrap items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <Link href="/kundli" className="hover:text-gold">{t("kundli.pageTitle")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{kundli.name}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.4rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
            {kundli.name}
          </h1>
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[1.05rem] text-cream/85">
            <span>{fmtDate(kundli.birth_date)}</span>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span>{kundli.birth_time.slice(0, 5)}</span>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span>{kundli.place_name}</span>
          </p>

          <dl className="mt-10 grid max-w-3xl gap-px border border-line bg-line sm:grid-cols-3">
            {summary.map(([key, value]) => (
              <div key={key} className="bg-ink/90 px-6 py-5">
                <dt className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/65">{t(key)}</dt>
                <dd className="mt-2 font-display text-2xl text-gold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="flex flex-col gap-8 px-6 py-14 md:px-16 lg:px-[6%]">
        <div className="grid gap-8 lg:grid-cols-2">
          <ChartCard title={t("kundli.rashiChart")} chart={kundli.d1_chart} />
          <ChartCard title={t("kundli.navamsaChart")} chart={kundli.d9_chart} />
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <PanchangCard panchang={kundli.panchang} />
          <DashaTimeline dasha={kundli.dasha} />
        </div>
        <div className="flex justify-center pt-6">
          <Link
            href="/kundli"
            className="inline-flex items-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:border-gold hover:text-gold"
          >
            <Sparkle className="h-3.5 w-3.5 text-gold" />
            {t("kundli.newKundli")}
          </Link>
        </div>
      </div>
    </div>
  );
}
