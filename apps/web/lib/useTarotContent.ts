"use client";

import { useMemo } from "react";
import { apiFetch } from "@/lib/api";
import type { Channel } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createLiveResource } from "@/lib/live";
import { MODALITIES, TAROT_SESSIONS } from "@/lib/offerings";

export type SessionGroup = "call" | "reading" | "area";

// What the customer can use once a booking for the session is confirmed.
export const CHANNELS: Channel[] = ["chat", "audio", "video"];

export interface TarotSessionItem {
  id: string; // booking links use it (?book=tarot:<id>)
  group: SessionGroup;
  name: string;
  description: string;
  price: number | null; // null = price on request
  tag: string;
  channels: Channel[];
}

export interface TarotModalityItem {
  name: string;
  icon: string;
}

export interface TarotStepItem {
  title: string;
  body: string;
  items: string[];
}

// Home page tarot sections, edited in the admin panel ("Tarot sessions").
// Empty text / empty lists mean "use the built-in translated default".
export interface TarotContent {
  tagline: string;
  badges: string[];
  sessions_title: string;
  sessions_subtitle: string;
  sessions: TarotSessionItem[];
  areas_title: string;
  areas_subtitle: string;
  areas_note: string;
  modalities_title: string;
  modalities_intro: string;
  modalities_note: string;
  modalities: TarotModalityItem[];
  how_title: string;
  steps: TarotStepItem[];
  how_note: string;
}

export const EMPTY_TAROT_CONTENT: TarotContent = {
  tagline: "", badges: [], sessions_title: "", sessions_subtitle: "", sessions: [],
  areas_title: "", areas_subtitle: "", areas_note: "",
  modalities_title: "", modalities_intro: "", modalities_note: "", modalities: [],
  how_title: "", steps: [], how_note: "",
};

// Icons the site can draw (components/tarot/OfferingIcon.tsx).
export const TAROT_ICONS = [...MODALITIES, "any", "love", "career", "health"] as const;

const CALL_MINUTES: Record<string, number> = { "call-15": 15, "call-30": 30, "call-60": 60, video: 0 };

/** The original content, in the visitor's language. */
export function defaultTarotContent(t: (k: string) => string): TarotContent {
  return {
    tagline: t("tarot.heroTagline"),
    badges: [t("tarot.badgeOneOnOne"), t("tarot.badgeIndia"), t("tarot.badgeModalities")],
    sessions_title: t("tarot.sessionsTitle"),
    sessions_subtitle: t("tarot.sessionsSubtitle"),
    sessions: TAROT_SESSIONS.map((s) => {
      const minutes = CALL_MINUTES[s.id];
      return {
        id: s.id,
        group: s.group,
        name: t(`${s.key}.name`),
        description: t(`${s.key}.desc`),
        price: s.price,
        tag: minutes === undefined ? "" : minutes ? `${minutes} ${t("booking.minutes")}` : t("tarot.tagVideo"),
        channels: [...CHANNELS],
      };
    }),
    areas_title: t("tarot.areasTitle"),
    areas_subtitle: t("tarot.areasSubtitle"),
    areas_note: t("tarot.areasNote"),
    modalities_title: t("tarot.modalitiesTitle"),
    modalities_intro: t("tarot.modalitiesIntro"),
    modalities_note: t("tarot.modalitiesNote"),
    modalities: MODALITIES.map((m) => ({ name: t(`modality.${m}`), icon: m })),
    how_title: t("tarot.howTitle"),
    steps: [
      { title: t("tarot.step1Title"), body: t("tarot.step1Body"), items: [] },
      { title: t("tarot.step2Title"), body: t("tarot.step2Body"), items: [] },
      {
        title: t("tarot.step3Title"),
        body: t("tarot.step3Body"),
        items: [t("tarot.step3Name"), t("tarot.step3Dob"), t("tarot.step3City"), t("tarot.step3Questions")],
      },
    ],
    how_note: t("tarot.step3Note"),
  };
}

/** Admin values where set, built-in defaults everywhere else. */
export function resolveTarotContent(saved: TarotContent | null, t: (k: string) => string): TarotContent {
  const d = defaultTarotContent(t);
  if (!saved) return d;
  const out = { ...d };
  for (const k of Object.keys(d) as (keyof TarotContent)[]) {
    const v = saved[k];
    if (typeof v === "string" ? v.trim() : Array.isArray(v) && v.length > 0) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

const useSavedTarotContent = createLiveResource(
  "home",
  () => apiFetch<TarotContent>("/site/tarot"),
  "vidushiji_tarot_v1",
);

/** Never blank: saved content → last cached copy → built-in defaults. */
export function useTarotContent(): TarotContent {
  const saved = useSavedTarotContent();
  const { t } = useLanguage();
  return useMemo(() => resolveTarotContent(saved, t), [saved, t]);
}
