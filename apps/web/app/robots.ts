import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // Account, checkout and booking pages are reachable for crawlers but carry
    // a noindex tag, which only works if they are not disallowed here.
    rules: { userAgent: "*", allow: "/", disallow: ["/admin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
