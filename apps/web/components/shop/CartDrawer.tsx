"use client";

import Link from "next/link";
import { useEffect } from "react";
import Sparkle from "@/components/Sparkle";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice } from "@/lib/shop";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

const STEP = "flex h-8 w-8 items-center justify-center text-lg leading-none text-cream transition-colors hover:text-gold";

// Slide-in cart, opened from the header cart button or after "Add to cart".
export default function CartDrawer() {
  const { t } = useLanguage();
  const { items, isOpen, closeCart, updateQuantity, removeItem, totalAmount } = useCart();
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 font-body text-cream">
      <button type="button" aria-label={t("nav.close")} onClick={closeCart} className="absolute inset-0 bg-black/60" />
      <aside
        role="dialog"
        aria-label={t("shop.cartTitle")}
        className="absolute right-0 top-0 flex h-full w-full max-w-[460px] flex-col border-l border-line bg-ink"
      >
        <div className="flex items-center justify-between border-b border-line px-8 py-6">
          <h2 className="font-display text-2xl uppercase tracking-[0.06em] text-gold">{t("shop.cartTitle")}</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label={t("nav.close")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-cream/35 text-gold transition-colors hover:border-gold"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
            <Sparkle className="h-8 w-8 text-gold/60" />
            <p className="text-cream/80">{t("shop.cartEmpty")}</p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="inline-flex items-center gap-3 border border-cream/40 px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:border-gold hover:text-gold"
            >
              <Sparkle className="h-3 w-3 text-gold" />
              {t("shop.continueShopping")}
            </Link>
          </div>
        ) : (
          <>
            <ul className="no-scrollbar flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-8">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-5 py-6">
                  <div className="h-[104px] w-[78px] shrink-0 overflow-hidden bg-ink-soft">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg uppercase leading-snug tracking-[0.03em] text-gold">{item.name}</h3>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        aria-label={`${t("shop.remove")} ${item.name}`}
                        className="text-cream/50 transition-colors hover:text-gold"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                          <path d="M5 5l14 14M19 5L5 19" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-line">
                        <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="−" className={STEP}>−</button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="+" className={STEP}>+</button>
                      </div>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-8 py-7">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-extrabold uppercase tracking-[0.14em]">{t("shop.subtotal")}</span>
                <span className="text-2xl">{formatPrice(totalAmount)}</span>
              </div>
              <Link
                href="/shop/checkout"
                onClick={closeCart}
                className="mt-6 flex items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold"
              >
                <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                {t("shop.checkoutButton")}
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-4 w-full text-center text-[13px] font-bold uppercase tracking-[0.14em] text-cream/70 transition-colors hover:text-gold"
              >
                {t("shop.continueShopping")}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
