"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentButton from "@/components/PaymentButton";
import { getStorefrontBySlug, type StorefrontOut } from "@/lib/storefront";
import { requestConsultation, type ConsultationBookingOut } from "@/lib/astrologers";
import { isLoggedIn } from "@/lib/auth";

export default function VendorStorefrontPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [storefront, setStorefront] = useState<StorefrontOut | null>(null);
  const [consultation, setConsultation] = useState<ConsultationBookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStorefrontBySlug(params.slug).then(setStorefront).catch((e) => setError(e.message));
  }, [params.slug]);

  async function handleRequest() {
    if (!storefront) return;
    if (!isLoggedIn()) {
      router.push(`/account/login?next=/vendor/${params.slug}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setConsultation(await requestConsultation(storefront.vendor_id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start consultation");
    } finally {
      setBusy(false);
    }
  }

  if (!storefront) return <p>{error ?? "Loading..."}</p>;

  const accent = storefront.branding.primary_color || "#ea580c";

  return (
    <div className="-mx-6 -mt-8">
      <header className="px-6 py-12 text-white flex flex-col items-center text-center gap-3" style={{ backgroundColor: accent }}>
        {storefront.branding.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storefront.branding.logo_url} alt={storefront.name} className="w-20 h-20 rounded-full object-cover" />
        )}
        <h1 className="text-3xl font-bold">{storefront.branding.display_name || storefront.name}</h1>
        {storefront.branding.tagline && <p className="text-white/90">{storefront.branding.tagline}</p>}
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        {storefront.branding.about_text && <p className="text-gray-700">{storefront.branding.about_text}</p>}
        <p className="text-gray-600">{storefront.bio}</p>
        <p className="text-sm text-gray-500">
          {storefront.languages.join(", ")} &middot; {storefront.experience_years} yrs &middot; {storefront.specialties.join(", ")}
        </p>

        {storefront.rate_per_session != null && (
          <p className="font-bold text-lg" style={{ color: accent }}>
            ₹{storefront.rate_per_session.toFixed(0)} / session
          </p>
        )}

        {!consultation ? (
          <button
            onClick={handleRequest}
            disabled={busy}
            style={{ backgroundColor: accent }}
            className="text-white rounded px-5 py-2.5 w-fit disabled:opacity-50"
          >
            {busy ? "Starting..." : "Start Chat Consultation"}
          </button>
        ) : consultation.order ? (
          <PaymentButton
            order={consultation.order}
            onSuccess={() => router.push(`/consultations/${consultation.id}`)}
            onError={setError}
          />
        ) : null}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <p className="text-xs text-gray-400 mt-8">Powered by Vidushiji.ai</p>
      </div>
    </div>
  );
}
