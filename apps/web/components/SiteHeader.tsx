"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Planet from "@/components/Planet";
import LanguageMenu from "@/components/LanguageMenu";
import ProfileMenu from "@/components/ProfileMenu";
import Sparkle from "@/components/Sparkle";
import SocialIcons from "@/components/SocialIcons";
import Starfield from "@/components/Starfield";
import { clearToken, isLoggedIn } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/languages";
import { CONTACT_ICONS } from "@/lib/site";
import { telHref, useSiteInfo } from "@/lib/useSiteInfo";
import { useCart } from "@/lib/CartContext";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";

// Shown inline on wide screens; the drawer (mobile) adds home and about.
const PRIMARY_NAV = [
  { href: "/kundli", key: "nav.kundli" },
  { href: "/matching", key: "nav.matching" },
  { href: "/rituals", key: "nav.rituals" },
  { href: "/shop", key: "nav.shop" },
];

const DRAWER_NAV = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  ...PRIMARY_NAV,
];

const ICON_BUTTON =
  "relative flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-cream/35 text-cream transition-colors hover:border-gold hover:text-gold md:h-[60px] md:w-[60px]";

function ContactIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className="h-6 w-6 shrink-0 text-gold" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const pathname = usePathname();
  const site = useSiteInfo();
  const { itemCount, openCart } = useCart();
  useLockBodyScroll(menuOpen);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    window.location.href = "/";
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink font-body text-cream">
      <div className="flex items-center justify-between gap-6 px-5 py-4 md:px-14 md:py-6">
        <Link href="/" className="relative shrink-0 whitespace-nowrap pr-4 font-logo text-[1.6rem] leading-none tracking-[0.04em] text-cream md:text-[1.9rem]">
          VIDUSHI JI
          <Sparkle className="absolute -top-1.5 right-0 h-3.5 w-3.5 text-cream md:h-4 md:w-4" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-8 xl:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2 whitespace-nowrap text-[13px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:text-gold ${
                isActive(item.href) ? "text-cream" : "text-cream/90"
              }`}
            >
              <Sparkle className="h-2.5 w-2.5 text-gold" />
              <span className={isActive(item.href) ? "border-b border-cream pb-0.5" : "pb-0.5"}>{t(item.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 md:gap-5">
          <button
            type="button"
            onClick={openCart}
            aria-label={`${t("nav.cart")} (${itemCount})`}
            className={ICON_BUTTON}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-6 w-6" aria-hidden="true">
              <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
              {itemCount}
            </span>
          </button>
          {loggedIn ? (
            <ProfileMenu buttonClass={ICON_BUTTON} onLogout={handleLogout} />
          ) : (
            <Link
              href={`/account/login?next=${encodeURIComponent(pathname)}`}
              className="hidden items-center gap-2 border border-cream/40 px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.14em] text-cream transition-colors hover:border-gold hover:text-gold xl:inline-flex"
            >
              <Sparkle className="h-3 w-3 text-gold" />
              {t("nav.login")}
            </Link>
          )}
          <LanguageMenu className="hidden xl:block" />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("nav.menu")}
            aria-expanded={menuOpen}
            className={`${ICON_BUTTON} xl:hidden`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-7 w-7 text-gold" aria-hidden="true">
              <path d="M12 1v22M1 12h22M4.5 4.5l15 15M19.5 4.5l-15 15" />
              <circle cx="12" cy="12" r="2.2" fill="var(--color-ink)" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label={t("nav.close")} onClick={() => setMenuOpen(false)} className="absolute inset-0 bg-black/60" />
          <aside className="no-scrollbar absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto overflow-x-hidden overscroll-contain border-l border-line bg-ink">
            {/* Clipped layer so the half-hidden moon doesn't add scroll height. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <Starfield seed={19} />
              <Planet className="absolute -bottom-[12%] -right-[38%] w-[90%]" />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label={t("nav.close")}
              className="absolute right-6 top-6 z-10 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-dashed border-cream/35 text-gold transition-colors hover:border-gold"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6" aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>

            <div className="relative flex flex-col px-8 pb-16 pt-28 md:px-20 xl:pt-36">
              <span className="relative self-start whitespace-nowrap pr-5 font-logo text-[2.4rem] leading-none tracking-[0.04em]">
                VIDUSHI JI
                <Sparkle className="absolute -top-2 right-0 h-4 w-4" />
              </span>
              <p className="mt-6 text-[15px] font-semibold text-cream">{t("nav.tagline")}</p>

              {/* Desktop shows the nav inline in the header, so the drawer only needs it below xl. */}
              <nav className="mt-10 flex flex-col gap-5 xl:hidden">
                {DRAWER_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 font-display text-xl uppercase tracking-[0.08em] hover:text-gold ${
                      isActive(item.href) ? "text-gold" : "text-cream"
                    }`}
                  >
                    <Sparkle className="h-3 w-3 text-gold" />
                    {t(item.key)}
                  </Link>
                ))}
              </nav>

              <ul className="mt-14 flex flex-col gap-7 text-[13px] font-extrabold uppercase tracking-[0.04em]">
                {site.phone && (
                  <li>
                    <a href={telHref(site.phone)} className="flex items-center gap-4 hover:text-gold">
                      <ContactIcon d={CONTACT_ICONS.phone} />
                      {t("nav.call")} {site.phone}
                    </a>
                  </li>
                )}
                {site.email && (
                  <li>
                    <a href={`mailto:${site.email}`} className="flex items-center gap-4 break-all hover:text-gold">
                      <ContactIcon d={CONTACT_ICONS.mail} />
                      {site.email}
                    </a>
                  </li>
                )}
                {site.address && (
                  <li className="flex items-center gap-4">
                    <ContactIcon d={CONTACT_ICONS.pin} />
                    {site.address}
                  </li>
                )}
              </ul>
              <SocialIcons links={site.social_links} className="mt-8" />

              <div className="mt-14 flex max-w-[260px] flex-col gap-4 text-sm">
                {loggedIn && (
                  <>
                    <Link href="/bookings" onClick={() => setMenuOpen(false)} className="font-bold uppercase tracking-[0.12em] hover:text-gold">
                      {t("nav.myBookings")}
                    </Link>
                    <Link href="/orders" onClick={() => setMenuOpen(false)} className="font-bold uppercase tracking-[0.12em] hover:text-gold">
                      {t("nav.myOrders")}
                    </Link>
                  </>
                )}
                {loggedIn ? (
                  <button type="button" onClick={handleLogout} className="text-left font-bold uppercase tracking-[0.12em] hover:text-gold">
                    {t("nav.logout")}
                  </button>
                ) : (
                  <Link href="/account/login" onClick={() => setMenuOpen(false)} className="font-bold uppercase tracking-[0.12em] hover:text-gold">
                    {t("nav.login")}
                  </Link>
                )}
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="rounded border border-line bg-ink px-3 py-2 text-cream"
                  aria-label="Language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.native}</option>
                  ))}
                </select>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
