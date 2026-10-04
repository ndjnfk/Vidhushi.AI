"use client";

import { apiFetch } from "@/lib/api";
import { createLiveResource } from "@/lib/live";

export interface HomeStat {
  label: string;
  value: number;
  suffix: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
  rating: number;
  photo_url: string | null;
}

export interface RateItem {
  name: string;
  price: number | null; // null = "price on request"
  price_usd?: number | null; // optional, shown next to the rupee price
}

// Home page sections the admin can switch off, in page order.
// Must match HOME_SECTIONS in apps/api/app/schemas/schemas.py.
export const HOME_SECTIONS = ["hero", "about", "rates", "bracelets", "stats", "areas", "modalities", "how", "reviews"] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];

// Home page content edited in the admin panel ("Home page"). Empty text
// fields mean "use the built-in translated default".
export interface HomeContent {
  hero_title: string;
  hero_text: string;
  hero_image_url: string | null;
  about_title: string;
  about_text: string;
  about_image1_url: string | null;
  about_image2_url: string | null;
  years_experience: number;
  stats: HomeStat[];
  testimonials: Testimonial[];
  story_title: string;
  story_text: string; // blank lines separate paragraphs
  values: { title: string; body: string }[]; // empty = built-in cards
  rates_title: string;
  rates_subtitle: string;
  rates: RateItem[]; // home page price list; empty = section hidden
  hidden_sections: HomeSection[];
  section_order: HomeSection[]; // empty = HOME_SECTIONS order
}

// Shared by the home and about sections; refreshes live when the admin
// saves the Home page editor.
export const useHomeContent = createLiveResource("home", () => apiFetch<HomeContent>("/site/home"), "vidushiji_home_v1");

// Every section in display order (the saved order, then any new ones).
export function sectionOrder(c: Pick<HomeContent, "section_order"> | null | undefined): HomeSection[] {
  const saved = (c?.section_order ?? []).filter((s) => HOME_SECTIONS.includes(s));
  return [...saved, ...HOME_SECTIONS.filter((s) => !saved.includes(s))];
}

// The sections the home page shows, in order.
export function useVisibleSections(): HomeSection[] {
  const c = useHomeContent();
  return sectionOrder(c).filter((s) => !c?.hidden_sections?.includes(s));
}
