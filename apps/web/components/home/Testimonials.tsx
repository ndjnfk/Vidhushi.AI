"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";

const AUTOPLAY_MS = 7000;

// Scattered ✕ / ✳ marks behind the quote, as [left%, top%, kind].
const MARKS: [number, number, "x" | "star"][] = [
  [34, 4, "x"], [64, 5, "star"], [46, 24, "x"], [93, 24, "x"], [30, 38, "star"],
  [12, 63, "star"], [14, 72, "star"], [5, 96, "x"], [84, 84, "star"], [85, 86, "x"],
  [47, 96, "x"], [51, 95, "star"], [69, 94, "x"],
];

function Mark({ kind }: { kind: "x" | "star" }) {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {kind === "x" ? <path d="M2 2l8 8M10 2l-8 8" /> : <path d="M6 0v12M0 6h12M1.8 1.8l8.4 8.4M10.2 1.8l-8.4 8.4" />}
    </svg>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-8 w-16 md:h-10 md:w-20" aria-hidden="true">
      {dir === "left" ? <path d="M79 20H2M20 2Q14 14 2 20Q14 26 20 38" /> : <path d="M1 20h77M60 2q6 12 18 18q-12 6-18 18" />}
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-1.5 text-gold" aria-label={`${rating} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`h-4 w-4 ${i < rating ? "" : "opacity-25"}`} fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.4 5.8 21.1l1.6-7L2 9.3l7.1-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// Home-page testimonial carousel: one centred quote at a time, cross-fading.
// Autoplays unless the visitor hovers, focuses it or prefers reduced motion.
export default function Testimonials() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reviews = useHomeContent()?.testimonials ?? [];
  const count = reviews.length;

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("home.reviewsTitle")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="relative overflow-hidden border-t border-line bg-ink px-6 py-28 font-body text-cream md:py-36"
    >
      {MARKS.map(([left, top, kind], i) => (
        <span
          key={i}
          className={`absolute text-cream/40 ${i % 3 === 0 ? "animate-twinkle" : ""}`}
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(i % 5) * 0.6}s` }}
        >
          <Mark kind={kind} />
        </span>
      ))}

      <div className="relative mx-auto flex max-w-[1760px] items-center gap-6 md:px-4 lg:px-12">
        {count > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t("shop.prev")}
            className="hidden shrink-0 text-cream transition-colors hover:text-gold md:block"
          >
            <Arrow dir="left" />
          </button>
        )}

        {/* All slides share one grid cell so the height fits the longest quote. */}
        <div className="grid flex-1">
          {reviews.map((r, i) => {
            const active = i === index;
            return (
              <figure
                key={i}
                aria-hidden={!active}
                className={`flex flex-col items-center text-center transition-opacity duration-700 [grid-area:1/1] ${
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <div className="rounded-full border border-dashed border-cream/40 p-1.5">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gold/40 to-ink-soft md:h-[104px] md:w-[104px]">
                    {r.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo_url} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-3xl uppercase text-cream">
                        {r.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                    )}
                  </div>
                </div>
                <blockquote className="mt-14 max-w-4xl font-display text-[clamp(1.6rem,3.2vw,3rem)] leading-[1.35] text-gold">
                  &ldquo;{r.quote}&rdquo;
                </blockquote>
                <div className="mt-10">
                  <Stars rating={r.rating} />
                </div>
                <figcaption className="mt-4 text-lg text-cream/90">
                  {r.name}{r.detail && `, ${r.detail}`}
                </figcaption>
              </figure>
            );
          })}
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t("shop.next")}
            className="hidden shrink-0 text-cream transition-colors hover:text-gold md:block"
          >
            <Arrow dir="right" />
          </button>
        )}
      </div>

      {/* Mobile: arrows under the quote */}
      {count > 1 && (
        <div className="relative mt-12 flex justify-center gap-12 md:hidden">
          <button type="button" onClick={() => go(-1)} aria-label={t("shop.prev")} className="text-cream hover:text-gold">
            <Arrow dir="left" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label={t("shop.next")} className="text-cream hover:text-gold">
            <Arrow dir="right" />
          </button>
        </div>
      )}
    </section>
  );
}
