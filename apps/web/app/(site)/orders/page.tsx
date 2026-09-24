"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLive } from "@/lib/live";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { isLoggedIn } from "@/lib/auth";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, myOrders, type ShopOrderOut } from "@/lib/shop";

function orderDate(iso: string) {
  return parseUtc(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MyOrdersPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ShopOrderOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent("/orders")}`;
      return;
    }
    myOrders().then(setRows).catch((e) => setError(e.message));
  }, []);
  useLive("me", () => {
    myOrders().then(setRows).catch(() => {});
  });

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={97} />
      <div className="relative mx-auto max-w-4xl px-6 py-20">
        <h1 className="font-display text-[clamp(2.2rem,4.5vw,3.8rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">{t("nav.myOrders")}</h1>

        {!rows ? (
          <p className="mt-12 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="mt-12 flex flex-col items-start gap-6 border border-line bg-ink/85 p-8">
            <p className="text-cream/80">{t("order.none")}</p>
            <Link href="/shop" className="inline-flex items-center gap-3 bg-white px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink hover:bg-gold">
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("shop.continueShopping")}
            </Link>
          </div>
        ) : (
          <ul className="mt-12 flex flex-col gap-4">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 border border-line bg-ink/85 px-6 py-5 transition-colors hover:border-gold/60">
                  <div>
                    <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{o.order_number}</p>
                    <p className="mt-1 text-sm text-cream/65">
                      {orderDate(o.created_at)} · {o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="text-cream">{formatPrice(o.total_amount)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
