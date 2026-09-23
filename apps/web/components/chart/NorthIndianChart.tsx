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

interface Props {
  chart: ChartOut;
  title?: string;
}

export default function NorthIndianChart({ chart, title }: Props) {
  const ascIndex = rashiIndex(chart.ascendant_sign);

  const planetsByHouse: Record<number, string[]> = {};
  for (const p of chart.planets) {
    const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
    const label = p.is_retrograde ? `${abbr}(R)` : abbr;
    (planetsByHouse[p.house] ??= []).push(label);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {title && <h3 className="font-semibold">{title}</h3>}
      <svg viewBox="0 0 400 400" className="w-full max-w-md border">
        <rect x={0} y={0} width={400} height={400} fill="white" stroke="black" strokeWidth={2} />
        <polygon points="0,0 400,0 400,400 0,400" fill="none" stroke="black" strokeWidth={1.5} />
        <line x1={0} y1={0} x2={400} y2={400} stroke="black" strokeWidth={1.5} />
        <line x1={400} y1={0} x2={0} y2={400} stroke="black" strokeWidth={1.5} />
        <polygon points="200,0 400,200 200,400 0,200" fill="none" stroke="black" strokeWidth={1.5} />

        {Object.entries(HOUSE_LABEL_POS).map(([houseStr, [x, y]]) => {
          const house = Number(houseStr);
          const rashiNum = ((ascIndex + house - 1) % 12) + 1;
          const planets = planetsByHouse[house] ?? [];
          return (
            <g key={house}>
              <text x={x} y={y - 18} fontSize={11} textAnchor="middle" fill="#888">
                {rashiNum}
              </text>
              {planets.map((label, i) => (
                <text
                  key={label}
                  x={x}
                  y={y + i * 14}
                  fontSize={13}
                  textAnchor="middle"
                  fontWeight={house === 1 ? "bold" : "normal"}
                >
                  {label}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
