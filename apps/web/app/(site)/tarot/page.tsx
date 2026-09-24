"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { TarotCardBack } from "@/components/tarot/TarotCardFace";
import { drawReading } from "@/lib/tarot";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const SPREADS = [
  { value: "single", labelKey: "tarot.singleCard", hintKey: "tarot.singleHint", cards: 1 },
  { value: "three_card", labelKey: "tarot.threeCardSpread", hintKey: "tarot.threeHint", cards: 3 },
] as const;

export default function TarotPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [spread, setSpread] = useState<"single" | "three_card">("single");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDraw() {
    setBusy(true);
    setError(null);
    try {
      const reading = await drawReading(spread, question || undefined);
      router.push(`/tarot/${reading.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draw a reading");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative -mx-6 -my-8 overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={53} />
      <Planet className="pointer-events-none absolute -bottom-[20%] -left-[10%] w-[min(36vw,460px)] opacity-75" />

      <div className="relative mx-auto grid min-h-[calc(100vh-97px)] max-w-[1400px] items-center gap-16 px-6 py-20 md:px-16 lg:grid-cols-[1fr_540px] lg:gap-24">
        <div>
          <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{t("nav.tarot")}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.8rem,5.5vw,5rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
            {t("tarot.pageTitle")}
          </h1>
          <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-cream/85">{t("tarot.pageSubtitle")}</p>

          {/* Fanned deck */}
          <div className="relative mt-14 hidden h-[260px] w-[420px] sm:block" aria-hidden="true">
            {[-18, -6, 6, 18].map((deg) => (
              <div
                key={deg}
                className="absolute bottom-0 left-[135px] w-[150px] shadow-2xl"
                style={{ transform: `rotate(${deg}deg)`, transformOrigin: "50% 130%" }}
              >
                <TarotCardBack />
              </div>
            ))}
          </div>
        </div>

        <div className="border border-line bg-ink/85 p-8 backdrop-blur-sm md:p-10">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80">{t("tarot.chooseSpread")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SPREADS.map((s) => {
              const active = spread === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSpread(s.value)}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-4 border p-5 text-left transition-colors ${
                    active ? "border-gold bg-gold/10" : "border-line hover:border-cream/40"
                  }`}
                >
                  <span className="flex gap-1.5" aria-hidden="true">
                    {Array.from({ length: s.cards }, (_, i) => (
                      <span key={i} className={`h-8 w-5 rounded-[3px] border ${active ? "border-gold bg-gold/20" : "border-cream/40"}`} />
                    ))}
                  </span>
                  <span className={`font-display text-lg uppercase tracking-[0.04em] ${active ? "text-gold" : "text-cream"}`}>{t(s.labelKey)}</span>
                  <span className="text-sm text-cream/60">{t(s.hintKey)}</span>
                </button>
              );
            })}
          </div>

          <label className="mt-8 flex flex-col gap-2">
            <span className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80">{t("tarot.questionLabel")}</span>
            <textarea
              className="min-h-28 w-full resize-none border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("tarot.questionPlaceholder")}
            />
          </label>

          <button
            type="button"
            onClick={handleDraw}
            disabled={busy}
            className="mt-8 flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60"
          >
            <Sparkle className={`h-3.5 w-3.5 text-gold-deep ${busy ? "animate-spin" : ""}`} />
            {busy ? t("tarot.shuffling") : t("tarot.drawButton")}
          </button>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
