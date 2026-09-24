"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import TarotCardFace from "@/components/tarot/TarotCardFace";
import { getReading, type TarotReadingOut } from "@/lib/tarot";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TarotReadingPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [reading, setReading] = useState<TarotReadingOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReading(params.id).then(setReading).catch((e) => setError(e.message));
  }, [params.id]);

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={59} />

      <div className="relative mx-auto max-w-[1200px] px-6 pb-24 pt-20 md:px-16">
        <p className="flex items-center justify-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <Link href="/tarot" className="hover:text-gold">{t("nav.tarot")}</Link>
        </p>
        <h1 className="mt-6 text-center font-display text-[clamp(2.4rem,5vw,4.4rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t("tarot.readingTitle")}
        </h1>

        {!reading ? (
          <p className="mt-16 text-center text-cream/70">{error ?? t("common.loading")}</p>
        ) : (
          <>
            {reading.question && (
              <p className="mx-auto mt-6 max-w-2xl text-center font-display text-xl italic text-cream/85">&ldquo;{reading.question}&rdquo;</p>
            )}

            <div className="mt-14 flex flex-wrap justify-center gap-10">
              {reading.cards.map((card, i) => (
                <TarotCardFace key={card.position} card={card} delay={i * 450} />
              ))}
            </div>

            <div className="mx-auto mt-16 flex max-w-3xl flex-col gap-6">
              {reading.cards.map((card) => (
                <section key={card.position} className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-cream/65">{card.position}</p>
                  <h2 className="mt-2 flex flex-wrap items-center gap-3 font-display text-2xl uppercase tracking-[0.05em] text-gold">
                    {card.name}
                    {card.is_reversed && (
                      <span className="border border-gold/50 px-2 py-0.5 font-body text-[11px] font-extrabold tracking-[0.12em]">
                        {t("tarot.reversed")}
                      </span>
                    )}
                  </h2>
                  <p className="mt-4 text-[1.1rem] leading-relaxed text-cream/90">{card.meaning}</p>
                  <p className="mt-5 flex flex-wrap gap-2">
                    {card.keywords.map((k) => (
                      <span key={k} className="border border-line px-3 py-1 text-[12px] uppercase tracking-[0.1em] text-cream/70">
                        {k}
                      </span>
                    ))}
                  </p>
                </section>
              ))}
            </div>

            <div className="mt-14 flex justify-center">
              <Link
                href="/tarot"
                className="inline-flex items-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:border-gold hover:text-gold"
              >
                <Sparkle className="h-3.5 w-3.5 text-gold" />
                {t("tarot.drawAnother")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
