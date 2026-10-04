"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import BookConsultationButton from "@/components/booking/BookConsultation";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { formatInrUsd } from "@/lib/offerings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";

const PAGE_BTN = "flex h-11 min-w-11 items-center justify-center border px-3 font-display text-lg transition-colors disabled:pointer-events-none disabled:opacity-30";

// Price card ("Candle Spell Services"): a name/price list the admin edits on
// the Home page editor. Hidden when empty.
// - Home page (`limit`): the first services, "See more" (-> /pricing) and a booking button.
// - Pricing page (`pageSize`): every service, a page at a time.
export default function RateList({ limit, pageSize }: { limit?: number; pageSize?: number }) {
  const { t } = useLanguage();
  const home = useHomeContent();
  const [page, setPage] = useState(0);
  const top = useRef<HTMLUListElement>(null);
  const all = home?.rates ?? [];
  if (all.length === 0) return null;

  const pages = pageSize ? Math.ceil(all.length / pageSize) : 1;
  const current = Math.min(page, pages - 1); // the admin may have shortened the list
  const start = pageSize ? current * pageSize : 0;
  const rates = all.slice(start, limit ?? (pageSize ? start + pageSize : all.length));
  const go = (p: number) => {
    setPage(p);
    top.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="rates" className="relative scroll-mt-28 overflow-hidden border-t border-line px-6 py-24 md:px-16">
      <Starfield seed={83} />
      <div className="relative mx-auto max-w-3xl border border-line bg-ink/85 px-6 py-14 backdrop-blur-sm sm:px-12 md:px-16">
        <div className="flex items-center justify-center gap-4 text-gold" aria-hidden="true">
          <Sparkle className="h-2.5 w-2.5 opacity-70" />
          <Sparkle className="h-4 w-4" />
          <Sparkle className="h-2.5 w-2.5 opacity-70" />
        </div>
        <h2 className="mt-6 text-center font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.1] tracking-[0.02em] text-cream">
          {home?.rates_title || t("home.ratesTitle")}
        </h2>
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 text-cream/80" aria-hidden="true">
          <span className="h-px flex-1 bg-cream/40" />
          <Sparkle className="h-4 w-4" />
          <span className="h-px flex-1 bg-cream/40" />
        </div>
        {home?.rates_subtitle && <p className="mt-6 text-center leading-relaxed text-cream/75">{home.rates_subtitle}</p>}

        <ul ref={top} className="mt-10 flex scroll-mt-32 flex-col gap-4">
          {rates.map((r, i) => (
            <li key={`${r.name}-${start + i}`}>
              <BookConsultationButton preset={{ kind: "tarot", session: `rate-${start + i}` }}
                className="group flex w-full items-baseline gap-3 text-left font-display text-[clamp(1.15rem,2.2vw,1.45rem)] text-cream">
                <Sparkle className="h-2.5 w-2.5 shrink-0 self-center text-gold transition-transform duration-500 group-hover:rotate-90" />
                <span className="leading-snug transition-colors group-hover:text-gold">{r.name}</span>
                <span className="min-w-6 flex-1 translate-y-[-0.25em] border-b border-dotted border-cream/25" aria-hidden="true" />
                <span className="shrink-0 whitespace-nowrap tabular-nums text-gold">
                  {r.price === null ? t("tarot.priceOnRequest") : `${formatInrUsd(r.price, r.price_usd)}/-`}
                </span>
              </BookConsultationButton>
            </li>
          ))}
        </ul>

        {pages > 1 && (
          <nav aria-label={t("pricing.pages")} className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label={t("pricing.prev")}
              className={`${PAGE_BTN} border-line text-cream/80 hover:border-gold hover:text-gold`}>←</button>
            {Array.from({ length: pages }, (_, p) => (
              <button key={p} type="button" onClick={() => go(p)} aria-current={p === current ? "page" : undefined}
                className={`${PAGE_BTN} ${p === current ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/80 hover:border-gold hover:text-gold"}`}>
                {p + 1}
              </button>
            ))}
            <button type="button" onClick={() => go(current + 1)} disabled={current === pages - 1} aria-label={t("pricing.next")}
              className={`${PAGE_BTN} border-line text-cream/80 hover:border-gold hover:text-gold`}>→</button>
          </nav>
        )}

        {limit && (
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link href="/pricing"
              className="inline-flex items-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold">
              {t("home.ratesSeeMore")}
              <span aria-hidden="true">→</span>
            </Link>
            <BookConsultationButton preset={{ kind: "tarot", session: "rate-0" }}
              className="inline-flex items-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold">
              <Sparkle className="h-3.5 w-3.5 text-gold" />
              {t("home.ratesCta")}
            </BookConsultationButton>
          </div>
        )}
      </div>
    </section>
  );
}
