"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CallView from "@/components/call/CallView";
import Starfield from "@/components/Starfield";
import { apiFetch } from "@/lib/api";
import { makeCallApi } from "@/lib/bookings";
import { makeChatApi } from "@/lib/chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CallPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"audio" | "video" | null>(null);
  const api = useMemo(() => makeCallApi(`/bookings/${params.id}`, apiFetch), [params.id]);
  const chatApi = useMemo(() => makeChatApi(`/bookings/${params.id}`, apiFetch), [params.id]);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    const id = requestAnimationFrame(() => setMode(m === "audio" ? "audio" : "video"));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={71} />
      {mode ? (
        <CallView api={api} chatApi={chatApi} mode={mode} backHref={`/bookings/${params.id}`} />
      ) : (
        <p className="relative p-16 text-center text-cream/70">{t("common.loading")}</p>
      )}
    </div>
  );
}
