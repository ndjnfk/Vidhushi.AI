"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { OrderStatus } from "@/lib/shop";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const tone =
    status === "delivered" ? "border-gold bg-gold text-ink"
    : status === "cancelled" ? "border-line text-cream/55"
    : "border-gold bg-gold/15 text-gold";
  return (
    <span className={`inline-block border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${tone}`}>
      {t(`order.status.${status}`)}
    </span>
  );
}
