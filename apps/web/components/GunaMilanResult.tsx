"use client";

import type { GunaMilanOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Conventional Ashtakoot bands (out of 36).
function verdictKey(points: number) {
  if (points >= 33) return "matching.verdictExcellent";
  if (points >= 25) return "matching.verdictVeryGood";
  if (points >= 18) return "matching.verdictAverage";
  return "matching.verdictLow";
}

const R = 70;
const CIRCUMFERENCE = 2 * Math.PI * R;

export default function GunaMilanResult({ result }: { result: GunaMilanOut }) {
  const { t } = useLanguage();
  const ratio = result.max_points ? result.total_points / result.max_points : 0;

  return (
    <section className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-10">
      <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-14">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="80" cy="80" r={R} fill="none" stroke="var(--color-line)" strokeWidth="6" />
            <circle
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke="var(--color-gold)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
              className="transition-[stroke-dashoffset] duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-5xl leading-none text-gold">{result.total_points}</span>
            <span className="mt-1 text-sm text-cream/65">/ {result.max_points}</span>
          </div>
        </div>

        <div className="text-center md:text-left">
          <h2 className="font-display text-3xl uppercase tracking-[0.05em] text-gold">{t("matching.resultTitle")}</h2>
          <p className="mt-4 max-w-xl text-[1.1rem] leading-relaxed text-cream/90">{t(verdictKey(result.total_points))}</p>
        </div>
      </div>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {result.kootas.map((k) => (
          <li key={k.name} className="grid gap-x-8 gap-y-2 py-4 sm:grid-cols-[180px_1fr_auto] sm:items-center">
            <span className="font-display text-lg uppercase tracking-[0.04em] text-cream">{k.name}</span>
            <div className="flex flex-col gap-2">
              <div className="h-1 overflow-hidden bg-line">
                <div className="h-full bg-gold" style={{ width: `${k.max_points ? (k.points / k.max_points) * 100 : 0}%` }} />
              </div>
              {k.note && <span className="text-sm text-cream/60">{k.note}</span>}
            </div>
            <span className="text-right text-cream sm:w-16">
              {k.points} / {k.max_points}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
