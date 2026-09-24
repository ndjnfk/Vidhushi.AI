"use client";

import { useState } from "react";
import NorthIndianChart from "@/components/chart/NorthIndianChart";
import SouthIndianChart from "@/components/chart/SouthIndianChart";
import type { ChartOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// One divisional chart with a North / South Indian style toggle.
export default function ChartCard({ title, chart }: { title: string; chart: ChartOut }) {
  const { t } = useLanguage();
  const [style, setStyle] = useState<"north" | "south">("north");

  const tab = (value: "north" | "south", label: string) => (
    <button
      type="button"
      onClick={() => setStyle(value)}
      aria-pressed={style === value}
      className={`px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
        style === value ? "bg-gold text-ink" : "text-cream/75 hover:text-gold"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl uppercase tracking-[0.05em] text-gold">{title}</h2>
        <div className="flex border border-line">
          {tab("north", t("kundli.northIndian"))}
          {tab("south", t("kundli.southIndian"))}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[440px]">
        {style === "north" ? <NorthIndianChart chart={chart} /> : <SouthIndianChart chart={chart} />}
      </div>
    </section>
  );
}
