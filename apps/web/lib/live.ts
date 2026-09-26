"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

// Live updates from the admin panel. The API streams a change counter per
// topic (GET /live); when one moves, pages watching that topic refetch.
//   site     — contact details / social links (Site settings)
//   home     — home & about page content (Home page editor)
//   products — the shop catalogue
//   me       — the signed-in user's bookings and orders
export type LiveTopic = "site" | "home" | "products" | "me";

const listeners = new Map<LiveTopic, Set<() => void>>();
let revs: Record<string, number> | null = null;
let conn: AbortController | null = null;

function emit(next: Record<string, number>) {
  // The first message only records where we are; later ones (including the
  // first after a reconnect) fire for whatever changed in between.
  if (revs) {
    for (const [topic, rev] of Object.entries(next)) {
      if (revs[topic] !== rev) listeners.get(topic as LiveTopic)?.forEach((fn) => fn());
    }
  }
  revs = next;
}

async function run(ctrl: AbortController) {
  let delay = 2000;
  while (!ctrl.signal.aborted) {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/live`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok || !res.body) throw new Error(`live ${res.status}`);
      delay = 2000;
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        let end;
        while ((end = buf.indexOf("\n\n")) >= 0) {
          const event = buf.slice(0, end);
          buf = buf.slice(end + 2);
          const data = event.split("\n").find((l) => l.startsWith("data: "));
          if (data) emit(JSON.parse(data.slice(6)));
        }
      }
    } catch {
      // fall through to the retry below
    }
    if (ctrl.signal.aborted) return;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 30_000);
  }
}

function connect() {
  conn?.abort();
  conn = new AbortController();
  void run(conn);
}

// Signing in or out changes which private topic ("me") we may watch.
function onAuthChange() {
  if (!conn) return;
  revs = null;
  connect();
  listeners.get("me")?.forEach((fn) => fn());
}

export function subscribeLive(topic: LiveTopic, fn: () => void): () => void {
  if (!listeners.has(topic)) listeners.set(topic, new Set());
  listeners.get(topic)!.add(fn);
  if (!conn) {
    connect();
    window.addEventListener("vidushiji:auth", onAuthChange);
  }
  return () => {
    listeners.get(topic)!.delete(fn);
    if ([...listeners.values()].every((s) => s.size === 0)) {
      conn?.abort();
      conn = null;
      revs = null;
      window.removeEventListener("vidushiji:auth", onAuthChange);
    }
  };
}

/** Calls `fn` whenever the admin changes something under `topic`. */
export function useLive(topic: LiveTopic, fn: () => void) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => subscribeLive(topic, () => ref.current()), [topic]);
}

const noopSubscribe = () => () => {};

/** Data shared by every component on the page: fetched once, refetched
 *  whenever its topic changes. With `cacheKey`, the last good response is
 *  kept in localStorage and shown while loading or whenever the API (or its
 *  database) is unreachable, so admin-edited content never goes blank. */
export function createLiveResource<T>(topic: LiveTopic, fetcher: () => Promise<T>, cacheKey?: string) {
  let value: T | null = null;
  let pending: Promise<void> | null = null;
  let stopLive: (() => void) | null = null;
  const subs = new Set<(v: T) => void>();

  // Parsed once per stored string, so useSyncExternalStore sees a stable value.
  let cachedRaw: string | null = null;
  let cachedValue: T | null = null;
  const readCache = (): T | null => {
    if (!cacheKey) return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = raw ? (JSON.parse(raw) as T) : null;
      }
    } catch {
      // storage blocked or corrupt: no cache
    }
    return cachedValue;
  };

  const load = () => {
    pending ??= fetcher()
      .then((v) => {
        value = v;
        if (cacheKey) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(v));
          } catch {
            // storage full or blocked: still show the fresh value
          }
        }
        subs.forEach((s) => s(v));
      })
      .catch(() => {})
      .finally(() => {
        pending = null;
      });
  };

  return function useResource(): T | null {
    // Server render and hydration see no cache; the client then picks it up.
    const cached = useSyncExternalStore(noopSubscribe, readCache, () => null);
    const [v, setV] = useState<T | null>(value);
    useEffect(() => {
      subs.add(setV);
      if (subs.size === 1) stopLive = subscribeLive(topic, load);
      if (value === null) load();
      else setV(value);
      return () => {
        subs.delete(setV);
        if (subs.size === 0) {
          stopLive?.();
          stopLive = null;
        }
      };
    }, []);
    return v ?? cached;
  };
}
