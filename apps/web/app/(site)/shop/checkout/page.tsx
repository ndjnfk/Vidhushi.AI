"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useCart } from "@/lib/CartContext";
import { checkout, formatPrice, paymentPlan, type PaymentPlanOut } from "@/lib/shop";
import { isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const INPUT =
  "w-full border border-line bg-transparent px-4 py-3.5 text-cream placeholder:text-cream/45 outline-none transition-colors focus:border-gold";
const PRIMARY =
  "flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:opacity-50";

// Checkout: address -> place order -> order page. How it's paid (all Cash on
// Delivery, or part online first) comes from the server for this address.
export default function ShopCheckoutPage() {
  const { t } = useLanguage();
  const { items, totalAmount, clear } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The plan for a given pincode + cart; shown only while both still match.
  const [planFor, setPlanFor] = useState<{ key: string; plan: PaymentPlanOut } | null>(null);
  const cartKey = items.map((i) => `${i.productId}x${i.quantity}`).join(",");
  const planKey = `${pincode.trim()}|${cartKey}`;
  const plan = planFor?.key === planKey ? planFor.plan : null;

  useEffect(() => {
    const pin = pincode.trim();
    if (pin.length < 6 || !cartKey) return;
    const timer = setTimeout(() => {
      paymentPlan(items.map((i) => ({ product_id: i.productId, quantity: i.quantity })), pin)
        .then((p) => setPlanFor({ key: `${pin}|${cartKey}`, plan: p }))
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
    // `items` is represented by cartKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, cartKey]);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn()) {
      // The cart is kept in the browser, so it's still here after logging in.
      window.location.href = `/account/login?next=${encodeURIComponent("/shop/checkout")}`;
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const o = await checkout(
        items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        { full_name: fullName, phone, line1, line2: line2 || undefined, city, state, pincode }
      );
      clear();
      // Orders needing an online advance open the UPI payment straight away.
      window.location.href = `/orders/${o.id}?placed=1${o.status === "pending_payment" ? "&pay=1" : ""}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <div className="-mx-6 -my-8 min-h-[calc(100vh-97px)] bg-ink px-6 py-16 font-body text-cream md:px-16 lg:px-[8%]">
      {items.length === 0 ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
          <Sparkle className="h-8 w-8 text-gold/60" />
          <p className="text-cream/80">{t("shop.cartEmpty")}</p>
          <Link href="/shop" className={`${PRIMARY} max-w-xs`}>
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {t("shop.continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-14 lg:grid-cols-[1fr_420px]">
          <div>
            <h1 className="font-display text-[clamp(2.4rem,4vw,3.6rem)] uppercase leading-none tracking-[0.04em] text-gold">
              {t("shop.checkoutTitle")}
            </h1>
            <h2 className="mt-10 text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80">{t("shop.shippingDetails")}</h2>

            <form onSubmit={handlePlaceOrder} className="mt-5 flex flex-col gap-4">
              <input className={INPUT} placeholder={t("shop.shippingFullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} autoComplete="name" />
              <input className={INPUT} type="tel" placeholder={t("shop.shippingPhone")} value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={6} maxLength={20} autoComplete="tel" />
              <input className={INPUT} placeholder={t("shop.shippingLine1")} value={line1} onChange={(e) => setLine1(e.target.value)} required maxLength={200} autoComplete="address-line1" />
              <input className={INPUT} placeholder={t("shop.shippingLine2Optional")} value={line2} onChange={(e) => setLine2(e.target.value)} maxLength={200} autoComplete="address-line2" />
              <div className="grid gap-4 sm:grid-cols-3">
                <input className={INPUT} placeholder={t("shop.shippingCity")} value={city} onChange={(e) => setCity(e.target.value)} required maxLength={80} autoComplete="address-level2" />
                <input className={INPUT} placeholder={t("shop.shippingState")} value={state} onChange={(e) => setState(e.target.value)} required maxLength={80} autoComplete="address-level1" />
                <input className={INPUT} placeholder={t("shop.shippingPincode")} value={pincode} onChange={(e) => setPincode(e.target.value)} required minLength={4} maxLength={10} inputMode="numeric" autoComplete="postal-code" />
              </div>

              {/* Payment: decided by the server for this address; shown once known, without saying why */}
              {plan && (
                <>
                <h2 className="mt-6 text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80">{t("shop.payment")}</h2>
                <div className="flex items-start gap-4 border border-gold/60 bg-gold/10 px-5 py-4">
                  <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gold">
                    <span className="h-2 w-2 rounded-full bg-gold" />
                  </span>
                  {plan.method === "cod" ? (
                    <span>
                      <span className="block font-bold text-cream">{t("shop.cod")}</span>
                      <span className="mt-1 block text-sm text-cream/70">{t("shop.codNote").replace("{amount}", formatPrice(plan.total))}</span>
                    </span>
                  ) : (
                    <span className="flex-1">
                      <span className="block font-bold text-cream">{t("shop.partialTitle")}</span>
                      <span className="mt-2 flex justify-between gap-4 text-sm text-cream/85">
                        <span>{t("shop.payNowUpi")}</span><span className="text-gold">{formatPrice(plan.advance_amount)}</span>
                      </span>
                      <span className="mt-1 flex justify-between gap-4 text-sm text-cream/85">
                        <span>{t("shop.payOnDelivery")}</span><span>{formatPrice(plan.cod_amount)}</span>
                      </span>
                      <span className="mt-2 block text-xs text-cream/60">{t("shop.partialNote")}</span>
                    </span>
                  )}
                </div>
                </>
              )}

              {/* Without a plan yet the server still decides on checkout. */}
              <button type="submit" disabled={busy} className={`${PRIMARY} mt-4`}>
                <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                {busy
                  ? t("shop.placingOrder")
                  : !plan
                    ? t("shop.placeOrder")
                    : plan.method === "partial"
                      ? t("shop.placeOrderPay").replace("{amount}", formatPrice(plan.advance_amount))
                      : t("shop.placeOrderCod")}
              </button>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </form>
          </div>

          <aside className="h-fit border border-line bg-ink-soft p-8">
            <h2 className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream/80">{t("shop.orderSummary")}</h2>
            <ul className="mt-6 divide-y divide-line">
              {items.map((i) => (
                <li key={i.productId} className="flex items-center gap-4 py-4">
                  <div className="h-[72px] w-[54px] shrink-0 overflow-hidden bg-ink">
                    {i.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-display uppercase leading-snug tracking-[0.03em] text-gold">{i.name}</p>
                    <p className="mt-1 text-sm text-cream/70">× {i.quantity}</p>
                  </div>
                  <span>{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-5">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.14em]">{t("shop.total")}</span>
              <span className="text-2xl">{formatPrice(totalAmount)}</span>
            </div>
            {plan?.method === "partial" ? (
              <div className="mt-3 space-y-1 text-right text-xs text-cream/65">
                <p>{t("shop.payNowUpi")}: <span className="text-gold">{formatPrice(plan.advance_amount)}</span></p>
                <p>{t("shop.payOnDelivery")}: {formatPrice(plan.cod_amount)}</p>
              </div>
            ) : plan ? (
              <p className="mt-2 text-right text-xs text-cream/55">{t("shop.cod")}</p>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
