"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CallView from "@/components/call/CallView";
import { hostCallApi, hostChatApi } from "../../../../_lib/api";

// Vidushi Ji joins the call as host, using the admin API and session.
export default function HostCallPage() {
  const params = useParams<{ id: string }>();
  const [mode, setMode] = useState<"audio" | "video" | null>(null);
  const api = useMemo(() => hostCallApi(params.id), [params.id]);
  const chatApi = useMemo(() => hostChatApi(params.id), [params.id]);

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    const id = requestAnimationFrame(() => setMode(m === "audio" ? "audio" : "video"));
    return () => cancelAnimationFrame(id);
  }, []);

  return mode ? <CallView api={api} chatApi={chatApi} mode={mode} backHref="/admin/bookings" /> : null;
}
