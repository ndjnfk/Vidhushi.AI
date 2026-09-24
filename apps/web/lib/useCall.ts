"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { CallInfoOut, CallSignalOut } from "@/lib/bookings";

// The signaling endpoints for one side of one booking (client or admin API).
export interface CallApi {
  getCallInfo: () => Promise<CallInfoOut>;
  sendSignal: (kind: CallSignalOut["kind"], data?: Record<string, unknown>) => Promise<CallSignalOut>;
  pollSignals: (after: string) => Promise<CallSignalOut[]>;
}

// One-to-one WebRTC call between the client and Vidushi Ji ("host"), with
// signaling relayed through the API (POST a signal, poll for the other side's).
//
// Protocol: each side posts "join" on entry. The host is always the offerer:
// when it sees the client's "join" it (re)creates the connection and sends an
// "offer". When the client sees the host's "join" it answers with its own
// "join" (the host may have arrived second and missed the first one). ICE
// candidates are trickled as "ice"; "bye" means the other side left.

export type CallState =
  | "loading"
  | "too-early"
  | "ended-window"
  | "unavailable"
  | "media-error"
  | "waiting"
  | "connecting"
  | "connected"
  | "peer-left"
  | "left";

const POLL_MS = 1000;

export function useCall(api: CallApi, mode: "audio" | "video") {
  const [state, setState] = useState<CallState>("loading");
  const [info, setInfo] = useState<CallInfoOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(mode === "video");
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const local = useRef<MediaStream | null>(null);
  // Camera/mic are opened once per mount and shared by React dev mode's
  // double effect run: opening the device twice and stopping the first
  // stream can end the second one's video track (browser race).
  const media = useRef<{ promise: Promise<MediaStream> | null; runs: number }>({ promise: null, runs: 0 });
  const alive = useRef(true);

  // Note: queued ICE candidates are kept. The other side's candidates can
  // reach us before its offer (they're POSTed concurrently); stale ones from
  // an earlier session are simply rejected by addIceCandidate.
  const closePeer = useCallback(() => {
    pc.current?.close();
    pc.current = null;
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    alive.current = true;
    // Per-run flag: React dev mode runs effects twice, and the first run's
    // async work must stop rather than keep a second poller alive.
    let stopped = false;
    const live = () => !stopped && alive.current;
    const m = media.current; // same object for the hook's lifetime
    m.runs++;
    let cursor = "";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let role: "client" | "host" = "client";
    let iceServers: RTCIceServer[] = [];

    function newPeer() {
      closePeer();
      const conn = new RTCPeerConnection({ iceServers });
      local.current?.getTracks().forEach((t) => conn.addTrack(t, local.current!));
      // The offerer must always offer to receive both kinds, even when it
      // isn't sending one itself (e.g. an audio-only host, video client).
      if (role === "host") {
        const kinds = new Set(local.current?.getTracks().map((t) => t.kind));
        if (!kinds.has("audio")) conn.addTransceiver("audio", { direction: "recvonly" });
        if (!kinds.has("video")) conn.addTransceiver("video", { direction: "recvonly" });
      }
      const remote = new MediaStream();
      setRemoteStream(remote);
      conn.ontrack = (e) => {
        remote.addTrack(e.track);
        setRemoteStream(new MediaStream(remote.getTracks()));
      };
      conn.onicecandidate = (e) => {
        if (e.candidate) api.sendSignal("ice", { candidate: e.candidate.toJSON() }).catch(() => {});
      };
      conn.onconnectionstatechange = () => {
        if (!live()) return;
        const s = conn.connectionState;
        if (s === "connected") {
          setState("connected");
          setConnectedAt((t) => t ?? Date.now());
        } else if (s === "failed") {
          setError("Connection failed. One of you may be behind a strict network; try another network.");
          setState("peer-left");
        } else if (s === "disconnected") {
          setState("connecting");
        }
      };
      pc.current = conn;
      return conn;
    }

    async function flushIce() {
      const conn = pc.current;
      if (!conn?.remoteDescription) return;
      for (const c of pendingIce.current.splice(0)) await conn.addIceCandidate(c).catch(() => {});
    }

    async function handle(sig: CallSignalOut) {
      if (sig.kind === "join") {
        if (role === "host") {
          setState("connecting");
          const conn = newPeer();
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          await api.sendSignal("offer", { type: offer.type, sdp: offer.sdp });
        } else {
          await api.sendSignal("join");
        }
      } else if (sig.kind === "offer" && role === "client") {
        setState("connecting");
        const conn = newPeer();
        await conn.setRemoteDescription(sig.data as unknown as RTCSessionDescriptionInit);
        await flushIce();
        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        await api.sendSignal("answer", { type: answer.type, sdp: answer.sdp });
      } else if (sig.kind === "answer" && role === "host" && pc.current?.signalingState === "have-local-offer") {
        await pc.current.setRemoteDescription(sig.data as unknown as RTCSessionDescriptionInit);
        await flushIce();
      } else if (sig.kind === "ice") {
        pendingIce.current.push(sig.data.candidate as RTCIceCandidateInit);
        await flushIce();
      } else if (sig.kind === "bye") {
        closePeer();
        pendingIce.current = [];
        setConnectedAt(null);
        setState("peer-left");
      }
    }

    async function poll() {
      if (!live()) return;
      try {
        const signals = await api.pollSignals(cursor);
        for (const s of signals) {
          cursor = s.id;
          await handle(s);
        }
      } catch {
        // transient network error: keep polling
      }
      if (live()) timer = setTimeout(poll, POLL_MS);
    }

    (async () => {
      let callInfo: CallInfoOut;
      try {
        callInfo = await api.getCallInfo();
      } catch (e) {
        if (!live()) return;
        if (e instanceof ApiError && e.status === 425) setState("too-early");
        else if (e instanceof ApiError && e.status === 410) setState("ended-window");
        else {
          setError(e instanceof ApiError ? e.detail : String(e));
          setState("unavailable");
        }
        return;
      }
      role = callInfo.role;
      iceServers = callInfo.ice_servers;
      setInfo(callInfo);

      try {
        m.promise ??= (async () => {
          try {
            return await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
          } catch (err) {
            if (mode !== "video") throw err;
            setCamOn(false);
            return navigator.mediaDevices.getUserMedia({ audio: true }); // no camera: fall back to audio
          }
        })();
        const stream = await m.promise;
        if (!live()) return; // the surviving run (or unmount) owns the stream
        local.current = stream;
        setLocalStream(stream);
      } catch {
        setState("media-error");
        return;
      }

      if (!live()) return;
      const join = await api.sendSignal("join");
      cursor = join.id;
      setState((s) => (s === "loading" ? "waiting" : s));
      poll();
    })();

    const onUnload = () => {
      // Best effort so the other side learns we left.
      api.sendSignal("bye").catch(() => {});
    };
    window.addEventListener("pagehide", onUnload);

    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("pagehide", onUnload);
      if (local.current) api.sendSignal("bye").catch(() => {});
      closePeer();
      m.runs--;
      // Stop the devices only if no new run started (i.e. a real unmount).
      setTimeout(() => {
        if (m.runs > 0 || !m.promise) return;
        const pending = m.promise;
        m.promise = null;
        local.current = null;
        pending.then((st) => st.getTracks().forEach((t) => t.stop())).catch(() => {});
      }, 0);
    };
  }, [api, mode, closePeer]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    local.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const tracks = local.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;
    const next = !camOn;
    tracks.forEach((t) => (t.enabled = next));
    setCamOn(next);
  }, [camOn]);

  const leave = useCallback(() => {
    alive.current = false;
    api.sendSignal("bye").catch(() => {});
    closePeer();
    local.current?.getTracks().forEach((t) => t.stop());
    local.current = null;
    media.current.promise = null;
    setLocalStream(null);
    setState("left");
  }, [api, closePeer]);

  return {
    state, info, error, localStream, remoteStream, micOn, camOn, connectedAt,
    hasCamera: (localStream?.getVideoTracks().length ?? 0) > 0,
    toggleMic, toggleCam, leave,
  };
}
