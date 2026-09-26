"use client";

import Link from "next/link";
import Sparkle from "@/components/Sparkle";
import SocialIcons from "@/components/SocialIcons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CONTACT_ICONS } from "@/lib/site";
import { telHref, useSiteInfo } from "@/lib/useSiteInfo";

const COLUMNS: { title: string; links: { href: string; key: string }[] }[] = [
  {
    title: "footer.services",
    links: [
      { href: "/?book=1", key: "home.ctaBook" },
      { href: "/kundli", key: "nav.kundli" },
      { href: "/matching", key: "nav.matching" },
    ],
  },
  {
    title: "footer.explore",
    links: [
      { href: "/", key: "nav.home" },
      { href: "/about", key: "nav.about" },
      { href: "/shop", key: "nav.shop" },
      { href: "/reviews", key: "nav.reviews" },
      { href: "/contact", key: "nav.contact" },
    ],
  },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const site = useSiteInfo();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink font-body text-cream">
      <div className="relative mx-auto grid max-w-[1400px] grid-cols-2 gap-x-8 gap-y-12 px-6 pb-12 pt-20 md:grid-cols-4 md:px-16 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-12">
        {/* Brand */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <Link href="/" className="relative inline-block whitespace-nowrap pr-5 font-logo text-[2rem] leading-none tracking-[0.04em]">
            VIDUSHI JI
            <Sparkle className="absolute -top-1.5 right-0 h-4 w-4" />
          </Link>
          <p className="mt-5 max-w-xs leading-relaxed text-cream/70">{t("footer.tagline")}</p>
          <SocialIcons links={site.social_links} className="mt-6" />
        </div>

        {/* Link columns */}
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={t(col.title)}>
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-gold">{t(col.title)}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream/80 transition-colors hover:text-gold">{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact (only what the admin has switched on) */}
        {(site.phone || site.email || site.address || site.hours) && (
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-gold">{t("nav.contact")}</h2>
            <ul className="mt-5 flex flex-col gap-4 text-cream/80">
              {site.phone && (
                <li className="flex gap-3">
                  <Icon d={CONTACT_ICONS.phone} />
                  <a href={telHref(site.phone)} className="hover:text-gold">{site.phone}</a>
                </li>
              )}
              {site.email && (
                <li className="flex gap-3">
                  <Icon d={CONTACT_ICONS.mail} />
                  <a href={`mailto:${site.email}`} className="break-all hover:text-gold">{site.email}</a>
                </li>
              )}
              {site.address && (
                <li className="flex gap-3">
                  <Icon d={CONTACT_ICONS.pin} />
                  <span>{site.address}</span>
                </li>
              )}
              {site.hours && (
                <li className="flex gap-3">
                  <Icon d={CONTACT_ICONS.clock} />
                  <span>{site.hours}</span>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative border-t border-line">
        <p className="mx-auto max-w-[1400px] px-6 py-6 text-center text-sm text-cream/55 md:px-16">
          © {year} Vidushi Ji. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
