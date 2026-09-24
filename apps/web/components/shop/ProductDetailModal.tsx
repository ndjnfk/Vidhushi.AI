"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Sparkle from "@/components/Sparkle";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, isOnSale, type ProductOut } from "@/lib/shop";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

// Full product details: photo, price and the complete description.
export default function ProductDetailModal({ product, onClose }: { product: ProductOut; onClose: () => void }) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const soldOut = product.stock_quantity === 0;
  useLockBodyScroll(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function add() {
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image_url });
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 font-body text-cream sm:p-6">
      <button type="button" aria-label={t("nav.close")} onClick={onClose} className="fixed inset-0 bg-black/70" />
      <div role="dialog" aria-modal="true" aria-labelledby="product-title"
        className="relative flex max-h-full w-full max-w-[860px] flex-col overflow-hidden border border-line bg-ink shadow-2xl md:flex-row">
        <button type="button" onClick={onClose} aria-label={t("nav.close")}
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-cream/35 bg-ink/70 text-gold hover:border-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
        </button>

        <div className="h-56 shrink-0 bg-ink-soft sm:h-72 md:h-auto md:w-[42%]">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Sparkle className="h-10 w-10 text-gold/40" /></div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 pb-6 pt-8 md:px-9 md:pt-10">
            {isOnSale(product) && (
              <span className="bg-white px-3 py-0.5 text-sm text-gold-deep">{t("shop.sale")}</span>
            )}
            <h2 id="product-title" className="mt-4 pr-10 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-gold">{product.name}</h2>
            <p className="mt-4 flex items-baseline gap-4 text-2xl">
              {isOnSale(product) && <s className="text-lg text-cream/55">{formatPrice(product.compare_at_price!)}</s>}
              <span>{formatPrice(product.price)}</span>
            </p>
            {product.description && (
              <p className="mt-6 whitespace-pre-line leading-[1.8] text-cream/85">{product.description}</p>
            )}
            {soldOut ? (
              <p className="mt-6 text-sm text-red-300">{t("shop.outOfStock")}</p>
            ) : product.stock_quantity <= 5 ? (
              <p className="mt-6 text-sm text-gold">{t("shop.fewLeft").replace("{n}", String(product.stock_quantity))}</p>
            ) : null}
          </div>
          <footer className="shrink-0 border-t border-line px-7 py-5 md:px-9">
            <button type="button" onClick={add} disabled={soldOut}
              className="flex w-full items-center justify-center gap-3 bg-white px-7 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50">
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {soldOut ? t("shop.outOfStock") : t("shop.addToCart")}
            </button>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
