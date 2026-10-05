"use client";

import { useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createLiveResource } from "@/lib/live";
import type { Channel } from "@/lib/bookings";
import { RITUAL_INTENTIONS } from "@/lib/offerings";

export interface RitualIntentionItem {
  id: string; // links use it (?book=ritual:<id>)
  name: string;
  price?: number | null; // rupees; null = no price shown
  price_usd?: number | null; // optional, shown next to the rupee price
  channels?: Channel[]; // what a client booking it gets once confirmed; default chat only
}

// Rituals page content, edited in the admin panel ("Rituals page").
// Empty text / empty lists / no image mean "use the built-in default".
export interface RitualsContent {
  hero_title: string;
  hero_text: string;
  charges_note: string;
  hero_image_url: string | null; // null = the built-in diya/temple illustration
  intentions_title: string;
  intentions_subtitle: string;
  intentions: RitualIntentionItem[];
  urgent_title: string;
  urgent_lead: string;
  urgent_body: string;
  how_title: string;
  how_intro: string;
  steps: string[];
}

/** The original content, in the visitor's language. */
export function defaultRitualsContent(t: (k: string) => string): RitualsContent {
  return {
    hero_title: t("rituals.pageTitle"),
    hero_text: t("rituals.pageSubtitle"),
    charges_note: t("rituals.chargesNote"),
    hero_image_url: null,
    intentions_title: t("rituals.intentionsTitle"),
    intentions_subtitle: t("rituals.intentionsSubtitle"),
    intentions: RITUAL_INTENTIONS.map((id) => ({ id, name: t(`rituals.intention.${id}`) })),
    urgent_title: t("rituals.urgentTitle"),
    urgent_lead: t("rituals.urgentLead"),
    urgent_body: t("rituals.urgentBody"),
    how_title: t("rituals.howTitle"),
    how_intro: t("rituals.howIntro"),
    steps: ["rituals.step1", "rituals.step2", "rituals.step3", "rituals.step4"].map(t),
  };
}

/** Admin values where set, built-in defaults everywhere else. */
export function resolveRitualsContent(saved: RitualsContent | null, t: (k: string) => string): RitualsContent {
  const d = defaultRitualsContent(t);
  if (!saved) return d;
  const out = { ...d };
  for (const k of Object.keys(d) as (keyof RitualsContent)[]) {
    const v = saved[k];
    if (typeof v === "string" ? v.trim() : Array.isArray(v) && v.length > 0) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

const useSavedRitualsContent = createLiveResource(
  "home",
  () => apiFetch<RitualsContent>("/site/rituals"),
  "vidushiji_rituals_v1",
);

/** Never blank: saved content → last cached copy → built-in defaults. */
export function useRitualsContent(): RitualsContent {
  const saved = useSavedRitualsContent();
  const { t } = useLanguage();
  return useMemo(() => resolveRitualsContent(saved, t), [saved, t]);
}
