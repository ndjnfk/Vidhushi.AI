import type { ChartOut } from "@/lib/api";
import { PLANET_ABBR, rashiIndex } from "@/lib/rashi";

// Fixed sign-per-cell layout (South Indian style): signs never move, only
// the ascendant marker rotates. Grid is 4x4, center 2x2 left empty.
// [row, col] -> 0-based rashi index (Mesha=0 ... Meena=11).
const CELL_RASHI: [number, number, number][] = [
  [0, 0, 11], [0, 1, 0], [0, 2, 1], [0, 3, 2],
  [1, 3, 3],
  [2, 3, 4],
  [3, 3, 5], [3, 2, 6], [3, 1, 7], [3, 0, 8],
  [2, 0, 9],
  [1, 0, 10],
];

const CELL = 100;

export default function SouthIndianChart({ chart }: { chart: ChartOut }) {
  const ascIndex = rashiIndex(chart.ascendant_sign);

  const planetsByRashi: Record<number, string[]> = {};
  for (const p of chart.planets) {
    const idx = rashiIndex(p.sign);
    const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
    const label = p.is_retrograde ? `${abbr}(R)` : abbr;
    (planetsByRashi[idx] ??= []).push(label);
  }

  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full font-body" role="img" aria-label="South Indian chart">
      {CELL_RASHI.map(([row, col, rashi]) => {
        const x = col * CELL;
        const y = row * CELL;
        const planets = planetsByRashi[rashi] ?? [];
        const isAscendant = rashi === ascIndex;
        return (
          <g key={rashi}>
            <rect
              x={x + 0.6}
              y={y + 0.6}
              width={CELL - 1.2}
              height={CELL - 1.2}
              fill={isAscendant ? "var(--color-gold)" : "none"}
              fillOpacity={isAscendant ? 0.1 : 0}
              stroke="var(--color-gold)"
              strokeOpacity={0.55}
              strokeWidth={1.2}
            />
            {isAscendant && (
              <line x1={x + 8} y1={y + CELL - 8} x2={x + 22} y2={y + CELL - 22} stroke="var(--color-gold)" strokeWidth={2} />
            )}
            <text x={x + 8} y={y + 16} fontSize={11} fill="var(--color-cream)" fillOpacity={0.45}>
              {rashi + 1}
            </text>
            {planets.map((label, i) => (
              <text
                key={label}
                x={x + CELL / 2}
                y={y + 44 + i * 16}
                fontSize={14}
                textAnchor="middle"
                fill={isAscendant ? "var(--color-gold)" : "var(--color-cream)"}
                fontWeight={isAscendant ? 700 : 500}
              >
                {label}
              </text>
            ))}
          </g>
        );
      })}
      {/* Empty centre: small ornament */}
      <path
        d="M200 170C201.5 187 213 198.5 230 200C213 201.5 201.5 213 200 230C198.5 213 187 201.5 170 200C187 198.5 198.5 187 200 170Z"
        fill="var(--color-gold)"
        fillOpacity={0.35}
      />
    </svg>
  );
}
