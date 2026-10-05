"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useLive } from "@/lib/live";
import { listReviewScreenshots, type ReviewScreenshotOut } from "@/lib/reviews";

const ARROW =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-cream/35 text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-30";

// Screenshots of reviews clients sent on WhatsApp etc. (uploaded in the admin
// panel): a swipeable row with arrows; tapping one opens it full size.
export default function ScreenshotSlider() {
  const { t } = useLanguage();
  const [shots, setShots] = useState<ReviewScreenshotOut[] | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLUListElement>(null);

  const load = useCallback(() => {
    listReviewScreenshots().then(setShots).catch(() => setShots((cur) => cur ?? []));
  }, []);
  useEffect(load, [load]);
  useLive("reviews", load);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null || !shots ? i : (i + 1) % shots.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null || !shots ? i : (i - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shots]);

  if (!shots?.length) return null;
  const scroll = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  const current = open !== null ? shots[open] : null;

  return (
    <section className="mt-20 border-t border-line pt-14" aria-labelledby="client-love">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-cream/65">
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            {t("review.screenshotsKicker")}
          </p>
          <h2 id="client-love" className="mt-3 font-display text-[clamp(1.8rem,3vw,2.6rem)] uppercase tracking-[0.04em] text-gold">
            {t("review.screenshotsTitle")}
          </h2>
        </div>
        {shots.length > 1 && (
          <div className="flex gap-3">
            <button type="button" onClick={() => scroll(-1)} className={ARROW} aria-label={t("review.prev")}>←</button>
            <button type="button" onClick={() => scroll(1)} className={ARROW} aria-label={t("review.next")}>→</button>
          </div>
        )}
      </div>

      <ul ref={track} className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {shots.map((s, i) => (
          <li key={s.id} className="w-[min(72vw,260px)] shrink-0 snap-start">
            <button type="button" onClick={() => setOpen(i)} aria-label={`${t("review.openScreenshot")} ${i + 1}`}
              className="block aspect-[9/16] w-full overflow-hidden border border-line bg-ink-soft transition-colors hover:border-gold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.caption || t("review.screenshotAlt")} loading="lazy" className="h-full w-full object-cover object-top" />
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.caption || t("review.screenshotAlt")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={current.caption || t("review.screenshotAlt")}
            className="max-h-[90vh] max-w-[min(92vw,520px)] border border-line object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" onClick={() => setOpen(null)} aria-label={t("nav.close")}
            className={`${ARROW} absolute right-4 top-4 bg-ink`}>✕</button>
          {shots.length > 1 && (
            <>
              <button type="button" aria-label={t("review.prev")} className={`${ARROW} absolute left-4 top-1/2 -translate-y-1/2 bg-ink`}
                onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + shots.length) % shots.length); }}>←</button>
              <button type="button" aria-label={t("review.next")} className={`${ARROW} absolute right-4 top-1/2 -translate-y-1/2 bg-ink`}
                onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % shots.length); }}>→</button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
