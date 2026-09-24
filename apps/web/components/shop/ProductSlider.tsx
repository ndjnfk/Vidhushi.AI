"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { listProducts, type ProductOut } from "@/lib/shop";
import { useLive } from "@/lib/live";

const CELL = "w-[85%] shrink-0 snap-start border-r border-line sm:w-1/2 lg:w-1/4";

const ARROW =
  "flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-cream/35 text-cream transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-30 md:h-[60px] md:w-[60px]";

// Home-page carousel: a titled row of bordered product cells that scrolls
// horizontally (swipe, or the arrow buttons) and snaps to each card.
export default function ProductSlider({
  title,
  subtitle,
  category,
}: {
  title: string;
  subtitle: string;
  category?: string;
}) {
  const { t } = useLanguage();
  const track = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<ProductOut[] | null>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const load = useCallback(() => {
    listProducts(category).then(setProducts).catch(() => setProducts((cur) => cur ?? []));
  }, [category]);
  useEffect(load, [load]);
  useLive("products", load);

  const updateEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, products]);

  useEffect(() => {
    if (products) requestAnimationFrame(updateEdges);
  }, [products, updateEdges]);

  function scroll(dir: 1 | -1) {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (el && card) el.scrollBy({ left: dir * card.offsetWidth, behavior: "smooth" });
  }

  if (products && products.length === 0) return null;

  return (
    <section className="border-t border-line bg-ink font-body text-cream">
      <div className="flex flex-wrap items-end justify-between gap-8 px-6 pb-14 pt-24 md:px-16 lg:px-[5%]">
        <div>
          <h2 className="font-display text-[clamp(2.4rem,4vw,4rem)] uppercase leading-[1.1] tracking-[0.04em] text-gold">{title}</h2>
          <p className="mt-4 text-[1.15rem] text-cream/85">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/shop" className="mr-2 flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.14em] hover:text-gold">
            <Sparkle className="h-3 w-3 text-gold" />
            {t("shop.viewAll")}
          </Link>
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={t("shop.prev")} className={ARROW}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-5 w-5" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={t("shop.next")} className={ARROW}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-5 w-5" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto border-y border-line">
        {products
          ? products.map((p) => <ProductCard key={p.id} product={p} className={CELL} />)
          : Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${CELL} px-8 md:px-12 2xl:px-20 pb-14 pt-16`}>
                <div className="aspect-[3/4] animate-pulse bg-ink-soft" />
                <div className="mt-8 h-7 w-3/4 animate-pulse bg-ink-soft" />
                <div className="mt-4 h-6 w-1/3 animate-pulse bg-ink-soft" />
              </div>
            ))}
      </div>
    </section>
  );
}
