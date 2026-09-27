"use client";

import { useState } from "react";
import type { KundliOut } from "@/lib/api";
import { childrenOf, DASHA_DEPTH, isRunning, runningChain, type DashaNode } from "@/lib/dashaLevels";
import { planetsByName } from "@/lib/kundliAnalysis";
import { Badge, CARD, EYEBROW, SubHeading, TabHeading, useReportText } from "./ui";

export default function DashaTab({ kundli }: { kundli: KundliOut }) {
  const { R, P, planet, date } = useReportText();
  const D = P.dasha;
  const [now] = useState(() => Date.now());
  const [path, setPath] = useState<DashaNode[]>([]);
  const chain = runningChain(kundli, now);
  const by = planetsByName(kundli);
  const rows = childrenOf(kundli, path);
  const level = path.length; // 0 = Mahadasha
  const withTime = level >= 2; // Pratyantar and below are short
  const [md, ad] = chain;

  return (
    <div>
      <TabHeading title={P.tabs.dasha} hint={D.intro} />

      {/* Running now */}
      {chain.length > 0 && (
        <section className={CARD}>
          <p className={EYEBROW}>{D.now}</p>
          <ol className="mt-4 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
            {chain.map((n, i) => (
              <li key={i} className="bg-ink px-4 py-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-cream/55">{D.levels[i]}</p>
                <p className="mt-1 font-display text-xl text-gold">{planet(n.lord)}</p>
                <p className="mt-1 text-xs leading-relaxed text-cream/60">{date(n.start, i >= 2)} — {date(n.end, i >= 2)}</p>
              </li>
            ))}
          </ol>
          {md && (
            <div className="mt-6">
              <p className={EYEBROW}>{D.meaning}</p>
              <p className="mt-2 leading-relaxed text-cream/85">{R.dasha[md.lord]}</p>
              {by[md.lord] && (
                <p className="mt-2 leading-relaxed text-cream/75">
                  {R.dashaPlacement(planet(md.lord), R.ordinal(by[md.lord].house), R.houseArea[by[md.lord].house - 1])}
                </p>
              )}
              {ad && ad.lord !== md.lord && <p className="mt-3 text-sm leading-relaxed text-cream/65">{D.levels[1]} — {planet(ad.lord)}: {R.dasha[ad.lord]}</p>}
            </div>
          )}
        </section>
      )}

      {/* Explorer */}
      <SubHeading>{D.levels[level]}</SubHeading>
      <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-3" aria-label="Dasha levels">
        {D.levels.map((name, i) => (
          <li key={name} className="flex items-center gap-2">
            <button type="button" disabled={i > level} onClick={() => setPath(path.slice(0, i))}
              className={`flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em] transition-colors disabled:cursor-default ${
                i === level ? "text-gold" : i < level ? "text-cream/80 hover:text-gold" : "text-cream/30"
              }`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] ${i === level ? "border-gold bg-gold text-ink" : i < level ? "border-gold/60 text-gold" : "border-line"}`}>
                {i + 1}
              </span>
              <span className="hidden sm:inline">{name}</span>
              {i < level && <span className="normal-case tracking-normal text-cream/60">({planet(path[i].lord)})</span>}
            </button>
            {i < DASHA_DEPTH - 1 && <span className="h-px w-5 bg-line sm:w-8" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[560px] border-collapse text-[15px]">
          <thead className="bg-ink-soft">
            <tr>
              {[D.planet, D.start, D.end, ""].map((h, i) => (
                <th key={i} className="px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((n) => {
              const running = isRunning(n, now);
              const canOpen = level < DASHA_DEPTH - 1;
              return (
                <tr key={n.start} onClick={canOpen ? () => setPath([...path, n]) : undefined}
                  className={`${running ? "bg-gold/[0.08]" : "odd:bg-ink even:bg-ink-soft/40"} ${canOpen ? "cursor-pointer hover:bg-gold/[0.12]" : ""}`}>
                  <td className="px-4 py-3.5">
                    <span className="font-display text-lg text-gold">{planet(n.lord)}</span>
                    {running && <span className="ml-3"><Badge tone="good">{D.current}</Badge></span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-cream/85">{date(n.start, withTime)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-cream/85">{date(n.end, withTime)}</td>
                  <td className="px-4 py-3.5 text-right">
                    {canOpen && (
                      <button type="button" aria-label={`${D.open}: ${planet(n.lord)}`} onClick={(e) => { e.stopPropagation(); setPath([...path, n]); }}
                        className="text-cream/60 hover:text-gold">→</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {level > 0 && (
        <button type="button" onClick={() => setPath(path.slice(0, -1))}
          className="mt-5 inline-flex items-center gap-2 border border-cream/40 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream hover:border-gold hover:text-gold">
          ← {D.back}
        </button>
      )}
    </div>
  );
}
