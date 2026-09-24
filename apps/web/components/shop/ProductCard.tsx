"use client";

import { useCallback, useState } from "react";
import ProductDetailModal from "@/components/shop/ProductDetailModal";
import Sparkle from "@/components/Sparkle";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatPrice, isOnSale, type ProductOut } from "@/lib/shop";

// One bordered cell of the product grid/slider: image with a hover
// "Add to cart" button, optional Sale badge, gold title and price.
export default function ProductCard({ product, className = "" }: { product: ProductOut; className?: string }) {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const soldOut = product.stock_quantity === 0;
  const [detailOpen, setDetailOpen] = useState(false);
  const closeDetail = useCallback(() => setDetailOpen(false), []);

  function handleAdd() {
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image_url });
  }

  return (
    <article className={`group relative flex flex-col px-8 md:px-12 2xl:px-20 pb-14 pt-16 transition-colors hover:bg-ink-soft ${className}`}>
      {isOnSale(product) && (
        <span className="absolute right-8 top-6 bg-white md:right-12 2xl:right-20 px-3 py-0.5 text-sm text-gold-deep">{t("shop.sale")}</span>
      )}

      <div className="relative aspect-[3/4] overflow-hidden bg-ink-soft">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkle className="h-10 w-10 text-gold/40" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-4 flex justify-center transition-opacity duration-300 md:top-0 md:bottom-0 md:items-center md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="inline-flex items-center gap-3 bg-white px-7 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:bg-white/80 disabled:text-ink/60"
          >
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {soldOut ? t("shop.outOfStock") : t("shop.addToCart")}
          </button>
        </div>
      </div>

      <h3 className="mt-8 font-display text-[1.6rem] uppercase leading-tight tracking-[0.04em] text-gold">{product.name}</h3>
      {product.description && (
        <p className="mt-3 flex items-baseline gap-2 text-[0.95rem] text-cream/70">
          <span className="min-w-0 flex-1 truncate">{product.description}</span>
          <button type="button" onClick={() => setDetailOpen(true)}
            className="shrink-0 text-[12px] font-extrabold uppercase tracking-[0.12em] text-gold underline-offset-4 hover:underline">
            {t("shop.seeMore")}
          </button>
        </p>
      )}
      <p className="mt-4 flex items-baseline gap-4 font-body text-xl text-cream">
        {isOnSale(product) && <s className="text-cream/60">{formatPrice(product.compare_at_price!)}</s>}
        <span>{formatPrice(product.price)}</span>
      </p>
      {detailOpen && <ProductDetailModal product={product} onClose={closeDetail} />}
    </article>
  );
}
