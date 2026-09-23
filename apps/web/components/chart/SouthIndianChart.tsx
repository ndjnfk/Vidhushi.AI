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

interface Props {
  chart: ChartOut;
  title?: string;
}

export default function SouthIndianChart({ chart, title }: Props) {
  const ascIndex = rashiIndex(chart.ascendant_sign);

  const planetsByRashi: Record<number, string[]> = {};
  for (const p of chart.planets) {
    const idx = rashiIndex(p.sign);
    const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
    const label = p.is_retrograde ? `${abbr}(R)` : abbr;
    (planetsByRashi[idx] ??= []).push(label);
  }

  const cellSize = 100;

  return (
    <div className="flex flex-col items-center gap-2">
      {title && <h3 className="font-semibold">{title}</h3>}
      <svg viewBox="0 0 400 400" className="w-full max-w-md border">
        {CELL_RASHI.map(([row, col, rashi]) => {
          const x = col * cellSize;
          const y = row * cellSize;
          const planets = planetsByRashi[rashi] ?? [];
          const isAscendant = rashi === ascIndex;
          return (
            <g key={rashi}>
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill="white"
                stroke="black"
                strokeWidth={1.5}
              />
              {isAscendant && (
                <line
                  x1={x + 6}
                  y1={y + cellSize - 6}
                  x2={x + 18}
                  y2={y + cellSize - 18}
                  stroke="red"
                  strokeWidth={2}
                />
              )}
              <text x={x + 6} y={y + 14} fontSize={10} fill="#888">
                {rashi + 1}
              </text>
              {planets.map((label, i) => (
                <text
                  key={label}
                  x={x + cellSize / 2}
                  y={y + 40 + i * 16}
                  fontSize={13}
                  textAnchor="middle"
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
