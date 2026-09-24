"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { isLoggedIn } from "@/lib/auth";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { cancelShopOrder, formatPrice, getShopOrder, type OrderStatus, type ShopOrderOut } from "@/lib/shop";
import { useLive } from "@/lib/live";

const STEPS: OrderStatus[] = ["placed", "confirmed", "shipped", "delivered"];

function when(iso: string) {
  return parseUtc(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Order tracking: progress steps, courier details, items, address, cancel.
export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [o, setO] = useState<ShopOrderOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justPlaced, setJustPlaced] = useState(false);

  const load = useCallback(() => {
    getShopOrder(params.id).then(setO).catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = `/account/login?next=${encodeURIComponent(`/orders/${params.id}`)}`;
      return;
    }
    const placed = new URLSearchParams(window.location.search).get("placed") === "1";
    // Strip ?placed only when actually showing the banner (dev mode runs this twice).
    const raf = requestAnimationFrame(() => {
      if (!placed) return;
      window.history.replaceState(null, "", `/orders/${params.id}`);
      setJustPlaced(true);
    });
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [load, params.id]);
  // Status and tracking updates appear the moment the admin saves them.
  useLive("me", load);

  async function cancel() {
    if (!o || !confirm(t("order.cancelConfirm"))) return;
    try {
      setO(await cancelShopOrder(o.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const reached = (s: OrderStatus) => o?.history.find((h) => h.status === s);
  const currentStep = o ? STEPS.indexOf(o.status) : -1;

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={101} />
      <div className="relative mx-auto max-w-4xl px-6 py-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <Link href="/orders" className="hover:text-gold">{t("nav.myOrders")}</Link>
        </p>

        {!o ? (
          <p className="mt-12 text-cream/70">{error ?? t("common.loading")}</p>
        ) : (
          <>
            {justPlaced && (
              <div className="mt-8 flex items-start gap-4 border border-gold/60 bg-gold/10 px-6 py-5">
                <Sparkle className="mt-1 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{t("order.placedTitle")}</p>
                  <p className="mt-1 text-cream/85">{t("order.placedBody").replace("{amount}", formatPrice(o.total_amount))}</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("order.order")}</p>
                <h1 className="font-display text-[clamp(2rem,4vw,3.2rem)] uppercase leading-none tracking-[0.04em] text-gold">{o.order_number}</h1>
              </div>
              <OrderStatusBadge status={o.status} />
            </div>

            {/* Progress */}
            <section className="mt-8 border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
              {o.status === "cancelled" ? (
                <p className="text-cream/80">{t("order.cancelledNote")}</p>
              ) : (
                <ol className="grid gap-6 sm:grid-cols-4 sm:gap-2">
                  {STEPS.map((s, i) => {
                    const done = i <= currentStep;
                    const ev = reached(s);
                    return (
                      <li key={s} className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                          done ? "border-gold bg-gold text-ink" : "border-cream/30 text-cream/40"}`}>
                          {done ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                          ) : (
                            <span className="text-sm">{i + 1}</span>
                          )}
                        </span>
                        <span>
                          <span className={`block text-[12px] font-extrabold uppercase tracking-[0.12em] ${done ? "text-gold" : "text-cream/50"}`}>
                            {t(`order.status.${s}`)}
                          </span>
                          {ev && <span className="mt-1 block text-xs text-cream/55">{when(ev.at)}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              {(o.courier || o.tracking_number) && (
                <dl className="mt-8 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
                  {o.courier && <div><dt className="text-cream/55">{t("order.courier")}</dt><dd className="text-cream">{o.courier}</dd></div>}
                  {o.tracking_number && <div><dt className="text-cream/55">{t("order.tracking")}</dt><dd className="font-mono text-gold">{o.tracking_number}</dd></div>}
                </dl>
              )}
              {o.history.filter((h) => h.note).map((h, i) => (
                <p key={i} className="mt-4 border-l-2 border-gold/60 pl-4 text-sm italic text-cream/80">
                  {when(h.at)} — {h.note}
                </p>
              ))}
            </section>

            <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
              <section className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
                <h2 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("order.items")}</h2>
                <ul className="mt-4 divide-y divide-line">
                  {o.items.map((i) => (
                    <li key={i.product_id} className="flex justify-between gap-4 py-3">
                      <span className="font-display uppercase tracking-[0.03em] text-gold">{i.product_name} <span className="font-body text-cream/65">× {i.quantity}</span></span>
                      <span>{formatPrice(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-baseline justify-between border-t border-line pt-4">
                  <span className="text-[12px] font-extrabold uppercase tracking-[0.14em]">{t("order.toPay")}</span>
                  <span className="text-2xl">{formatPrice(o.total_amount)}</span>
                </div>
                <p className="mt-1 text-right text-xs text-cream/55">{t("shop.cod")}</p>
              </section>

              <section className="h-fit border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
                <h2 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("order.deliverTo")}</h2>
                <address className="mt-4 not-italic leading-relaxed text-cream/90">
                  {o.shipping_address.full_name}<br />
                  {o.shipping_address.line1}<br />
                  {o.shipping_address.line2 && <>{o.shipping_address.line2}<br /></>}
                  {o.shipping_address.city}, {o.shipping_address.state} – {o.shipping_address.pincode}<br />
                  {o.shipping_address.phone}
                </address>
              </section>
            </div>

            {(o.status === "placed" || o.status === "confirmed") && (
              <button type="button" onClick={cancel} className="mt-8 text-sm text-cream/55 underline-offset-4 hover:text-gold hover:underline">
                {t("order.cancel")}
              </button>
            )}
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
