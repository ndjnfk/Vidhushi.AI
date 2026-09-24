"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ChatThread from "@/components/chat/ChatThread";
import Sparkle from "@/components/Sparkle";
import type { ChatApi } from "@/lib/chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCall, type CallApi, type CallState } from "@/lib/useCall";

function MediaView({ stream, muted, className, audioOnly }: { stream: MediaStream | null; muted?: boolean; className?: string; audioOnly?: boolean }) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return audioOnly ? <audio ref={ref} autoPlay /> : <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

function Elapsed({ since }: { since: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!since) return null;
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="tabular-nums">{`${Math.floor(s / 60)}`.padStart(2, "0")}:{`${s % 60}`.padStart(2, "0")}</span>;
}

const ROUND = "flex h-14 w-14 items-center justify-center rounded-full border transition-colors md:h-16 md:w-16";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const MIC = "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3";
const MIC_OFF = "M3 3l18 18M9 9v3a3 3 0 0 0 5 2.2M15 9.3V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11 5.7M19 11a7 7 0 0 1-.6 2.8M12 18v3";
const CAM = "M3 7h12v10H3zM15 10l6-3v10l-6-3";
const CAM_OFF = "M3 3l18 18M15 11V7H8M3 7v10h12v-1M15 10l6-3v10l-2-1";
const CHAT = "M4 5h16v11H8l-4 4V5Z";
const FULL = "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
const FULL_EXIT = "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5";
const HANG = "M3 15c5-5 13-5 18 0l-2 3-4-1v-3a10 10 0 0 0-6 0v3l-4 1Z";

