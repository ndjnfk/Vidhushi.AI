"use client";

import Link from "next/link";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import { AboutArt, SERVICES } from "@/components/home/AboutSection";
import Planet from "@/components/Planet";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";

const VALUES = [
  { title: "about.valueTraditionTitle", body: "about.valueTraditionBody" },
  { title: "about.valuePrecisionTitle", body: "about.valuePrecisionBody" },
  { title: "about.valueCareTitle", body: "about.valueCareBody" },
];

export default function AboutPage() {
  const { t } = useLanguage();
  const home = useHomeContent();
  // Admin-edited cards, or the built-in (translated) three.
  const values = home?.values.length ? home.values : VALUES.map((v) => ({ title: t(v.title), body: t(v.body) }));

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      {/* Banner */}
      <section className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-b border-line px-6 py-24 text-center">
        <Starfield seed={61} />
        <Planet className="pointer-events-none absolute -left-[6%] top-[20%] w-[min(30vw,380px)]" />
        <div className="relative">
          <p className="flex items-center justify-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
            <Link href="/" className="hover:text-gold">{t("nav.home")}</Link>
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            <span className="text-gold">{t("nav.about")}</span>
          </p>
          <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] uppercase leading-none tracking-[0.04em] text-gold">
            {t("about.pageTitle")}
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 py-24 md:px-16 lg:px-[5%]">
        <div className="mx-auto grid max-w-[1500px] items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <AboutArt />
          <div>
            <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold">
              <Sparkle className="h-3 w-3" />
              {t("about.eyebrow")}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,3.8vw,3.6rem)] uppercase leading-[1.1] tracking-[0.04em] text-gold">
              {home?.story_title || t("about.storyTitle")}
            </h2>
            {(home?.story_text ? home.story_text.split(/\n\s*\n/) : [t("about.story1"), t("about.story2")]).map((para, i) => (
              <p key={i} className={`${i ? "mt-5" : "mt-6"} whitespace-pre-line text-[1.1rem] leading-[1.8] text-cream/85`}>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-line px-6 py-24 md:px-16 lg:px-[5%]">
        <div className={`mx-auto grid max-w-[1500px] gap-px border border-line bg-line ${values.length % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {values.map((v) => (
            <div key={v.title} className="bg-ink px-8 py-12 md:px-12">
              <Sparkle className="h-6 w-6 text-gold" />
              <h3 className="mt-6 font-display text-2xl uppercase tracking-[0.05em] text-gold">{v.title}</h3>
              <p className="mt-4 leading-[1.8] text-cream/80">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="border-t border-line px-6 py-24 md:px-16 lg:px-[5%]">
        <div className="mx-auto max-w-[1500px]">
          <h2 className="text-center font-display text-[clamp(2.2rem,3.8vw,3.6rem)] uppercase tracking-[0.04em] text-gold">
            {t("about.servicesTitle")}
          </h2>
          <div className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
            {SERVICES.map((s) => (
              <Link key={s.key} href={s.href} className="group flex items-center justify-between gap-6 bg-ink px-8 py-8 transition-colors hover:bg-ink-soft">
                <span className="flex items-center gap-4 font-display text-xl uppercase tracking-[0.04em] text-cream group-hover:text-gold">
                  <Sparkle className="h-3.5 w-3.5 text-gold" />
                  {t(s.key)}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" aria-hidden="true">
                  <path d="M4 12h16M14 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Stats />
      <Testimonials />

      {/* CTA */}
      <section className="border-t border-line px-6 py-24 text-center">
        <h2 className="font-display text-[clamp(2rem,3.4vw,3.2rem)] uppercase tracking-[0.04em] text-gold">{t("about.ctaTitle")}</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/kundli" className="inline-flex items-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold">
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {t("home.ctaKundli")}
          </Link>
          <Link href="/shop" className="inline-flex items-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors hover:border-gold hover:text-gold">
            <Sparkle className="h-3.5 w-3.5 text-gold" />
            {t("nav.shop")}
          </Link>
        </div>
      </section>
    </div>
  );
}
