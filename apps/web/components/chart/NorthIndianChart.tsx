import type { ChartOut } from "@/lib/api";
import { PLANET_ABBR, rashiIndex } from "@/lib/rashi";

// Fixed North-Indian layout: the outer square + both diagonals + the
// midpoint diamond together carve out 12 regions, clockwise starting at
// the top (house 1) diamond. Label anchor points for a 400x400 viewBox:
const HOUSE_LABEL_POS: Record<number, [number, number]> = {
  1: [200, 90], 2: [300, 33], 3: [366, 100], 4: [300, 200],
  5: [366, 300], 6: [300, 366], 7: [200, 300], 8: [100, 366],
  9: [33, 300], 10: [100, 200], 11: [33, 100], 12: [100, 33],
};

const LINE = { stroke: "var(--color-gold)", strokeOpacity: 0.55, strokeWidth: 1.2, fill: "none" };

export default function NorthIndianChart({ chart }: { chart: ChartOut }) {
  const ascIndex = rashiIndex(chart.ascendant_sign);

  const planetsByHouse: Record<number, string[]> = {};
  for (const p of chart.planets) {
    const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
    const label = p.is_retrograde ? `${abbr}(R)` : abbr;
    (planetsByHouse[p.house] ??= []).push(label);
  }

  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full font-body" role="img" aria-label="North Indian chart">
      {/* Ascendant (house 1) diamond */}
      <polygon points="200,0 300,100 200,200 100,100" fill="var(--color-gold)" fillOpacity={0.1} />
      <rect x={1} y={1} width={398} height={398} {...LINE} strokeWidth={1.6} />
      <line x1={0} y1={0} x2={400} y2={400} {...LINE} />
      <line x1={400} y1={0} x2={0} y2={400} {...LINE} />
      <polygon points="200,0 400,200 200,400 0,200" {...LINE} />

      {Object.entries(HOUSE_LABEL_POS).map(([houseStr, [x, y]]) => {
        const house = Number(houseStr);
        const rashiNum = ((ascIndex + house - 1) % 12) + 1;
        const planets = planetsByHouse[house] ?? [];
        return (
          <g key={house}>
            <text x={x} y={y - 18} fontSize={11} textAnchor="middle" fill="var(--color-cream)" fillOpacity={0.45}>
              {rashiNum}
            </text>
            {planets.map((label, i) => (
              <text
                key={label}
                x={x}
                y={y + i * 15}
                fontSize={14}
                textAnchor="middle"
                fill={house === 1 ? "var(--color-gold)" : "var(--color-cream)"}
                fontWeight={house === 1 ? 700 : 500}
              >
                {label}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
