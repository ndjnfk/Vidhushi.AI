"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import OrderStatusBadge from "@/components/shop/OrderStatusBadge";
import Sparkle from "@/components/Sparkle";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, type OrderStatus, type ShopOrderOut } from "@/lib/shop";
import { listOrders, markOrderPaymentReceived, updateOrderStatus } from "../../_lib/api";
import StatusTabs, { MovedNotice } from "../../_components/StatusTabs";

// In the order an order moves through them.
const TABS = ["pending_payment", "payment_submitted", "placed", "confirmed", "shipped", "delivered", "cancelled", "all"] as const;
type Tab = (typeof TABS)[number];
const URGENT: Tab[] = ["payment_submitted", "placed", "confirmed"]; // waiting on Vidushi Ji
const tabOf = (s: OrderStatus): Tab => s;
type Moved = (id: string, status: OrderStatus) => void;
// Next steps offered for each status (mirrors the API's allowed moves).
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  // Awaiting the online advance: confirmed via "Payment received".
  pending_payment: ["cancelled"],
  payment_submitted: ["cancelled"],
  placed: ["confirmed", "shipped", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};
const INPUT = "w-full border border-line bg-transparent px-3 py-2.5 text-cream outline-none placeholder:text-cream/40 focus:border-gold";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function when(iso: string) {
  return parseUtc(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function OrderCard({ o, onChange, focused }: { o: ShopOrderOut; onChange: Moved; focused: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused]);
  const { t } = useLanguage();
  const [courier, setCourier] = useState(o.courier);
  const [tracking, setTracking] = useState(o.tracking_number);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = o.shipping_address;
  const next = NEXT[o.status];

  async function move(status: OrderStatus) {
    if (status === "cancelled" && !confirm(t("adminOrders.cancelConfirm"))) return;
    setBusy(true);
    setError(null);
    try {
      await updateOrderStatus(o.id, { status, courier, tracking_number: tracking, note });
      setNote("");
      onChange(o.id, status);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <li ref={ref} className={`border bg-ink-soft/60 p-6 transition-[border-color,box-shadow] duration-700 md:p-8 ${
      focused ? "border-gold shadow-[0_0_0_1px_var(--color-gold),0_0_40px_-12px_var(--color-gold)]" : "border-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{o.order_number}</p>
          <p className="mt-1 text-sm text-cream/60">{when(o.created_at)} · {o.customer_email}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-right">
            <span className="block text-xl text-cream">{formatPrice(o.total_amount)}</span>
            {o.payment_method === "partial" && (
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-cream/70">
                {t("adminOrders.advanceOnline")} {formatPrice(o.advance_amount)}
              </span>
            )}
            <span className="block text-[11px] font-extrabold uppercase tracking-[0.12em] text-gold">
              {t("adminOrders.collectCod")} {formatPrice(o.cod_amount)}
            </span>
          </span>
          <OrderStatusBadge status={o.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/55">{t("order.items")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {o.items.map((i) => (
              <li key={i.product_id} className="flex justify-between gap-4">
                <span className="text-cream">{i.product_name} × {i.quantity}</span>
                <span className="text-cream/70">{formatPrice(i.unit_price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/55">{t("order.deliverTo")}</p>
          <address className="mt-2 text-sm not-italic leading-relaxed text-cream/90">
            {a.full_name}<br />{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.city}, {a.state} – {a.pincode}<br />
            <a href={`tel:${a.phone}`} className="text-gold hover:underline">{a.phone}</a>
          </address>
        </div>
      </div>

      {(o.courier || o.tracking_number) && (
        <p className="mt-4 text-sm text-cream/75">
          {o.courier && <>{t("order.courier")}: <span className="text-cream">{o.courier}</span> </>}
          {o.tracking_number && <>· {t("order.tracking")}: <span className="font-mono text-gold">{o.tracking_number}</span></>}
        </p>
      )}

      {(o.status === "pending_payment" || o.status === "payment_submitted") && (
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <div className="mr-auto text-sm">
            <p className={o.status === "payment_submitted" ? "text-gold" : "text-cream/65"}>
              {t(o.status === "payment_submitted" ? "adminOrders.customerSaysPaid" : "adminOrders.awaitingAdvance")
                .replace("{amount}", formatPrice(o.advance_amount))}
            </p>
            {o.payment_reference && <p className="mt-1 text-cream/75">{t("pay.reference")}: <span className="font-mono">{o.payment_reference}</span></p>}
          </div>
          <button type="button" disabled={busy}
            onClick={async () => {
              if (!confirm(t("adminOrders.confirmReceived").replace("{amount}", formatPrice(o.advance_amount)))) return;
              setBusy(true);
              try {
                await markOrderPaymentReceived(o.id);
                onChange(o.id, "confirmed");
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              } finally {
                setBusy(false);
              }
            }}
            className={`${BTN} bg-white text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {t("admin.paymentReceived")}
          </button>
        </div>
      )}

      {next.length > 0 && (
        <div className="mt-6 border-t border-line pt-6">
          {next.includes("shipped") && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65">{t("adminOrders.courierLabel")}</span>
                  <input className={INPUT} value={courier} onChange={(e) => setCourier(e.target.value)} maxLength={80} placeholder={t("adminOrders.courierPh")} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65">{t("adminOrders.trackingLabel")}</span>
                  <input className={INPUT} value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={80} placeholder={t("adminOrders.trackingPh")} />
                </label>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-cream/55">{t("adminOrders.trackingHint")}</p>
            </>
          )}
          <input className={`${INPUT} mt-3`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t("adminOrders.notePh")} />
          <div className="mt-4 flex flex-wrap gap-3">
            {next.filter((s) => s !== "cancelled").map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => move(s)} className={`${BTN} bg-white text-ink hover:bg-gold`}>
                <Sparkle className="h-3 w-3 text-gold-deep" />
                {t(`adminOrders.mark.${s}`)}
              </button>
            ))}
            {next.includes("cancelled") && (
              <button type="button" disabled={busy} onClick={() => move("cancelled")}
                className={`${BTN} border border-line text-cream/75 hover:border-red-400 hover:text-red-300`}>
                {t("adminOrders.cancelOrder")}
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-cream/50">{t("adminOrders.emailNote")}</p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
      )}
    </li>
  );
}

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<Tab | null>(null);
  const [all, setAll] = useState<ShopOrderOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  // Everything is loaded once and filtered here, so tabs switch instantly
  // and each tab can show its count.
  const load = useCallback(() => {
    listOrders().then(setAll).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(TABS.map((k) => [k, 0])) as Record<Tab, number>;
    for (const o of all ?? []) c[tabOf(o.status)]++;
    c.all = all?.length ?? 0;
    return c;
  }, [all]);

  // Until the admin picks a tab, open where work is waiting.
  const tab: Tab = picked ?? (["payment_submitted", "placed", "confirmed", "shipped", "pending_payment"] as Tab[]).find((k) => counts[k] > 0) ?? "placed";

  // After a status change, follow the order to its new tab.
  const moved = useCallback<Moved>((id, status) => {
    const next = tabOf(status);
    load();
    setPicked(next);
    setFocusId(id);
    setNotice(`${t("admin.nowIn")} ${t(`order.status.${next}`)}`);
  }, [load, t]);

  const rows = all?.filter((o) => tab === "all" || tabOf(o.status) === tab) ?? null;

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminOrders.title")}</h1>

        <StatusTabs
          active={tab}
          onSelect={(k) => { setPicked(k); setFocusId(null); setNotice(null); }}
          tabs={TABS.map((k) => ({
            key: k,
            label: k === "all" ? t("shop.categoryAll") : t(`order.status.${k}`),
            count: counts[k],
            urgent: URGENT.includes(k),
          }))}
        />
        <MovedNotice text={notice} onClose={clearNotice} />

        {!rows ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("admin.empty")}</p>
        ) : (
          <ul className="mt-8 flex flex-col gap-5">
            {rows.map((o) => <OrderCard key={`${o.id}-${o.status}`} o={o} onChange={moved} focused={o.id === focusId} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
