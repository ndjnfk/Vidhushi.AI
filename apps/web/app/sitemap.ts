import type { MetadataRoute } from "next";
import type { AstrologerOut } from "@/lib/astrologers";
import type { BlogPostSummaryOut } from "@/lib/blog";
import type { PoojaServiceOut } from "@/lib/poojas";
import type { RitualServiceOut } from "@/lib/rituals";
import { SITE_URL, fetchPublic } from "@/lib/seo";

// Rebuilt hourly so new blog posts, rituals and poojas show up without a deploy.
export const revalidate = 3600;

const STATIC: [path: string, priority: number][] = [
  ["/", 1],
  ["/kundli", 0.9],
  ["/matching", 0.9],
  ["/tarot", 0.9],
  ["/rituals", 0.8],
  ["/pricing", 0.8],
  ["/shop", 0.8],
  ["/poojas", 0.7],
  ["/astrologers", 0.7],
  ["/blog", 0.7],
  ["/reviews", 0.6],
  ["/about", 0.6],
  ["/contact", 0.5],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, rituals, poojas, astrologers] = await Promise.all([
    fetchPublic<BlogPostSummaryOut[]>("/blog"),
    fetchPublic<RitualServiceOut[]>("/rituals"),
    fetchPublic<PoojaServiceOut[]>("/poojas"),
    fetchPublic<AstrologerOut[]>("/astrologers"),
  ]);

  return [
    ...STATIC.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, priority })),
    ...(posts ?? []).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.created_at, priority: 0.6 })),
    ...(rituals ?? []).map((r) => ({ url: `${SITE_URL}/rituals/${r.id}`, priority: 0.6 })),
    ...(poojas ?? []).map((p) => ({ url: `${SITE_URL}/poojas/${p.id}`, priority: 0.6 })),
    ...(astrologers ?? []).map((a) => ({ url: `${SITE_URL}/astrologers/${a.id}`, priority: 0.5 })),
  ];
}
