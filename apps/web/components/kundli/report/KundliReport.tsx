"use client";

import { useRef, useState } from "react";
import ChartCard from "@/components/chart/ChartCard";
import type { KundliOut } from "@/lib/api";
import type { TabKey } from "@/lib/kundliReport";
import BasicTab from "./BasicTab";
import DashaTab from "./DashaTab";
import DoshaTab from "./DoshaTab";
import PlanetsTab from "./PlanetsTab";
import PredictionsTab from "./PredictionsTab";
import { TabHeading, useReportText } from "./ui";

const TABS: TabKey[] = ["basic", "predictions", "planets", "chart", "dosha", "dasha"];

// The kundli report: one tab per part, in plain language with the
// astrology terms alongside.
export default function KundliReport({ kundli }: { kundli: KundliOut }) {
  const { P } = useReportText();
  const [tab, setTab] = useState<TabKey>("basic");
  const top = useRef<HTMLDivElement>(null);

  const select = (t: TabKey) => {
    setTab(t);
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ behavior: "smooth" });
  };

  const body: Record<TabKey, React.ReactNode> = {
    basic: <BasicTab kundli={kundli} />,
    predictions: <PredictionsTab kundli={kundli} />,
    planets: <PlanetsTab kundli={kundli} />,
    chart: (
      <div>
        <TabHeading title={P.tabs.chart} hint={P.chart.intro} />
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <ChartCard title={P.chart.d1} chart={kundli.d1_chart} />
            <p className="mt-3 text-sm text-cream/60">{P.chart.d1Hint}</p>
          </div>
          <div>
            <ChartCard title={P.chart.d9} chart={kundli.d9_chart} />
            <p className="mt-3 text-sm text-cream/60">{P.chart.d9Hint}</p>
          </div>
        </div>
      </div>
    ),
    dosha: <DoshaTab kundli={kundli} />,
    dasha: <DashaTab kundli={kundli} />,
  };
  const i = TABS.indexOf(tab);

  return (
    <div ref={top} className="scroll-mt-28">
      <nav aria-label={P.title} className="no-scrollbar overflow-x-auto border-b border-line">
        <ul className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <li key={t}>
              <button type="button" onClick={() => select(t)} aria-current={tab === t ? "page" : undefined}
                className={`relative whitespace-nowrap px-4 py-5 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                  tab === t ? "text-gold" : "text-cream/70 hover:text-cream"
                }`}>
                {P.tabs[t]}
                {tab === t && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-gold" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="py-12">{body[tab]}</div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8">
        <button type="button" onClick={() => select(TABS[i - 1])} disabled={i === 0}
          className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70 hover:text-gold disabled:invisible">
          ← {i > 0 ? P.tabs[TABS[i - 1]] : ""}
        </button>
        <button type="button" onClick={() => select(TABS[i + 1])} disabled={i === TABS.length - 1}
          className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70 hover:text-gold disabled:invisible">
          {i < TABS.length - 1 ? P.tabs[TABS[i + 1]] : ""} →
        </button>
      </div>
      <p className="mt-10 text-center text-sm italic leading-relaxed text-cream/55">{P.disclaimer}</p>
    </div>
  );
}
