"use client";

import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DrawnCardOut } from "@/lib/tarot";

const CARD = "relative aspect-[2/3.2] w-full overflow-hidden rounded-[14px] border border-gold/60 bg-ink";

// Gold line-art emblem per suit; Major Arcana get a sun-and-moon.
function Emblem({ name }: { name: string }) {
  const g = { fill: "none", stroke: "var(--color-gold)", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name.endsWith("Wands"))
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <path {...g} d="M20 54L44 10M26 54L50 10" />
        <path {...g} d="M44 10c-2 5 2 6 0 10M50 10c2 4-2 6 0 9" />
        <path {...g} d="M18 34c6-2 10 2 16 0" />
      </svg>
    );
  if (name.endsWith("Cups"))
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <path {...g} d="M16 14h32c0 14-7 22-16 22S16 28 16 14Z" />
        <path {...g} d="M32 36v12M22 52h20M16 14c2-2 30-2 32 0" />
      </svg>
    );
  if (name.endsWith("Swords"))
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <path {...g} d="M32 6v40M26 46h12M32 46v10M29 56h6M32 6l-3 6h6Z" />
        <path {...g} d="M18 22c8 4 20 4 28 0" />
      </svg>
    );
  if (name.endsWith("Pentacles"))
    return (
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        <circle {...g} cx="32" cy="32" r="22" />
        <path {...g} d="M32 12l6 19h-19l15-11-6 19 17-12H24l14 12-6-19" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <circle {...g} cx="32" cy="32" r="11" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <path key={i} {...g} d={`M${32 + Math.cos(a) * 15} ${32 + Math.sin(a) * 15}L${32 + Math.cos(a) * 22} ${32 + Math.sin(a) * 22}`} />;
      })}
      <path {...g} d="M36 25a8 8 0 1 0 0 14a10 10 0 0 1 0-14Z" fill="var(--color-gold)" fillOpacity={0.25} />
    </svg>
  );
}

// The shared back design (also used decoratively on the setup page).
export function TarotCardBack({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} ${className}`}>
      <div className="absolute inset-2 rounded-[10px] border border-gold/35" />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 100 160" className="h-[78%] w-[78%]" aria-hidden="true">
          <g fill="none" stroke="var(--color-gold)" strokeOpacity={0.7} strokeWidth={0.8}>
            <circle cx="50" cy="80" r="26" />
            <circle cx="50" cy="80" r="18" />
            <path d="M50 30v100M16 80h68M50 54l26 26-26 26-26-26Z" />
            <path d="M40 72a12 12 0 1 0 0 16a14 14 0 0 1 0-16Z" fill="var(--color-gold)" fillOpacity={0.3} />
          </g>
        </svg>
      </div>
      <Sparkle className="absolute left-3 top-3 h-3 w-3 text-gold" />
      <Sparkle className="absolute bottom-3 right-3 h-3 w-3 text-gold" />
    </div>
  );
}

// Flips from its back to its face shortly after mounting (staggered by `delay`).
export default function TarotCardFace({ card, delay = 0 }: { card: DrawnCardOut; delay?: number }) {
  const { t } = useLanguage();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setFlipped(true), 350 + delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div className="flex w-[200px] flex-col items-center gap-4 sm:w-[220px]">
      <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{card.position}</span>
      <div className="w-full [perspective:1200px]">
        <div
          className={`relative w-full transition-transform duration-[900ms] [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          <div className="[backface-visibility:hidden]">
            <TarotCardBack />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className={`${CARD} shadow-[0_0_40px_-8px_rgba(199,161,122,0.45)]`}>
              <div className="absolute inset-2 rounded-[10px] border border-gold/35" />
              {/* A reversed card turns only its emblem; the name stays readable. */}
              <div className="flex h-full flex-col items-center justify-between px-5 py-8">
                <Sparkle className="h-3 w-3 text-gold" />
                <div className={`h-24 w-24 ${card.is_reversed ? "rotate-180" : ""}`}>
                  <Emblem name={card.name} />
                </div>
                <span className="text-center font-display text-lg uppercase leading-tight tracking-[0.06em] text-gold">{card.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {card.is_reversed && (
        <span className="border border-gold/50 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold">
          {t("tarot.reversed")}
        </span>
      )}
    </div>
  );
}
