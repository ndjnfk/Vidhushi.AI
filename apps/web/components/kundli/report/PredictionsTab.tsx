"use client";

import { useState } from "react";
import type { KundliOut } from "@/lib/api";
import { runningChain } from "@/lib/dashaLevels";
import { analyseAreas, BENEFICS, planetsByName } from "@/lib/kundliAnalysis";
import { NAKSHATRA_NAMES, type Verdict } from "@/lib/kundliReading";
import { rashiIndex } from "@/lib/rashi";
import { Badge, CARD, EYEBROW, SubHeading, TabHeading, type Tone, useReportText } from "./ui";

export const VERDICT_TONE: Record<Verdict, Tone> = { strong: "good", supported: "good", steady: "ok", effort: "warn" };

export default function PredictionsTab({ kundli }: { kundli: KundliOut }) {
  const { R, P, planet, sign, date } = useReportText();
  const T = P.predictions;
  const [now] = useState(() => Date.now());
  const by = planetsByName(kundli);
  const moon = by.Moon;
  const lagnaIdx = rashiIndex(kundli.d1_chart.ascendant_sign);
  const moonIdx = moon ? rashiIndex(moon.sign) : -1;
  const nakIdx = moon ? NAKSHATRA_NAMES.indexOf(moon.nakshatra) : -1;
  const areas = analyseAreas(kundli);
  const good = areas.filter((a) => a.verdict === "strong" || a.verdict === "supported");
  const care = areas.filter((a) => a.verdict === "effort");
  const [md, ad] = runningChain(kundli, now);
  const mdLord = md ? by[md.lord] : undefined;

  const nature: [string, string, string | undefined][] = [
    [T.lagna, sign(lagnaIdx), R.lagna[lagnaIdx]],
    [T.moon, sign(moonIdx), R.moon[moonIdx]],
    [T.nakshatra, nakIdx >= 0 ? R.nakshatras[nakIdx] : "—", R.nakshatraText[nakIdx]],
  ];

  return (
    <div>
      <TabHeading title={P.tabs.predictions} hint={T.areasHint} />

      {/* Nature */}
      <SubHeading>{T.nature}</SubHeading>
      <div className="grid gap-6 lg:grid-cols-3">
        {nature.map(([label, value, text]) => (
          <article key={label} className={CARD}>
            <p className={EYEBROW}>{label}</p>
            <h4 className="mt-3 font-display text-[1.6rem] leading-tight text-gold">{value}</h4>
            {text && <p className="mt-4 leading-relaxed text-cream/85">{text}</p>}
          </article>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className={CARD}>
          <p className={EYEBROW}>{T.strengths}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {good.length ? good.map((a) => <Badge key={a.key} tone="good">{T.areas[a.key].title}</Badge>) : <span className="text-cream/50">—</span>}
          </div>
        </div>
        <div className={CARD}>
          <p className={EYEBROW}>{T.care}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {care.length ? care.map((a) => <Badge key={a.key} tone="warn">{T.areas[a.key].title}</Badge>) : <span className="text-cream/50">—</span>}
          </div>
        </div>
      </div>

      {/* Life areas */}
      <SubHeading>{T.areasTitle}</SubHeading>
      <div className="grid gap-6 md:grid-cols-2">
        {areas.map((a) => {
          const A = T.areas[a.key];
          return (
            <article key={a.key} className={CARD}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-display text-[1.4rem] leading-tight text-gold">{A.title}</h4>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-cream/45">{A.term}</p>
                </div>
                <Badge tone={VERDICT_TONE[a.verdict]}>{R.verdictLabel[a.verdict]}</Badge>
              </div>
              <p className="mt-4 leading-relaxed text-cream/85">{A.text[a.verdict]}</p>
              {a.occupants.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm leading-relaxed text-cream/70">
                  {a.occupants.map((p) => (
                    <li key={p.planet}>
                      {(BENEFICS.has(p.planet) ? T.goodPlanet : T.hardPlanet)(planet(p.planet), R.planetEffect[p.planet])}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {/* Now */}
      {md && (
        <>
          <SubHeading>{T.now}</SubHeading>
          <article className={CARD}>
            <p className={EYEBROW}>{T.nowHint}</p>
            <h4 className="mt-3 font-display text-[1.6rem] leading-tight text-gold">
              {planet(md.lord)}
              {ad && <span className="text-cream/80"> → {planet(ad.lord)}</span>}
            </h4>
            <p className="mt-2 text-sm text-cream/60">
              {P.dasha.levels[0]} {planet(md.lord)}: {R.until(date(md.end))}
              {ad && <> · {P.dasha.levels[1]} {planet(ad.lord)}: {R.until(date(ad.end))}</>}
            </p>
            <p className="mt-4 leading-relaxed text-cream/85">{R.dasha[md.lord]}</p>
            {mdLord && <p className="mt-2 leading-relaxed text-cream/75">{R.dashaPlacement(planet(md.lord), R.ordinal(mdLord.house), R.houseArea[mdLord.house - 1])}</p>}
            {ad && ad.lord !== md.lord && <p className="mt-3 text-sm leading-relaxed text-cream/65">{P.dasha.levels[1]} — {planet(ad.lord)}: {R.dasha[ad.lord]}</p>}
          </article>
        </>
      )}
    </div>
  );
}
