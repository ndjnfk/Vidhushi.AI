"use client";

import type { KundliOut } from "@/lib/api";
import { PLANET_ORDER, planetsByName, RASHI_LORDS } from "@/lib/kundliAnalysis";
import { NAKSHATRA_NAMES } from "@/lib/kundliReading";
import { rashiIndex } from "@/lib/rashi";
import { SubHeading, TabHeading, useReportText } from "./ui";

// Degrees as 12°34′.
function dms(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${String(m).padStart(2, "0")}′`;
}

const TH = "whitespace-nowrap px-4 py-3.5 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold";
const TD = "whitespace-nowrap px-4 py-3.5 text-cream/90";

export default function PlanetsTab({ kundli }: { kundli: KundliOut }) {
  const { R, P, planet, sign } = useReportText();
  const T = P.planets;
  const by = planetsByName(kundli);
  const planets = PLANET_ORDER.map((n) => by[n]).filter(Boolean);
  const nak = (name: string) => {
    const i = NAKSHATRA_NAMES.indexOf(name);
    return i >= 0 ? R.nakshatras[i] : name;
  };
  const lagnaIdx = rashiIndex(kundli.d1_chart.ascendant_sign);

  return (
    <div>
      <TabHeading title={P.tabs.planets} hint={T.intro} />
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[820px] border-collapse text-[15px]">
          <thead className="bg-ink-soft">
            <tr>
              {[T.planet, "R", T.sign, T.signLord, T.degree, T.nakshatra, T.nakLord, T.house, T.status].map((h) => (
                <th key={h} className={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr className="bg-gold/[0.06]">
              <td className={`${TD} font-display text-lg text-gold`}>{T.ascendant}</td>
              <td className={TD}>—</td>
              <td className={TD}>{sign(lagnaIdx)}</td>
              <td className={TD}>{planet(RASHI_LORDS[lagnaIdx])}</td>
              <td className={`${TD} tabular-nums`}>{dms(kundli.d1_chart.ascendant_degree)}</td>
              <td className={TD} colSpan={2}>—</td>
              <td className={TD}>1</td>
              <td className={TD}>—</td>
            </tr>
            {planets.map((p) => {
              const s = rashiIndex(p.sign);
              return (
                <tr key={p.planet} className="odd:bg-ink even:bg-ink-soft/40">
                  <td className={`${TD} font-display text-lg text-gold`}>{planet(p.planet)}</td>
                  <td className={TD}>{p.is_retrograde ? "R" : "—"}</td>
                  <td className={TD}>{sign(s)}</td>
                  <td className={TD}>{planet(RASHI_LORDS[s])}</td>
                  <td className={`${TD} tabular-nums`}>{dms(p.degree_in_sign)}</td>
                  <td className={TD}>{nak(p.nakshatra)} <span className="text-cream/50">({p.pada})</span></td>
                  <td className={TD}>{planet(p.nakshatra_lord)}</td>
                  <td className={`${TD} tabular-nums`}>{p.house}</td>
                  <td className={`${TD} ${p.dignity === "debilitated" ? "text-red-300" : p.dignity ? "text-gold" : "text-cream/50"}`}>{T.status_[p.dignity]}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-cream/50">{T.retro}</p>

      <SubHeading>{T.meaningTitle}</SubHeading>
      <ul className="grid gap-px border border-line bg-line md:grid-cols-2">
        {planets.map((p) => (
          <li key={p.planet} className="bg-ink px-6 py-5">
            <p className="flex flex-wrap items-baseline gap-x-3 font-display text-xl text-gold">
              {planet(p.planet)}
              <span className="font-body text-[13px] text-cream/55">{sign(rashiIndex(p.sign))} · {R.ordinal(p.house)}</span>
            </p>
            <p className="mt-2 leading-relaxed text-cream/85">{R.placement(planet(p.planet), R.ordinal(p.house), R.planetEffect[p.planet], R.houseArea[p.house - 1])}</p>
            {p.dignity && <p className="mt-1 text-sm text-gold/85">{R.dignity[p.dignity]}</p>}
            {p.is_retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" && <p className="mt-1 text-sm text-cream/60">{R.dignity.retro}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
