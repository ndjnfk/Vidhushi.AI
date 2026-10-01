import type { Metadata } from "next";

// Public origin used for canonical URLs, the sitemap and Open Graph tags.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://vidushiji.com").replace(/\/$/, "");
export const SITE_NAME = "Vidushi Ji";
export const DEFAULT_DESCRIPTION =
  "Vedic astrology and tarot by Vidushi Ji — free Kundli, Guna Milan matching, tarot readings, healing rituals and energised healing bracelets.";

// Per-route metadata: title, description, canonical and Open Graph in one go.
// The " | Vidushi Ji" suffix is added here rather than via the root layout's
// title template, which Next.js drops below any layout that sets a plain title.
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: { absolute: `${title} | ${SITE_NAME}` },
    description,
    alternates: { canonical: path },
    openGraph: { title: `${title} | ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, type: "website", locale: "en_IN" },
  };
}

// Account, checkout, bookings and other per-user pages stay out of search.
export const NO_INDEX: Metadata = { robots: { index: false, follow: true } };

// Server-side fetch for metadata and the sitemap. Never throws: a backend
// outage should degrade to generic metadata, not break the page.
export async function fetchPublic<T>(path: string, revalidate = 3600): Promise<T | null> {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${api}${path}`, { next: { revalidate } });
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

// Site-wide identity, rendered on every public page by app/(site)/layout.tsx.
export const SITE_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["en-IN", "hi-IN"],
      publisher: { "@id": `${SITE_URL}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: SITE_NAME,
      url: SITE_URL,
      jobTitle: "Vedic Astrologer & Tarot Reader",
      knowsAbout: ["Vedic astrology", "Kundli", "Guna Milan", "Tarot reading", "Healing rituals"],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#business`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESCRIPTION,
      areaServed: "IN",
      founder: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
