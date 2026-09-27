"use client";

import Link from "next/link";
import RateList from "@/components/home/RateList";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PAGE_SIZE = 20;

// Every service of the rate list (the home page shows only the first few).
// Linked from the header, the footer and the home page's "See more".
export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={127} />
      <div className="relative mx-auto max-w-5xl px-6 pt-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <span className="text-gold">{t("nav.pricing")}</span>
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.4rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          {t("nav.pricing")}
        </h1>
        <p className="mt-4 max-w-2xl text-[1.1rem] leading-relaxed text-cream/80">{t("pricing.subtitle")}</p>
      </div>
      <div className="relative mt-4 [&>section]:border-t-0">
        <RateList pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
