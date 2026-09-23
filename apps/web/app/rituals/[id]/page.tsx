"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentButton from "@/components/PaymentButton";
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

  if (!service) return <p>{error ?? t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <p className="text-gray-600">{service.description}</p>
      </div>

      {!booking ? (
        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("rituals.intentionLabel")}</span>
            <textarea
              className="border rounded px-3 py-2 min-h-24"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={t("rituals.intentionPlaceholder")}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {t("rituals.weeklyPriceLabel")} (₹{service.price_min.toFixed(0)} – ₹{service.price_max.toFixed(0)})
            </span>
            <input
              type="number"
              min={service.price_min}
              max={service.price_max}
              className="border rounded px-3 py-2"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit" disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
            {busy ? t("rituals.starting") : t("rituals.startButton")}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      ) : booking.order ? (
        <PaymentButton order={booking.order} onSuccess={() => router.push(`/rituals/booking/${booking.id}`)} onError={setError} />
      ) : null}
    </div>
  );
}
