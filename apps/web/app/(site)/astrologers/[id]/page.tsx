"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PaymentButton from "@/components/PaymentButton";
import { getAstrologer, requestConsultation, type AstrologerOut, type ConsultationBookingOut } from "@/lib/astrologers";
import { isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AstrologerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [astrologer, setAstrologer] = useState<AstrologerOut | null>(null);
  const [consultation, setConsultation] = useState<ConsultationBookingOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAstrologer(params.id).then(setAstrologer).catch((e) => setError(e.message));
  }, [params.id]);

  async function handleRequest() {
    if (!isLoggedIn()) {
      router.push("/account/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setConsultation(await requestConsultation(params.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start consultation");
    } finally {
      setBusy(false);
    }
  }

  if (!astrologer) return <p>{error ?? t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">{astrologer.name}</h1>
        <p className="text-gray-600">{astrologer.bio}</p>
        <p className="text-sm text-gray-500 mt-1">
          {astrologer.languages.join(", ")} &middot; {astrologer.experience_years} yrs &middot; {astrologer.specialties.join(", ")}
        </p>
        {astrologer.rate_per_session != null && (
          <p className="mt-2 font-bold text-orange-600">₹{astrologer.rate_per_session.toFixed(0)} / session</p>
        )}
      </div>

      {!consultation ? (
        <button onClick={handleRequest} disabled={busy} className="bg-orange-600 text-white rounded px-5 py-2.5 w-fit disabled:opacity-50">
          {busy ? t("astrologers.starting") : t("astrologers.startChatButton")}
        </button>
      ) : consultation.order ? (
        <PaymentButton
          order={consultation.order}
          onSuccess={() => router.push(`/consultations/${consultation.id}`)}
          onError={setError}
        />
      ) : null}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
