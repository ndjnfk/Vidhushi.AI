"use client";

import BookConsultationButton from "@/components/booking/BookConsultation";
import Planet from "@/components/Planet";
import ProductSlider from "@/components/shop/ProductSlider";
import AboutSection from "@/components/home/AboutSection";
import Stats from "@/components/home/Stats";
import TarotServices from "@/components/home/TarotServices";
import Testimonials from "@/components/home/Testimonials";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import ZodiacWheel from "@/components/ZodiacWheel";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";
import { useTarotContent } from "@/lib/useTarotContent";

// Default photo inside the arch; the admin can upload another ("Home page").
const DEFAULT_HERO_IMAGE = "/home/hero.jpg";

function HeroArt({ image }: { image: string }) {
  const { t } = useLanguage();

  // Positions follow the reference layout, as % of the panel so it scales.
  return (
    <div className="relative aspect-[3/4] min-w-0 overflow-hidden border-line bg-ink sm:aspect-[950/1040] lg:border-r">
      <Starfield />

      {/* Moon sits behind the arch, cut off by the panel edge */}
      <Planet className="absolute left-[72%] top-[53%] w-[50%]" />
      <Planet variant="grey" className="absolute left-[11%] top-[81%] w-[7%]" />

      {/* Arch portrait */}
      <div className="absolute bottom-[17%] left-[20.5%] top-[16%] w-[59%] overflow-hidden rounded-t-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={t("home.heroName")} className="h-full w-full object-cover object-center" />
        {/* Darkens the bottom so the signature stays readable on light photos. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      </div>
      <span className="absolute bottom-[18%] left-[55%] -rotate-12 font-script text-[clamp(2rem,4.2vw,3.6rem)] leading-none text-cream drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
        Vidushi Ji
      </span>

      <ZodiacWheel className="animate-spin-slow absolute left-[9%] top-[10%] w-[24%] drop-shadow-[0_0_24px_rgba(199,161,122,0.45)]" />
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const home = useHomeContent();
  const tarot = useTarotContent();

  return (
    <div className="-mx-6 -my-8 overflow-x-clip bg-ink font-body text-cream">
      <section className="grid lg:grid-cols-2">
        <HeroArt image={home?.hero_image_url || DEFAULT_HERO_IMAGE} />

        <div className="flex items-center px-6 py-16 md:px-16 lg:px-[12%]">
          <div className="max-w-2xl">
            <h1 className="font-display text-[clamp(2.4rem,4.4vw,4.4rem)] uppercase leading-[1.08] tracking-[0.04em] text-gold">
              {home?.hero_title || t("tarot.heroTitle")}
            </h1>
            <p className="mt-6 font-display text-[clamp(1.15rem,1.7vw,1.45rem)] italic leading-snug text-cream">{tarot.tagline}</p>
            {home?.hero_text ? (
              <p className="mt-6 text-[1.1rem] leading-relaxed text-cream/85">{home.hero_text}</p>
            ) : (
              <>
                <p className="mt-6 text-[1.1rem] leading-relaxed text-cream/85">{t("tarot.heroIntro")}</p>
                <p className="mt-4 text-[1.1rem] leading-relaxed text-cream/85">{t("tarot.heroIntro2")}</p>
              </>
            )}
            <ul className="mt-8 flex flex-wrap gap-3">
              {tarot.badges.map((b, i) => (
                <li key={`${b}-${i}`} className="flex items-center gap-2 border border-line px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-cream/80">
                  <Sparkle className="h-2.5 w-2.5 text-gold" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-4">
              <BookConsultationButton
                preset={{ kind: "tarot" }}
                className="inline-flex items-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold"
              >
                <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
                {t("tarot.ctaBook")}
              </BookConsultationButton>
              <BookConsultationButton
                preset={{ kind: "ritual" }}
                className="inline-flex items-center gap-3 border border-cream/40 px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream transition-colors hover:border-gold hover:text-gold"
              >
                <Sparkle className="h-3.5 w-3.5 text-gold" />
                {t("rituals.ctaEnquire")}
              </BookConsultationButton>
            </div>
          </div>
        </div>
      </section>

      <AboutSection />
      <TarotServices />
      <ProductSlider category="bracelet" title={t("home.braceletsTitle")} subtitle={t("home.braceletsSubtitle")} />
      <Stats />
      <Testimonials />
    </div>
  );
}
