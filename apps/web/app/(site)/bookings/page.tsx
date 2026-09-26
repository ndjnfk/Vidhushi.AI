"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLive } from "@/lib/live";
import BookConsultationButton from "@/components/booking/BookConsultation";
import Sparkle from "@/components/Sparkle";
import StatusBadge from "@/components/booking/StatusBadge";
import Starfield from "@/components/Starfield";
import { isLoggedIn } from "@/lib/auth";
import { formatSlot, myBookings, type ConsultationRequestOut } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MyBookingsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ConsultationRequestOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent("/bookings")}`;
      return;
    }
    myBookings().then(setRows).catch((e) => setError(e.message));
  }, []);
  useLive("me", () => {
    myBookings().then(setRows).catch(() => {});
  });

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={79} />
      <div className="relative mx-auto max-w-4xl px-6 py-20">
        <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.8rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t("nav.myBookings")}
        </h1>

        {!rows ? (
          <p className="mt-12 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="mt-12 flex flex-col items-start gap-6 border border-line bg-ink/85 p-8">
            <p className="text-cream/80">{t("booking.none")}</p>
            <BookConsultationButton className="inline-flex items-center gap-3 bg-white px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink hover:bg-gold">
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("home.ctaBook")}
            </BookConsultationButton>
          </div>
        ) : (
          <ul className="mt-12 flex flex-col gap-4">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/bookings/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 border border-line bg-ink/85 px-6 py-5 transition-colors hover:border-gold/60">
                  <div>
                    <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">
                      {r.kind === "ritual" ? t("booking.kindRitual") : r.session_name || t(`booking.topic.${r.topic}`)}
                    </p>
                    <p className="mt-1 text-sm text-cream/65">
                      {r.scheduled_at ? formatSlot(r.scheduled_at) : `${t("booking.requestedOn")} ${formatSlot(r.created_at)}`}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
