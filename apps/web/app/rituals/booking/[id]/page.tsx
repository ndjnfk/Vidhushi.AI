"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  confirmSubscription,
  enableAutoRenew,
  getRitualBooking,
  renewRitualBooking,
  type RitualBookingOut,
} from "@/lib/rituals";
import { verifyPayment } from "@/lib/payments";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RitualBookingPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [booking, setBooking] = useState<RitualBookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setBooking(await getRitualBooking(params.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load booking");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleRenew() {
    setBusy(true);
    setError(null);
    try {
      const updated = await renewRitualBooking(params.id);
      if (updated.order) {
        // Mock gateway completes instantly; real gateways would route through PaymentButton.
        await verifyPayment(updated.order.order_id, {});
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Renew failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEnableAutoRenew() {
    setBusy(true);
    setError(null);
    try {
      await enableAutoRenew(params.id);
      await confirmSubscription(params.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable auto-renew");
    } finally {
      setBusy(false);
    }
  }

  if (!booking) return <p>{error ?? t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-4 max-w-md">
      <h1 className="text-2xl font-bold">{t("rituals.manageTitle")}</h1>
      <div className="border rounded p-4 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">{t("rituals.statusLabel")}</span>
          <span className="font-medium capitalize">{booking.status}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{t("rituals.nextCandleDate")}</span>
          <span className="font-medium">{booking.next_candle_date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{t("rituals.billingLabel")}</span>
          <span className="font-medium">
            {booking.billing_mode === "auto" ? t("rituals.billingAuto") : t("rituals.billingManual")}
          </span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {booking.billing_mode === "manual" ? (
        <div className="flex flex-col gap-2">
          <button onClick={handleRenew} disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
            {busy ? t("rituals.renewing") : t("rituals.renewNow")}
          </button>
          <button onClick={handleEnableAutoRenew} disabled={busy} className="border rounded px-4 py-2 disabled:opacity-50">
            {busy ? t("rituals.enabling") : t("rituals.enableAutoRenew")}
          </button>
          <p className="text-xs text-gray-500">{t("rituals.autoRenewNote")}</p>
        </div>
      ) : (
        <p className="text-sm text-green-600">{t("rituals.billingAuto")} ✓</p>
      )}
    </div>
  );
}
