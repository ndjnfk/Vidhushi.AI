"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentButton from "@/components/PaymentButton";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { bookRitual, getRitual, type RitualBookingOut, type RitualServiceOut } from "@/lib/rituals";
import { isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RitualDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [service, setService] = useState<RitualServiceOut | null>(null);
  const [intention, setIntention] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [booking, setBooking] = useState<RitualBookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRitual(params.id).then((s) => {
      setService(s);
      setPrice(s.price_min);
    }).catch((e) => setError(e.message));
  }, [params.id]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn()) {
      router.push("/account/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const b = await bookRitual({ ritual_service_id: params.id, intention_text: intention, agreed_price: price });
      setBooking(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  const INPUT =
    "w-full border border-line bg-transparent px-4 py-3.5 text-cream outline-none transition-colors placeholder:text-cream/45 focus:border-gold";
  const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75";

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={31} />
      <div className="relative mx-auto max-w-[720px] px-6 pb-24 pt-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <Link href="/rituals" className="hover:text-gold">{t("nav.rituals")}</Link>
        </p>

        {!service ? (
          <p className="mt-16 text-cream/70">{error ?? t("common.loading")}</p>
        ) : (
          <>
            <h1 className="mt-6 font-display text-[clamp(2.2rem,4.5vw,3.8rem)] uppercase leading-[1.08] tracking-[0.04em] text-gold">{service.name}</h1>
            <p className="mt-5 text-[1.1rem] leading-relaxed text-cream/85">{service.description}</p>

            <div className="mt-10 border border-line bg-ink/85 p-8 backdrop-blur-sm md:p-10">
              {!booking ? (
                <form onSubmit={handleBook} className="flex flex-col gap-6">
                  <label className="flex flex-col gap-2">
                    <span className={LABEL}>{t("rituals.intentionLabel")}</span>
                    <textarea
                      className={`${INPUT} min-h-28 resize-none`}
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      placeholder={t("rituals.intentionPlaceholder")}
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={LABEL}>
                      {t("rituals.weeklyPriceLabel")} (₹{service.price_min.toFixed(0)} – ₹{service.price_max.toFixed(0)})
                    </span>
                    <input
                      type="number"
                      min={service.price_min}
                      max={service.price_max}
                      className={INPUT}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-60"
                  >
                    <Sparkle className={`h-3.5 w-3.5 text-gold-deep ${busy ? "animate-spin" : ""}`} />
                    {busy ? t("rituals.starting") : t("rituals.startButton")}
                  </button>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                </form>
              ) : booking.order ? (
                <PaymentButton order={booking.order} onSuccess={() => router.push(`/rituals/booking/${booking.id}`)} onError={setError} />
              ) : null}
            </div>
            <p className="mt-6 text-sm italic leading-relaxed text-cream/65">{t("rituals.chargesNote")}</p>
          </>
        )}
      </div>
    </div>
  );
}
