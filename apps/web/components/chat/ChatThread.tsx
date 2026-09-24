"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { parseUtc } from "@/lib/bookings";
import type { ChatApi, ChatMessageOut } from "@/lib/chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const POLL_MS = 3000;

function time(iso: string) {
  return parseUtc(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

function day(iso: string) {
  return parseUtc(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

// A live chat thread for one booking. `me` decides which bubbles are ours;
// the same component serves the client page, the admin inbox and the
// side panel inside a call.
export default function ChatThread({
  api,
  me,
  otherName,
  className = "",
}: {
  api: ChatApi;
  me: "client" | "host";
  otherName: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessageOut[] | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursor = useRef<string | undefined>(undefined);
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep scrolled to the bottom unless the reader scrolled up

  const merge = useCallback((incoming: ChatMessageOut[]) => {
    if (!incoming.length) return;
    cursor.current = incoming[incoming.length - 1].id;
    setMessages((prev) => {
      const seen = new Set((prev ?? []).map((m) => m.id));
      return [...(prev ?? []), ...incoming.filter((m) => !seen.has(m.id))];
    });
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    cursor.current = undefined;

    async function poll(first: boolean) {
      try {
        const res = await api.thread(first ? undefined : cursor.current);
        if (stopped) return;
        if (first) setMessages([]);
        setCanSend(res.can_send);
        merge(res.messages);
        setError(null);
      } catch (e) {
        if (!stopped && first) setError(e instanceof Error ? e.message : String(e));
      }
      if (!stopped) timer = setTimeout(() => poll(false), POLL_MS);
    }
    poll(true);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [api, merge]);

  useEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const m = await api.send(body);
      stick.current = true;
      merge([m]);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div
        ref={list}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-5 md:px-6"
        aria-live="polite"
      >
        {messages === null ? (
          <p className="m-auto text-sm text-cream/55">{error ?? t("common.loading")}</p>
        ) : messages.length === 0 ? (
          <div className="m-auto flex max-w-xs flex-col items-center text-center">
            <Sparkle className="h-6 w-6 text-gold/70" />
            <p className="mt-4 text-sm text-cream/65">{t(me === "client" ? "chat.emptyClient" : "chat.emptyHost").replace("{name}", otherName)}</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender === me;
            const newDay = i === 0 || day(messages[i - 1].created_at) !== day(m.created_at);
            return (
              <div key={m.id} className="flex flex-col">
                {newDay && (
                  <span className="mx-auto my-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/45">{day(m.created_at)}</span>
                )}
                <div className={`max-w-[82%] ${mine ? "self-end" : "self-start"}`}>
                  <p className={`whitespace-pre-wrap break-words px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                    mine ? "bg-gold text-ink" : "border border-line bg-ink-soft text-cream"}`}>
                    {m.text}
                  </p>
                  <p className={`mt-1 text-[11px] text-cream/45 ${mine ? "text-right" : ""}`}>
                    {time(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {canSend ? (
        <form onSubmit={send} className="flex items-end gap-3 border-t border-line p-3 md:p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder={t("chat.placeholder")}
            aria-label={t("chat.placeholder")}
            className="max-h-32 min-h-[48px] flex-1 resize-none border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/45 focus:border-gold"
          />
          <button type="submit" disabled={sending || !text.trim()} aria-label={t("chat.send")}
            className="flex h-12 w-12 shrink-0 items-center justify-center bg-white text-ink transition-colors hover:bg-gold disabled:opacity-40">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
              <path d="M4 12l16-8-6 16-2-7-8-1Z" />
            </svg>
          </button>
        </form>
      ) : (
        messages !== null && <p className="border-t border-line p-4 text-center text-sm text-cream/55">{t("chat.closed")}</p>
      )}
      {error && messages !== null && <p className="px-4 pb-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
