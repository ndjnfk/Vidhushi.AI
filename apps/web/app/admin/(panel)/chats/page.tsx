"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ChatThread from "@/components/chat/ChatThread";
import StatusBadge from "@/components/booking/StatusBadge";
import { formatSlot, parseUtc } from "@/lib/bookings";
import type { ChatConversationOut } from "@/lib/chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { hostChatApi, listConversations } from "../../_lib/api";

function ago(iso: string) {
  const d = parseUtc(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Inbox: every client's conversation separately, newest activity first,
// with the selected thread alongside (stacked on mobile).
export default function AdminChatsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ChatConversationOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    listConversations().then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const raf = requestAnimationFrame(() => setSelected(id));
    load();
    const timer = setInterval(load, 10_000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [load]);

  function open(id: string | null) {
    setSelected(id);
    window.history.replaceState(null, "", id ? `/admin/chats?id=${id}` : "/admin/chats");
    // Opening a thread marks it read; refresh the unread badges shortly after.
    setTimeout(load, 800);
  }

  const current = rows?.find((r) => r.request.id === selected) ?? null;
  const api = useMemo(() => (selected ? hostChatApi(selected) : null), [selected]);

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[560px] flex-col px-5 py-8 md:h-screen md:px-10 md:py-10">
      <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.5vw,3rem)] uppercase tracking-[0.04em] text-gold">{t("chat.inboxTitle")}</h1>

      <div className="mt-6 flex min-h-0 flex-1 flex-col border border-line md:flex-row">
        {/* Conversation list */}
        <ul className={`no-scrollbar min-h-0 overflow-y-auto border-line md:w-[340px] md:shrink-0 md:border-r ${selected ? "hidden md:block" : "flex-1"}`}>
          {!rows ? (
            <li className="p-6 text-cream/60">{error ?? t("common.loading")}</li>
          ) : rows.length === 0 ? (
            <li className="p-6 text-cream/60">{t("chat.inboxEmpty")}</li>
          ) : (
            rows.map((c) => {
              const active = c.request.id === selected;
              return (
                <li key={c.request.id}>
                  <button type="button" onClick={() => open(c.request.id)}
                    className={`flex w-full gap-3 border-b border-line px-5 py-4 text-left transition-colors ${active ? "bg-gold/10" : "hover:bg-ink-soft"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 font-display text-sm uppercase text-gold">
                      {c.request.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate ${c.unread ? "font-bold text-cream" : "text-cream/90"}`}>{c.request.name}</span>
                        {c.last_message && <span className="shrink-0 text-[11px] text-cream/45">{ago(c.last_message.created_at)}</span>}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${c.unread ? "text-cream/85" : "text-cream/50"}`}>
                          {c.last_message
                            ? `${c.last_message.sender === "host" ? `${t("chat.you")}: ` : ""}${c.last_message.text}`
                            : t("chat.noMessagesYet")}
                        </span>
                        {c.unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-bold text-ink">{c.unread}</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        {/* Thread */}
        <section className={`min-h-0 flex-1 flex-col ${selected ? "flex" : "hidden md:flex"}`}>
          {current && api ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => open(null)} aria-label={t("call.back")} className="text-cream/70 hover:text-gold md:hidden">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                  </button>
                  <div>
                    <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{current.request.name}</p>
                    <p className="text-xs text-cream/55">
                      {t(`booking.topic.${current.request.topic}`)} · {formatSlot(current.request.scheduled_at)} · {current.request.phone}
                    </p>
                  </div>
                </div>
                <StatusBadge status={current.request.status} />
              </header>
              <ChatThread key={current.request.id} api={api} me="host" otherName={current.request.name} className="flex-1" />
            </>
          ) : (
            <p className="m-auto p-8 text-center text-cream/55">{selected && rows ? t("chat.notFound") : t("chat.pickConversation")}</p>
          )}
        </section>
      </div>
    </div>
  );
}
