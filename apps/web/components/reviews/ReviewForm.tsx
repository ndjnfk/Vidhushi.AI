"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import Stars from "@/components/reviews/Stars";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createReview, myReviews, type ReviewOut } from "@/lib/reviews";

// Rating + review for a finished booking (completed) or shop order (delivered).
// Shows the customer's review instead once they've written it.
export default function ReviewForm({ target, id }: { target: "booking" | "order"; id: string }) {
  const { t } = useLanguage();
  const [mine, setMine] = useState<ReviewOut | null | undefined>(undefined); // undefined = loading
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    myReviews().then((rows) => setMine(rows.find((r) => r.target_id === id) ?? null)).catch(() => setMine(null));
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError(t("review.pickStars"));
    setBusy(true);
    setError(null);
    try {
      setMine(await createReview({ target, target_id: id, rating, text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (mine === undefined) return null;

  return (
    <section className="mt-8 border border-gold/40 bg-gold/5 p-6">
      {mine ? (
        <>
          <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold">{t("review.thanks")}</p>
          <div className="mt-3"><Stars value={mine.rating} /></div>
          <p className="mt-2 leading-relaxed text-cream/85">&ldquo;{mine.text}&rdquo;</p>
          <Link href="/reviews" className="mt-4 inline-block text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold hover:underline">
            {t("review.seeAll")}
          </Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{t(target === "order" ? "review.titleOrder" : "review.title")}</p>
          <p className="mt-1 text-sm text-cream/65">{t("review.subtitle")}</p>
          <div className="mt-4"><Stars value={rating} onPick={setRating} size="h-8 w-8" label={t("review.rating")} /></div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} required minLength={3} maxLength={1000}
            placeholder={t("review.placeholder")}
            className="mt-4 min-h-24 w-full resize-none border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/45 focus:border-gold" />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={busy}
            className="mt-4 inline-flex items-center gap-3 bg-white px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60">
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {t("review.submit")}
          </button>
        </form>
      )}
    </section>
  );
}
