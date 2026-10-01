import type { Metadata } from "next";

// Public origin used for canonical URLs, the sitemap and Open Graph tags.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidushiji.com").replace(/\/$/, "");
export const SITE_NAME = "Vidushi Ji";
export const DEFAULT_DESCRIPTION =
  "Vedic astrology and tarot by Vidushi Ji — free Kundli, Guna Milan matching, tarot readings, healing rituals, poojas and energised healing bracelets.";

// Per-route metadata: title, description, canonical and Open Graph in one go.
// The root layout's title template appends " | Vidushi Ji".
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: "website", locale: "en_IN" },
  };
}

// Account, checkout, bookings and other per-user pages stay out of search.
export const NO_INDEX: Metadata = { robots: { index: false, follow: true } };

// Server-side fetch for metadata and the sitemap. Never throws: a backend
// outage should degrade to generic metadata, not break the page.
export async function fetchPublic<T>(path: string): Promise<T | null> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${api}${path}`, { next: { revalidate: 3600 } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// Trims free text to a meta-description-sized snippet.
export function snippet(text: string, max = 155): string {
  const plain = text.replace(/[#*_>`\[\]()]/g, "").replace(/\s+/g, " ").trim();
  return plain.length <= max ? plain : `${plain.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
