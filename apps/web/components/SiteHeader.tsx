"use client";

import { useEffect, useState } from "react";
import { clearToken, isLoggedIn } from "@/lib/auth";
import { useCart } from "@/lib/CartContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/i18n/languages";

export default function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);
  const { locale, setLocale, t } = useLanguage();
  const { itemCount } = useCart();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    window.location.href = "/";
  }

  return (
    <header className="border-b px-6 py-4 flex items-center justify-between flex-wrap gap-2">
      <a href="/" className="font-bold text-lg text-orange-600">Vidushiji.ai</a>
      <nav className="flex gap-4 text-sm items-center flex-wrap">
        <a href="/kundli">{t("nav.kundli")}</a>
        <a href="/matching">{t("nav.matching")}</a>
        <a href="/tarot">{t("nav.tarot")}</a>
        <a href="/blog">{t("nav.blog")}</a>
        <a href="/poojas">{t("nav.poojas")}</a>
        <a href="/rituals">{t("nav.rituals")}</a>
        <a href="/astrologers">{t("nav.astrologers")}</a>
        <a href="/shop" className="relative">
          {t("nav.shop")}
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-orange-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </a>
        {loggedIn ? (
          <button onClick={handleLogout} className="text-gray-600">{t("nav.logout")}</button>
        ) : (
          <a href="/account/login">{t("nav.login")}</a>
        )}
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
          className="border rounded px-2 py-1 text-sm bg-white"
          aria-label="Language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.native}</option>
          ))}
        </select>
      </nav>
    </header>
  );
}
