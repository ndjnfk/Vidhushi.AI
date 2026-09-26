"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArchScene from "@/components/ArchScene";
import BookConsultationButton from "@/components/booking/BookConsultation";
import Planet from "@/components/Planet";
import SectionHeading from "@/components/SectionHeading";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { RITUAL_INTENTIONS } from "@/lib/offerings";
import { listRituals, type RitualServiceOut } from "@/lib/rituals";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold";
const OUTLINE_BTN =
  "inline-flex items-center justify-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold";

export default function RitualsPage() {
  const { t } = useLanguage();
  const [services, setServices] = useState<RitualServiceOut[]>([]);

  // Optional extra section: stays hidden if the list is empty or can't load.
  useEffect(() => {
    listRituals().then(setServices).catch(() => {});
  }, []);

  const steps = ["rituals.step1", "rituals.step2", "rituals.step3", "rituals.step4"];

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Starfield seed={29} />
        <Planet className="pointer-events-none absolute -bottom-[30%] -left-[12%] w-[min(38vw,480px)] opacity-60" />

        <div className="relative mx-auto grid min-h-[calc(100vh-97px)] max-w-[1400px] items-center gap-16 px-6 py-20 md:px-16 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
              <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
              <Sparkle className="h-2.5 w-2.5 text-gold" />
              <span className="text-gold">{t("nav.rituals")}</span>
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.8rem,5.5vw,5rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
              {t("rituals.pageTitle")}
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-cream/85">{t("rituals.pageSubtitle")}</p>
            <p className="mt-6 max-w-xl border-l-2 border-gold/60 pl-5 text-sm italic leading-relaxed text-cream/70">{t("rituals.chargesNote")}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <BookConsultationButton preset={{ kind: "ritual" }} className={PRIMARY_BTN}>
                <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                {t("rituals.ctaEnquire")}
              </BookConsultationButton>
              <a href="#intentions" className={OUTLINE_BTN}>
                <Sparkle className="h-3.5 w-3.5 text-gold" />
                {t("rituals.ctaIntentions")}
              </a>
            </div>
          </div>

          {/* Arch with the diya night scene */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-full border border-gold/40 shadow-[0_0_60px_rgba(199,161,122,0.15)]">
              <ArchScene />
            </div>
            <Sparkle className="absolute -right-3 top-[18%] h-6 w-6 animate-twinkle text-gold" />
            <Sparkle className="absolute -left-4 top-[48%] h-4 w-4 animate-twinkle text-cream/80 [animation-delay:1.2s]" />
          </div>
        </div>
      </section>

      {/* Intentions */}
      <section id="intentions" className="scroll-mt-28 border-t border-line px-6 py-24 md:px-16">
        <SectionHeading title={t("rituals.intentionsTitle")} subtitle={t("rituals.intentionsSubtitle")} />
        <ul className="mx-auto mt-16 grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RITUAL_INTENTIONS.map((i, n) => (
            <li key={i}>
              <BookConsultationButton
                preset={{ kind: "ritual", intention: i }}
                className="group flex h-full w-full items-center gap-5 border border-line bg-ink-soft/80 px-6 py-6 text-left transition-colors hover:border-gold/60"
              >
                <span className="font-display text-sm text-cream/40">{String(n + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display text-[1.15rem] uppercase leading-snug tracking-[0.04em] text-cream transition-colors group-hover:text-gold">
                  {t(`rituals.intention.${i}`)}
                </span>
                <Sparkle className="h-3.5 w-3.5 shrink-0 text-gold transition-transform duration-500 group-hover:rotate-90" />
              </BookConsultationButton>
            </li>
          ))}
        </ul>
      </section>

      {/* Urgent wish */}
      <section className="border-t border-line px-6 py-24 md:px-16">
        <div className="relative mx-auto max-w-[1100px] overflow-hidden border border-gold/50 px-8 py-16 text-center md:px-16">
          <Starfield seed={83} />
          <Planet variant="grey" className="pointer-events-none absolute -right-6 -top-6 w-24 animate-float opacity-80" />
          <div className="relative">
            <Sparkle className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mt-6 font-display text-[clamp(2rem,3.6vw,3.2rem)] uppercase leading-[1.1] tracking-[0.04em] text-gold">
              {t("rituals.urgentTitle")}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl font-display text-[1.3rem] italic leading-snug text-cream">{t("rituals.urgentLead")}</p>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-cream/80">{t("rituals.urgentBody")}</p>
            <BookConsultationButton preset={{ kind: "ritual", intention: "urgent" }} className={`${PRIMARY_BTN} mt-10`}>
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("rituals.ctaEnquire")}
            </BookConsultationButton>
          </div>
        </div>
      </section>

      {/* How to enquire */}
      <section className="relative overflow-hidden border-t border-line px-6 py-24 md:px-16">
        <Starfield seed={97} />
        <div className="relative">
          <SectionHeading title={t("rituals.howTitle")} subtitle={t("rituals.howIntro")} />
          <ol className="mx-auto mt-16 grid max-w-[1200px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((k, i) => (
              <li key={k} className="flex flex-col items-center border border-line bg-ink/85 p-8 text-center backdrop-blur-sm">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-gold/60 font-display text-2xl text-gold">
                  {i + 1}
                </span>
                <p className="mt-6 font-display text-[1.15rem] uppercase leading-snug tracking-[0.04em] text-cream">{t(k)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 flex justify-center">
            <BookConsultationButton preset={{ kind: "ritual" }} className={PRIMARY_BTN}>
              <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
              {t("rituals.ctaEnquire")}
            </BookConsultationButton>
          </div>
        </div>
      </section>

      {/* Bookable weekly candle rituals from the API */}
      {services.length > 0 && (
        <section className="border-t border-line px-6 py-24 md:px-16">
          <SectionHeading title={t("rituals.candleTitle")} subtitle={t("rituals.candleSubtitle")} />
          <div className="mx-auto mt-16 grid max-w-[1200px] gap-6 md:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.id}
                href={`/rituals/${s.id}`}
                className="group flex flex-col border border-line bg-ink-soft/80 p-8 transition-colors hover:border-gold/60"
              >
                <h3 className="font-display text-[1.45rem] uppercase tracking-[0.04em] text-gold">{s.name}</h3>
                <p className="mt-4 flex-1 leading-relaxed text-cream/75">{s.description}</p>
                <p className="mt-6 flex items-center justify-between border-t border-line pt-5">
                  <span className="font-display text-2xl text-cream">
                    ₹{s.price_min.toFixed(0)} – ₹{s.price_max.toFixed(0)}{" "}
                    <span className="font-body text-sm text-cream/60">{t("rituals.perWeek")}</span>
                  </span>
                  <Sparkle className="h-4 w-4 text-gold transition-transform duration-500 group-hover:rotate-90" />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tarot teaser */}
      <section className="border-t border-line px-6 py-16 md:px-16">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <p className="font-display text-[clamp(1.3rem,2.2vw,1.8rem)] uppercase leading-snug tracking-[0.04em] text-cream">
            {t("tarot.heroTagline")}
          </p>
          <Link href="/#sessions" className={`${OUTLINE_BTN} shrink-0`}>
            <Sparkle className="h-3.5 w-3.5 text-gold" />
            {t("tarot.heroTitle")}
          </Link>
        </div>
      </section>
    </div>
  );
}
