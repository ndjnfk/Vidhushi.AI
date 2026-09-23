"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PaymentButton from "@/components/PaymentButton";
import { useCart } from "@/lib/CartContext";
import { checkout, type ShopOrderOut } from "@/lib/shop";
import { isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ShopCheckoutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { items, totalAmount, clear } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [order, setOrder] = useState<ShopOrderOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn()) {
      router.push("/account/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const o = await checkout(
        items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        { full_name: fullName, phone, line1, line2: line2 || undefined, city, state, pincode }
      );
      setOrder(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (confirmed) {
    return (
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-2">{t("shop.orderConfirmedTitle")}</h1>
        <p className="text-gray-600">{t("shop.orderConfirmedBody")}</p>
      </div>
    );
  }

  if (items.length === 0 && !order) {
    return <p className="text-gray-500">{t("shop.cartEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h1 className="text-2xl font-bold">{t("shop.checkoutTitle")}</h1>
      <div className="text-sm text-gray-600">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between">
            <span>{i.name} × {i.quantity}</span>
            <span>₹{(i.price * i.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-2 border-t pt-2">
          <span>{t("shop.total")}</span>
          <span>₹{totalAmount.toFixed(0)}</span>
        </div>
      </div>

      {!order ? (
        <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3">
          <input className="border rounded px-3 py-2" placeholder={t("shop.shippingFullName")} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder={t("shop.shippingPhone")} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder={t("shop.shippingLine1")} value={line1} onChange={(e) => setLine1(e.target.value)} required />
          <input className="border rounded px-3 py-2" placeholder={t("shop.shippingLine2Optional")} value={line2} onChange={(e) => setLine2(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder={t("shop.shippingCity")} value={city} onChange={(e) => setCity(e.target.value)} required />
            <input className="border rounded px-3 py-2" placeholder={t("shop.shippingState")} value={state} onChange={(e) => setState(e.target.value)} required />
          </div>
          <input className="border rounded px-3 py-2" placeholder={t("shop.shippingPincode")} value={pincode} onChange={(e) => setPincode(e.target.value)} required />
          <button type="submit" disabled={busy} className="bg-orange-600 text-white rounded px-4 py-2 disabled:opacity-50">
            {busy ? t("shop.placingOrder") : t("shop.placeOrder")}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      ) : order.order ? (
        <PaymentButton
          order={order.order}
          onSuccess={() => {
            clear();
            setConfirmed(true);
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}
