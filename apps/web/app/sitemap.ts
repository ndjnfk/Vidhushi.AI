import type { MetadataRoute } from "next";
import type { BlogPostSummaryOut } from "@/lib/blog";
import type { RitualServiceOut } from "@/lib/rituals";
import { SITE_URL, fetchPublic } from "@/lib/seo";

// Rebuilt once a week (7 days), so new blog posts and rituals are added
// without a deploy.
export const revalidate = 604800;

const STATIC: [path: string, priority: number][] = [
  ["/", 1],
  ["/kundli", 0.9],
  ["/matching", 0.9],
  ["/rituals", 0.8],
  ["/pricing", 0.8],
  ["/shop", 0.8],
  ["/blog", 0.7],
  ["/reviews", 0.6],
  ["/about", 0.6],
  ["/contact", 0.5],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, rituals] = await Promise.all([
    fetchPublic<BlogPostSummaryOut[]>("/blog", revalidate),
    fetchPublic<RitualServiceOut[]>("/rituals", revalidate),
  ]);

  return [
    ...STATIC.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, priority })),
    ...(posts ?? []).map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: `${p.updated_at}Z`, priority: 0.6 })),
    ...(rituals ?? []).map((r) => ({ url: `${SITE_URL}/rituals/${r.id}`, priority: 0.6 })),
  ];
}
