// Gold rashi chakra: twelve sign glyphs around a hexagram and a small sun.
// U+FE0E keeps the glyphs as text symbols instead of colour emoji.
const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => g + "︎");

const C = 100;
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
const fmt = (n: number) => n.toFixed(2);

export default function ZodiacWheel({ className = "" }: { className?: string }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const hexagram = [0, 1].map((k) =>
    [0, 120, 240].map((d) => polar(56, d + k * 60).map(fmt).join(",")).join(" "),
  );

  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="zw-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3dcb4" />
          <stop offset="0.5" stopColor="#c7a17a" />
          <stop offset="1" stopColor="#8f6a47" />
        </linearGradient>
        <radialGradient id="zw-disc">
          <stop offset="0" stopColor="#1c120e" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0b0809" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="zw-sun">
          <stop offset="0" stopColor="#fff1d6" />
          <stop offset="0.6" stopColor="#e2bd86" />
          <stop offset="1" stopColor="#a8845f" />
        </radialGradient>
      </defs>

      <circle cx={C} cy={C} r="97" fill="url(#zw-disc)" />

      <g stroke="url(#zw-gold)" fill="none">
        <circle cx={C} cy={C} r="97" strokeWidth="1.2" />
        <circle cx={C} cy={C} r="90" strokeWidth="0.6" />
        <circle cx={C} cy={C} r="64" strokeWidth="0.8" />
        <circle cx={C} cy={C} r="60" strokeWidth="0.4" />
        <circle cx={C} cy={C} r="30" strokeWidth="0.5" />

        {ticks.map((d) => {
          const [x1, y1] = polar(90, d);
          const [x2, y2] = polar(d % 30 === 0 ? 97 : 94, d);
          return <line key={d} x1={fmt(x1)} y1={fmt(y1)} x2={fmt(x2)} y2={fmt(y2)} strokeWidth={d % 30 === 0 ? 0.9 : 0.4} />;
        })}

        {SIGNS.map((_, i) => {
          const [x1, y1] = polar(64, i * 30);
          const [x2, y2] = polar(90, i * 30);
          return <line key={i} x1={fmt(x1)} y1={fmt(y1)} x2={fmt(x2)} y2={fmt(y2)} strokeWidth="0.5" />;
        })}

        {hexagram.map((points, i) => (
          <polygon key={i} points={points} strokeWidth="0.6" />
        ))}
      </g>

      {SIGNS.map((glyph, i) => {
        const deg = i * 30 + 15;
        const [x, y] = polar(77, deg);
        return (
          <text
            key={i}
            x={fmt(x)}
            y={fmt(y)}
            transform={`rotate(${deg} ${fmt(x)} ${fmt(y)})`}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="13"
            fill="url(#zw-gold)"
            style={{ fontFamily: "'Segoe UI Symbol', 'Noto Sans Symbols', 'DejaVu Sans', sans-serif" }}
          >
            {glyph}
          </text>
        );
      })}

      {/* Sun */}
      <g fill="url(#zw-gold)">
        {Array.from({ length: 16 }, (_, i) => {
          const d = i * 22.5, long = i % 2 === 0;
          const tip = polar(long ? 25 : 21, d);
          const l = polar(13, d - 7), r = polar(13, d + 7);
          return <polygon key={i} points={[l, tip, r].map((p) => p.map(fmt).join(",")).join(" ")} opacity={long ? 1 : 0.7} />;
        })}
      </g>
      <circle cx={C} cy={C} r="12" fill="url(#zw-sun)" />
    </svg>
  );
}
