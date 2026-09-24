"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getMe } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Round profile button for signed-in visitors, with a small account menu.
export default function ProfileMenu({ buttonClass, onLogout }: { buttonClass: string; onLogout: () => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMe().then((me) => setEmail(me.email)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = email?.[0]?.toUpperCase();
  const item = "block w-full px-5 py-3 text-left text-[13px] font-extrabold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-ink hover:text-gold";

  return (
    <div ref={root} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        aria-label={t("nav.profile")} className={buttonClass}>
        {initial ? (
          <span className="font-display text-xl text-gold">{initial}</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-6 w-6" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
        )}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-3 w-64 border border-line bg-ink-soft py-2 shadow-2xl">
          {email && (
            <p className="truncate border-b border-line px-5 pb-3 pt-1 text-sm text-cream/65" title={email}>
              {email}
            </p>
          )}
          <Link role="menuitem" href="/bookings" onClick={() => setOpen(false)} className={item}>
            {t("nav.myBookings")}
          </Link>
          <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={item}>
            {t("nav.myOrders")}
          </Link>
          <button role="menuitem" type="button" onClick={onLogout} className={item}>
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
