"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Stars from "@/components/reviews/Stars";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { listReviews, REVIEWS_PAGE, type ReviewOut } from "@/lib/reviews";

// Reviews from customers who finished a consultation, ritual or shop order:
// newest first, 10 at a time with "Show more".
export default function ReviewsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ReviewOut[] | null>(null);
  const [total, setTotal] = useState(0);
  const [average, setAverage] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReviews(0)
      .then((p) => {
        setItems(p.items);
        setTotal(p.total);
        setAverage(p.average);
      })
      .catch((e) => setError(e.message));
  }, []);

  async function more() {
    if (!items) return;
    setBusy(true);
    try {
      const p = await listReviews(items.length, REVIEWS_PAGE);
      // Skip any already shown (new reviews may have shifted the pages).
      setItems((cur) => [...(cur ?? []), ...p.items.filter((r) => !(cur ?? []).some((c) => c.id === r.id))]);
      setTotal(p.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={113} />
      <div className="relative mx-auto max-w-5xl px-6 py-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <span className="text-gold">{t("nav.reviews")}</span>
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.4rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t("review.pageTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-[1.1rem] leading-relaxed text-cream/80">{t("review.pageSubtitle")}</p>

        {average !== null && total > 0 && (
          <div className="mt-8 inline-flex items-center gap-4 border border-gold/50 bg-gold/10 px-6 py-4">
            <span className="font-display text-4xl text-gold">{average.toFixed(1)}</span>
            <span>
              <Stars value={Math.round(average)} size="h-5 w-5" />
              <span className="mt-1 block text-sm text-cream/70">{t("review.basedOn").replace("{n}", String(total))}</span>
            </span>
          </div>
        )}

        {!items ? (
          <p className="mt-12 text-cream/70">{error ?? t("common.loading")}</p>
        ) : items.length === 0 ? (
          <p className="mt-12 text-cream/70">{t("review.none")}</p>
        ) : (
          <>
            <ul className="mt-12 grid gap-5 md:grid-cols-2">
              {items.map((r) => (
                <li key={r.id} className="flex flex-col border border-line bg-ink/85 p-6 backdrop-blur-sm">
                  <Stars value={r.rating} />
                  <p className="mt-4 flex-1 leading-relaxed text-cream/90">&ldquo;{r.text}&rdquo;</p>
                  <p className="mt-5 border-t border-line pt-4 text-sm">
                    <span className="font-bold text-cream">{r.name}</span>
                    <span className="text-cream/55"> · {r.label} · {parseUtc(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </p>
                </li>
              ))}
            </ul>
            {items.length < total && (
              <div className="mt-10 flex justify-center">
                <button type="button" onClick={more} disabled={busy}
                  className="inline-flex items-center gap-3 border border-cream/40 px-9 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold disabled:opacity-60">
                  <Sparkle className="h-3.5 w-3.5 text-gold" />
                  {busy ? t("common.loading") : t("review.showMore")}
                </button>
              </div>
            )}
            {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
