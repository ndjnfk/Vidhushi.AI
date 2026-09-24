"use client";

import Link from "next/link";
import ArchScene from "@/components/ArchScene";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useHomeContent } from "@/lib/useHomeContent";

export const SERVICES = [
  { key: "about.serviceKundli", href: "/kundli" },
  { key: "about.serviceMatching", href: "/matching" },
  { key: "about.serviceTarot", href: "/tarot" },
  { key: "about.serviceBracelets", href: "/shop" },
];

// Faint dashed "constellation" behind the panels: spokes from a centre, crescents at the tips.
function Constellation({ className = "" }: { className?: string }) {
  const tips = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return [300 + Math.cos(a) * 270, 300 + Math.sin(a) * 270] as const;
  });
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <g fill="none" stroke="var(--color-gold)" strokeOpacity={0.2} strokeWidth={1.2} strokeDasharray="8 8">
        <polygon points={tips.map((p) => p.join(",")).join(" ")} />
        {tips.map(([x, y], i) => (
          <line key={i} x1={300} y1={300} x2={x} y2={y} />
        ))}
        {tips.map(([x, y], i) => {
          const [nx, ny] = tips[(i + 3) % tips.length];
          return <line key={`c${i}`} x1={x} y1={y} x2={nx} y2={ny} />;
        })}
      </g>
      {tips.filter((_, i) => i % 2 === 0).map(([x, y], i) => (
        <path
          key={i}
          d={`M${x + 6} ${y - 16}a17 17 0 1 0 0 32a21 21 0 0 1 0-32Z`}
          fill="var(--color-gold)"
          fillOpacity={0.22}
        />
      ))}
    </svg>
  );
}

// Two skewed image panels with a "years of experience" badge between them.
export function AboutArt() {
  const { t } = useLanguage();
  const home = useHomeContent();
  return (
    <div className="relative mx-auto aspect-[650/560] w-full max-w-[650px]">
      <Constellation className="pointer-events-none absolute left-1/2 top-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2" />
      <div
        className="absolute left-0 top-[24%] h-[68%] w-[48%] overflow-hidden"
        style={{ clipPath: "polygon(0 0, 100% 8%, 100% 92%, 0 100%)" }}
      >
        {home?.about_image1_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={home.about_image1_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ArchScene />
        )}
      </div>
      <div
        className="absolute right-0 top-[6%] h-[70%] w-[52%] overflow-hidden"
        style={{ clipPath: "polygon(0 8%, 100% 0, 100% 100%, 0 92%)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={home?.about_image2_url || home?.hero_image_url || "/home/hero.jpg"} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/20" />
      </div>
      <div className="absolute left-[37%] top-[40%] flex w-[29%] flex-col items-center justify-center border border-gold/40 bg-ink-soft px-3 py-7 text-center shadow-2xl">
        <span className="font-display text-[clamp(2.2rem,4vw,3.6rem)] leading-none text-gold">
          {home?.years_experience ?? 10}
          <sup className="ml-0.5 text-[0.45em]">+</sup>
        </span>
        <span className="mt-3 text-[13px] leading-snug text-cream/80">{t("about.yearsExperience")}</span>
      </div>
    </div>
  );
}

export default function AboutSection() {
  const { t } = useLanguage();
  const home = useHomeContent();
  return (
    <section className="relative overflow-hidden border-t border-line bg-ink px-6 py-24 font-body text-cream md:px-16 md:py-32 lg:px-[5%]">
      <div className="mx-auto grid max-w-[1500px] items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <AboutArt />

        <div>
          <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-gold">
            <Sparkle className="h-3 w-3" />
            {t("about.eyebrow")}
          </p>
          <h2 className="mt-5 font-display text-[clamp(2.2rem,3.8vw,3.8rem)] uppercase leading-[1.1] tracking-[0.04em] text-gold">
            {home?.about_title || t("about.title")}
          </h2>
          <p className="mt-6 max-w-2xl text-[1.1rem] leading-[1.8] text-cream/85">{home?.about_text || t("about.intro")}</p>

          <ul className="mt-10 grid max-w-xl gap-x-10 gap-y-4 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <li key={s.key}>
                <Link href={s.href} className="flex items-center gap-3 text-[1.05rem] transition-colors hover:text-gold">
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-gold" aria-hidden="true">
                    <path d="M2 11L7 4M6 12l5-7M10 13l5-7" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  {t(s.key)}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/about"
            className="mt-12 inline-flex items-center gap-3 bg-white px-9 py-5 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold"
          >
            <Sparkle className="h-3.5 w-3.5 text-gold-deep" />
            {t("about.readMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