// The in-call screen, shared by the client (/bookings/[id]/call) and the
// host (/admin/bookings/[id]/call). `api` decides which side we are.
export default function CallView({ api, chatApi, mode, backHref }: { api: CallApi; chatApi?: ChatApi; mode: "audio" | "video"; backHref: string }) {
  const { t } = useLanguage();
  const call = useCall(api, mode);
  const [chatOpen, setChatOpen] = useState(false);
  // Fullscreen covers the whole call (video, preview, chat, controls).
  const root = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (document.fullscreenEnabled) root.current?.requestFullscreen().catch(() => {});
    else {
      // iPhone Safari has no element fullscreen; enlarge the remote video natively.
      const v = root.current?.querySelector("video") as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      v?.webkitEnterFullscreen?.();
    }
  };
  const other = call.info?.role === "host" ? call.info.request.name : "Vidushi Ji";
  const remoteHasVideo = (call.remoteStream?.getVideoTracks().length ?? 0) > 0;
  const showRemoteVideo = mode === "video" && remoteHasVideo && call.state === "connected";

  const blocking: Partial<Record<CallState, string>> = {
    "too-early": "call.tooEarly",
    "ended-window": "call.endedWindow",
    unavailable: "call.unavailable",
    "media-error": "call.mediaError",
    left: "call.left",
  };
  const blockKey = blocking[call.state];

  if (call.state === "loading" || blockKey) {
    return (
      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
        <Sparkle className="h-10 w-10 text-gold" />
        <p className="mt-8 text-lg leading-relaxed text-cream/90">{blockKey ? t(blockKey) : t("common.loading")}</p>
        {call.state === "unavailable" && call.error && <p className="mt-3 text-sm text-cream/55">{call.error}</p>}
        {blockKey && (
          <Link href={backHref}
            className="mt-10 inline-flex items-center gap-3 border border-cream/40 px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] hover:border-gold hover:text-gold">
            <Sparkle className="h-3.5 w-3.5 text-gold" />
            {t("call.back")}
          </Link>
        )}
      </div>
    );
  }

  const status =
    call.state === "connected" ? <Elapsed since={call.connectedAt} />
    : call.state === "peer-left" ? t("call.peerLeft")
    : call.state === "connecting" ? t("call.connecting")
    : t("call.waiting").replace("{name}", other);

  return (
    <div ref={root}
      className={full
        ? "flex h-screen w-screen flex-col bg-ink px-4 py-4 font-body text-cream md:px-8"
        : "relative mx-auto flex min-h-[calc(100vh-97px)] max-w-[1200px] flex-col px-4 py-8 md:px-10"}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-cream/65">
            {t(mode === "video" ? "call.videoCall" : "call.audioCall")}
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-[0.05em] text-gold md:text-3xl">{other}</h1>
        </div>
        <span className={`border px-3 py-1 text-sm ${call.state === "connected" ? "border-gold/60 text-gold" : "border-line text-cream/70"}`}>
          {status}
        </span>
      </div>

      <div className={`${full ? "mt-3" : "mt-6"} flex min-h-0 flex-1 flex-col gap-4 lg:flex-row`}>
      {/* Stage */}
      <div className="relative flex min-h-[320px] flex-1 items-center justify-center overflow-hidden border border-line bg-black/60">
        {showRemoteVideo ? (
          <MediaView stream={call.remoteStream}
            className={`h-full w-full object-contain ${full ? "absolute inset-0" : "max-h-[calc(100vh-340px)] min-h-[240px]"}`} />
        ) : (
          <div className="flex flex-col items-center py-20">
            <div className={`flex h-36 w-36 items-center justify-center rounded-full border border-gold/50 bg-ink-soft md:h-44 md:w-44 ${
              call.state === "connected" ? "shadow-[0_0_0_10px_rgba(199,161,122,0.08),0_0_60px_rgba(199,161,122,0.35)]" : "animate-pulse"}`}>
              <span className="font-display text-5xl uppercase text-gold">{other.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            </div>
            <p className="mt-6 text-cream/75">{status}</p>
          </div>
        )}
        {/* Remote audio always plays, even when its video isn't shown. */}
        {!showRemoteVideo && <MediaView stream={call.remoteStream} audioOnly />}

        {mode === "video" && call.hasCamera && (
          <div className="absolute bottom-4 right-4 aspect-video w-36 overflow-hidden border border-gold/40 bg-ink shadow-2xl md:w-56">
            <MediaView stream={call.localStream} muted className={`h-full w-full -scale-x-100 object-cover ${call.camOn ? "" : "opacity-0"}`} />
            {!call.camOn && <span className="absolute inset-0 flex items-center justify-center text-xs text-cream/60">{t("call.cameraOff")}</span>}
          </div>
        )}
      </div>
      {chatApi && chatOpen && (
        <ChatThread api={chatApi} me={call.info?.role === "host" ? "host" : "client"} otherName={other}
          className="h-[420px] border border-line bg-ink/90 lg:h-auto lg:w-[360px]" />
      )}
      </div>

      {call.error && <p className="mt-3 text-center text-sm text-red-400">{call.error}</p>}

      {/* Controls */}
      <div className={`${full ? "mt-3 pb-1" : "mt-6 pb-4"} flex items-center justify-center gap-4`}>
        <button type="button" onClick={call.toggleMic} aria-pressed={!call.micOn} aria-label={t(call.micOn ? "call.mute" : "call.unmute")}
          className={`${ROUND} ${call.micOn ? "border-cream/40 text-cream hover:border-gold hover:text-gold" : "border-gold bg-gold text-ink"}`}>
          <Icon d={call.micOn ? MIC : MIC_OFF} />
        </button>
        {mode === "video" && call.hasCamera && (
          <button type="button" onClick={call.toggleCam} aria-pressed={!call.camOn} aria-label={t(call.camOn ? "call.cameraOffBtn" : "call.cameraOnBtn")}
            className={`${ROUND} ${call.camOn ? "border-cream/40 text-cream hover:border-gold hover:text-gold" : "border-gold bg-gold text-ink"}`}>
            <Icon d={call.camOn ? CAM : CAM_OFF} />
          </button>
        )}
        {chatApi && (
          <button type="button" onClick={() => setChatOpen((o) => !o)} aria-pressed={chatOpen} aria-label={t("chat.title")}
            className={`${ROUND} ${chatOpen ? "border-gold bg-gold text-ink" : "border-cream/40 text-cream hover:border-gold hover:text-gold"}`}>
            <Icon d={CHAT} />
          </button>
        )}
        {mode === "video" && (
          <button type="button" onClick={toggleFull} aria-pressed={full} aria-label={t(full ? "call.exitFullscreen" : "call.fullscreen")}
            title={t(full ? "call.exitFullscreen" : "call.fullscreen")}
            className={`${ROUND} ${full ? "border-gold bg-gold text-ink" : "border-cream/40 text-cream hover:border-gold hover:text-gold"}`}>
            <Icon d={full ? FULL_EXIT : FULL} />
          </button>
        )}
        <button type="button" onClick={call.leave} aria-label={t("call.end")}
          className={`${ROUND} border-red-500 bg-red-600 text-white hover:bg-red-500`}>
          <Icon d={HANG} />
        </button>
      </div>
    </div>
  );
}
