"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Planet from "@/components/Planet";
import ProductCard from "@/components/shop/ProductCard";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { listProducts, type ProductOut } from "@/lib/shop";
import { useLive } from "@/lib/live";

// Category tabs in display order; only those with products are shown.
const CATEGORIES = ["bracelet", "gemstone", "rudraksha", "yantra", "other"];

export default function ShopPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<ProductOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const load = useCallback(() => {
    listProducts()
      .then((p) => {
        setProducts(p);
        setError(null);
      })
      .catch((e) => {
        setError(e.message);
        setProducts((cur) => cur ?? []);
      });
  }, []);
  useEffect(load, [load]);
  useLive("products", load);

  const tabs = useMemo(
    () => CATEGORIES.filter((c) => products?.some((p) => p.category === c)),
    [products],
  );
  const visible = products?.filter((p) => !category || p.category === category) ?? [];

  const tabClass = (active: boolean) =>
    `whitespace-nowrap border-b pb-1 text-[13px] font-extrabold uppercase tracking-[0.14em] transition-colors hover:text-gold ${
      active ? "border-gold text-gold" : "border-transparent text-cream/80"
    }`;

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      {/* Banner */}
      <section className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-b border-line px-6 py-24 text-center">
        <Starfield seed={23} />
        <Planet className="pointer-events-none absolute -right-[6%] top-[18%] w-[min(34vw,420px)]" />
        <Planet variant="grey" className="pointer-events-none absolute left-[8%] top-[62%] w-[min(5vw,56px)]" />
        <div className="relative">
          <p className="flex items-center justify-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{t("nav.shop")}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-none tracking-[0.04em] text-gold">
            {t("shop.pageTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[1.15rem] leading-relaxed text-cream/85">{t("shop.heroSubtitle")}</p>
        </div>
      </section>

      {/* Category tabs */}
      {tabs.length > 1 && (
        <nav className="no-scrollbar flex gap-8 overflow-x-auto px-6 pt-12 md:justify-center md:px-16">
          <button type="button" onClick={() => setCategory(null)} className={tabClass(category === null)}>
            {t("shop.categoryAll")}
          </button>
          {tabs.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={tabClass(category === c)}>
              {t(`shop.category.${c}`)}
            </button>
          ))}
        </nav>
      )}

      {/* Grid */}
      <section className="mt-12 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
        {products === null
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="border-b border-line px-8 md:px-12 2xl:px-20 pb-14 pt-16 sm:border-r">
                <div className="aspect-[3/4] animate-pulse bg-ink-soft" />
                <div className="mt-8 h-7 w-3/4 animate-pulse bg-ink-soft" />
                <div className="mt-4 h-6 w-1/3 animate-pulse bg-ink-soft" />
              </div>
            ))
          : visible.map((p) => <ProductCard key={p.id} product={p} className="border-b border-line sm:border-r" />)}
      </section>

      {products !== null && visible.length === 0 && (
        <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
          <Sparkle className="h-8 w-8 text-gold/60" />
          <p className="text-cream/80">{error ? error : t("shop.noProducts")}</p>
        </div>
      )}
      <div className="h-24" />
    </div>
  );
}
