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

export interface BlogPageOut {
  items: BlogPostSummaryOut[];
  total: number;
  tags: string[]; // every topic, for the filter chips
}

/** The newest `limit` posts (used for "related posts"). */
export function listPosts(tag?: string, limit = BLOG_PAGE): Promise<BlogPostSummaryOut[] | null> {
  const q = new URLSearchParams({ limit: String(limit) });
  if (tag) q.set("tag", tag);
  return fetchPublic<BlogPostSummaryOut[]>(`/blog?${q}`, FRESH);
}

// The /blog page loads this many posts at a time.
export const BLOG_PAGE = 20;

/** One page of the blog list (1-based), with the total and all topics. */
export function listPostsPage(page: number, tag?: string): Promise<BlogPageOut | null> {
  const q = new URLSearchParams({ skip: String((page - 1) * BLOG_PAGE), limit: String(BLOG_PAGE) });
  if (tag) q.set("tag", tag);
  return fetchPublic<BlogPageOut>(`/blog/_page?${q}`, FRESH);
}

export function getPost(slug: string): Promise<BlogPostOut | null> {
  return fetchPublic<BlogPostOut>(`/blog/${encodeURIComponent(slug)}`, FRESH);
}

export const publishedDate = (p: BlogPostSummaryOut) => parseUtc(p.published_at ?? p.created_at);

export const formatPostDate = (p: BlogPostSummaryOut) =>
  publishedDate(p).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
