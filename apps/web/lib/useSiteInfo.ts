"use client";

import { apiFetch } from "@/lib/api";
import { createLiveResource } from "@/lib/live";

export type SocialPlatform = "instagram" | "facebook" | "youtube" | "x" | "whatsapp" | "linkedin" | "telegram" | "website";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

// Public contact details edited in the admin panel ("Site settings").
// Fields the admin switched off come back as empty strings.
export interface SiteInfo {
  phone: string;
  email: string;
  address: string;
  hours: string;
  whatsapp: string;
  social_links: SocialLink[];
}

const EMPTY: SiteInfo = { phone: "", email: "", address: "", hours: "", whatsapp: "", social_links: [] };

// Shared by the header, footer and contact page; refreshes live when the
// admin saves Site settings.
const useSiteResource = createLiveResource("site", () => apiFetch<SiteInfo>("/site"));

export function useSiteInfo(): SiteInfo {
  return useSiteResource() ?? EMPTY;
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
