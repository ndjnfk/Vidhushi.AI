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
}

// Shared by the home and about sections; refreshes live when the admin
// saves the Home page editor.
export const useHomeContent = createLiveResource("home", () => apiFetch<HomeContent>("/site/home"), "vidushiji_home_v1");
