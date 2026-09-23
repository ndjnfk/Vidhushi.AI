import type { DrawnCardOut } from "@/lib/tarot";

const SUIT_STYLE: Record<string, { gradient: string; glyph: string }> = {
  Wands: { gradient: "from-orange-500 to-red-600", glyph: "🔥" },
  Cups: { gradient: "from-blue-500 to-cyan-600", glyph: "💧" },
  Swords: { gradient: "from-slate-500 to-slate-700", glyph: "⚔️" },
  Pentacles: { gradient: "from-emerald-500 to-green-700", glyph: "⭐" },
};

const MAJOR_STYLE = { gradient: "from-purple-600 to-indigo-800", glyph: "✨" };

function styleFor(card: { name: string }) {
  const suitMatch = Object.keys(SUIT_STYLE).find((s) => card.name.endsWith(s));
  return suitMatch ? SUIT_STYLE[suitMatch] : MAJOR_STYLE;
}

export default function TarotCardFace({ card }: { card: DrawnCardOut }) {
  const style = styleFor(card);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-gray-500">{card.position}</span>
      <div
        className={`w-40 h-64 rounded-xl bg-gradient-to-br ${style.gradient} text-white shadow-lg flex flex-col items-center justify-center gap-3 p-4 transition-transform duration-500`}
        style={{ transform: card.is_reversed ? "rotate(180deg)" : "none" }}
      >
        <span className="text-5xl">{style.glyph}</span>
        <span className="text-sm font-semibold text-center leading-tight">{card.name}</span>
      </div>
      {card.is_reversed && <span className="text-xs text-red-600 font-medium">Reversed</span>}
    </div>
  );
}
