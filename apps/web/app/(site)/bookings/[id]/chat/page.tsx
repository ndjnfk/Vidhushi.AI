"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import ChatThread from "@/components/chat/ChatThread";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import { apiFetch } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { makeChatApi } from "@/lib/chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ClientChatPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const api = useMemo(() => makeChatApi(`/bookings/${params.id}`, apiFetch), [params.id]);

  useEffect(() => {
    if (!isLoggedIn()) window.location.href = `/account/login?next=${encodeURIComponent(`/bookings/${params.id}/chat`)}`;
  }, [params.id]);

  return (
    <div className="relative -mx-6 -my-8 overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={89} />
      <div className="relative mx-auto flex h-[calc(100vh-97px)] max-w-3xl flex-col px-4 py-6 md:px-6 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 font-display text-lg text-gold">VJ</div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/60">{t("chat.title")}</p>
              <h1 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">Vidushi Ji</h1>
            </div>
          </div>
          <Link href={`/bookings/${params.id}`} className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/75 hover:text-gold">
            <Sparkle className="h-2.5 w-2.5 text-gold" />
            {t("call.back")}
          </Link>
        </div>
        <ChatThread api={api} me="client" otherName="Vidushi Ji" className="mt-5 flex-1 border border-line bg-ink/85 backdrop-blur-sm" />
      </div>
    </div>
  );
}
