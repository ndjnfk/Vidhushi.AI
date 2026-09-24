"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getConsultationMessages, sendConsultationMessage, type ConsultationMessageOut } from "@/lib/astrologers";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const POLL_INTERVAL_MS = 4000;

export default function ConsultationChatPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ConsultationMessageOut[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const msgs = await getConsultationMessages(params.id);
        if (!cancelled) setMessages(msgs);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load messages");
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const draft = text;
    setText("");
    try {
      const sent = await sendConsultationMessage(params.id, draft);
      setMessages((prev) => [...prev, sent]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send message");
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg h-[70vh]">
      <h1 className="text-xl font-bold">{t("consultations.pageTitle")}</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex-1 border rounded p-4 overflow-y-auto flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded px-3 py-2 text-sm ${
              m.sender === "user" ? "bg-orange-600 text-white self-end" : "bg-gray-100 self-start"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("consultations.messagePlaceholder")}
        />
        <button type="submit" className="bg-orange-600 text-white rounded px-4 py-2">{t("consultations.sendButton")}</button>
      </form>
    </div>
  );
}
