"use client";

import type { ConsultationRequestOut } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function StatusBadge({ status }: { status: ConsultationRequestOut["status"] }) {
  const { t } = useLanguage();
  const gold = status === "approved" || status === "payment_submitted" || status === "confirmed";
  return (
    <span className={`inline-block border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${
      gold ? "border-gold bg-gold/15 text-gold" : status === "pending" ? "border-cream/40 text-cream/80" : "border-line text-cream/55"}`}>
      {t(`booking.status.${status}`)}
    </span>
  );
}
