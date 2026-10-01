import { parseUtc } from "@/lib/bookings";
import { fetchPublic } from "@/lib/seo";

export interface BlogPostSummaryOut {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string;
  reading_minutes: number;
}

export interface BlogPostOut extends BlogPostSummaryOut {
  body: string;
  seo_title: string;
  meta_description: string;
}

// Server-side fetchers for the blog pages. Re-checked every minute, so a post
// the admin publishes shows up without a redeploy.
const FRESH = 60;

export function listPosts(tag?: string): Promise<BlogPostSummaryOut[] | null> {
  return fetchPublic<BlogPostSummaryOut[]>(`/blog${tag ? `?tag=${encodeURIComponent(tag)}` : ""}`, FRESH);
}

export function getPost(slug: string): Promise<BlogPostOut | null> {
  return fetchPublic<BlogPostOut>(`/blog/${encodeURIComponent(slug)}`, FRESH);
}

export const publishedDate = (p: BlogPostSummaryOut) => parseUtc(p.published_at ?? p.created_at);

export const formatPostDate = (p: BlogPostSummaryOut) =>
  publishedDate(p).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
