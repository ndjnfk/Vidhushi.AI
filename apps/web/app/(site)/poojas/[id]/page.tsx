"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentButton from "@/components/PaymentButton";
import { bookPooja, getPooja, type PoojaBookingOut, type PoojaServiceOut } from "@/lib/poojas";
import { isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PoojaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [service, setService] = useState<PoojaServiceOut | null>(null);
  const [devoteeName, setDevoteeName] = useState("");
  const [gotra, setGotra] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [booking, setBooking] = useState<PoojaBookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    getPooja(params.id).then(setService).catch((e) => setError(e.message));
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
      const b = await bookPooja({
        pooja_service_id: params.id,
        devotee_name: devoteeName,
        gotra: gotra || undefined,
        scheduled_date: scheduledDate,
      });
      setBooking(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  if (!service) return <p>{error ?? t("common.loading")}</p>;

  if (confirmed) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-2">{t("poojas.confirmedTitle")}</h1>
        <p className="text-gray-600">
          {service.name} for {devoteeName} on {scheduledDate}. We&apos;ll be in touch with the details.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <p className="text-gray-600">{service.description}</p>
        <p className="mt-2 font-bold text-orange-600">₹{service.price.toFixed(0)}</p>
      </div>

      {!booking ? (
        <form onSubmit={handleBook} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("poojas.devoteeName")}</span>
            <input className="border rounded px-3 py-2" value={devoteeName} onChange={(e) => setDevoteeName(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("poojas.gotraOptional")}</span>
            <input className="border rounded px-3 py-2" value={gotra} onChange={(e) => setGotra(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">{t("poojas.preferredDate")}</span>
            <input type="date" className="border rounded px-3 py-2" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
            {busy ? t("poojas.booking") : t("poojas.bookAndPay")}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      ) : booking.order ? (
        <PaymentButton
          order={booking.order}
          onSuccess={() => setConfirmed(true)}
          onError={(msg) => setError(msg)}
        />
      ) : null}
    </div>
  );
}
