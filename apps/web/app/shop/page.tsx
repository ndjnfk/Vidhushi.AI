"use client";

import { useEffect, useState } from "react";
import { listProducts, type ProductOut } from "@/lib/shop";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ShopPage() {
  const { t } = useLanguage();
  const { items, addItem, updateQuantity, removeItem, totalAmount } = useCart();
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProducts().then(setProducts).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{t("shop.pageTitle")}</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border rounded p-4 flex flex-col gap-1">
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-gray-600">{p.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-orange-600">₹{p.price.toFixed(0)}</span>
                <button
                  onClick={() => addItem({ productId: p.id, name: p.name, price: p.price })}
                  disabled={p.stock_quantity === 0}
                  className="bg-orange-600 text-white rounded px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {p.stock_quantity === 0 ? "Out of stock" : t("shop.addToCart")}
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && !error && <p className="text-gray-500">{t("shop.noProducts")}</p>}
      </div>

      <aside className="w-full md:w-72 border rounded p-4 flex flex-col gap-3 h-fit">
        <h2 className="font-semibold">{t("shop.cartTitle")}</h2>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">{t("shop.cartEmpty")}</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.productId} className="flex flex-col gap-1 text-sm border-b pb-2">
                <div className="flex justify-between">
                  <span>{item.name}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-red-600 text-xs">
                    {t("shop.remove")}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                    className="border rounded w-16 px-2 py-1"
                  />
                  <span className="text-gray-500">× ₹{item.price.toFixed(0)}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold">
              <span>{t("shop.total")}</span>
              <span>₹{totalAmount.toFixed(0)}</span>
            </div>
            <a href="/shop/checkout" className="bg-orange-600 text-white rounded px-4 py-2 text-center">
              {t("shop.checkoutButton")}
            </a>
          </>
        )}
      </aside>
    </div>
  );
}
