"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import type { MeOut } from "@/lib/api";
import { adminMe, bookingCounts, messageCounts, orderCounts, unreadChats } from "../_lib/api";
import { clearAdminToken, getAdminToken } from "../_lib/session";
import ClearDataButton from "./ClearDataButton";

const NAV = [
  { href: "/admin/bookings", label: "Consultations", icon: "M4 4h16v16H4zM4 9h16M9 4v5" },
  { href: "/admin/rituals", label: "Ritual requests", icon: "M12 3c-2 3-4 4.5-4 7.5a4 4 0 0 0 8 0C16 7.5 14 6 12 3ZM12 14v7M8 21h8" },
  { href: "/admin/chats", label: "Chats", icon: "M4 5h16v11H8l-4 4V5Z" },
  { href: "/admin/orders", label: "Orders", icon: "M5 8h14l-1.2 12H6.2L5 8ZM9 10V6a3 3 0 0 1 6 0v4" },
  { href: "/admin/products", label: "Products", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18ZM12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z" },
  { href: "/admin/reviews", label: "Reviews", icon: "M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" },
  { href: "/admin/messages", label: "Messages", icon: "M3 6h18v12H3zM3 6l9 7 9-7" },
  { href: "/admin/home", label: "Home page", icon: "M3 11l9-8 9 8M5 10v10h14V10" },
  { href: "/admin/tarot", label: "Tarot sessions", icon: "M7 3h10v18H7zM12 8l1.2 2.6 2.8.4-2 2 .5 2.8L12 14.5 9.5 15.8l.5-2.8-2-2 2.8-.4z" },
  { href: "/admin/site", label: "Site settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" },
  { href: "/admin/payments", label: "Payments", icon: "M3 6h18v12H3zM3 10h18M7 15h3" },
];

// Signed-in admin chrome: sidebar (top bar on mobile) + auth guard.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [me, setMe] = useState<MeOut | null>(null);
  const [unread, setUnread] = useState(0);
  const [waiting, setWaiting] = useState(0); // new requests + "I have paid"
  const [ritualsWaiting, setRitualsWaiting] = useState(0);
  const [openOrders, setOpenOrders] = useState(0);
  const [newMessages, setNewMessages] = useState(0);

  useEffect(() => {
    if (!getAdminToken()) {
      window.location.replace(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // adminFetch redirects to the login screen if the session is invalid.
    adminMe().then(setMe).catch(() => {});
  }, []);

  // Unread chat badge; refreshed on navigation and every 15s.
  useEffect(() => {
    if (!me) return;
    const refresh = () => {
      unreadChats().then((r) => setUnread(r.unread)).catch(() => {});
      bookingCounts("consultation").then((c) => setWaiting(c.pending + c.payment_submitted)).catch(() => {});
      bookingCounts("ritual").then((c) => setRitualsWaiting(c.pending + c.payment_submitted)).catch(() => {});
      orderCounts().then((c) => setOpenOrders(c.open)).catch(() => {});
      messageCounts().then((c) => setNewMessages(c.unhandled)).catch(() => {});
    };
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [me, pathname]);

  function logout() {
    clearAdminToken();
    window.location.replace("/admin/login");
  }

  if (!me) {
    return <div className="flex min-h-screen items-center justify-center text-cream/60">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop: the sidebar stays put while the page scrolls; logout sits at its foot. */}
      <aside className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line bg-ink-soft px-5 py-4 md:sticky md:top-0 md:h-screen md:w-64 md:flex-col md:flex-nowrap md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-6 md:py-8">
        <div>
          <p className="relative inline-block whitespace-nowrap pr-4 font-logo text-xl tracking-[0.04em] md:text-2xl">
            VIDUSHI JI
            <Sparkle className="absolute -top-1 right-0 h-3 w-3" />
          </p>
          <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold">Admin panel</p>
        </div>

        <nav className="no-scrollbar order-last flex w-full gap-2 md:order-none md:mt-10 md:min-h-0 md:w-auto md:flex-1 md:flex-col md:overflow-y-auto">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                  active ? "bg-gold/15 text-gold" : "text-cream/75 hover:text-gold"}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
                  <path d={n.icon} />
                </svg>
                {n.label}
                {(() => {
                  const count = { "/admin/chats": unread, "/admin/bookings": waiting, "/admin/rituals": ritualsWaiting, "/admin/orders": openOrders, "/admin/messages": newMessages }[n.href] ?? 0;
                  return count > 0 ? (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink">{count}</span>
                  ) : null;
                })()}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 border-t border-line pt-5 md:mt-4 md:block">
          <p className="truncate text-xs text-cream/55" title={me.email}>{me.email}</p>
          <div className="mt-3">
            <ClearDataButton />
          </div>
          <button type="button" onClick={logout}
            className="mt-2 flex w-full items-center justify-center gap-2 border border-cream/30 px-3 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/80 transition-colors hover:border-gold hover:text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4" aria-hidden="true">
              <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11" />
            </svg>
            Log out
          </button>
        </div>
        <button type="button" onClick={logout} className="whitespace-nowrap text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75 hover:text-gold md:hidden">
          Log out
        </button>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
