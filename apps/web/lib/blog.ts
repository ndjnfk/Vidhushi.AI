import { apiFetch } from "@/lib/api";

export interface BlogPostSummaryOut {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  author_name: string;
  created_at: string;
}

export interface BlogPostOut extends BlogPostSummaryOut {
  body: string;
  updated_at: string;
}

export function listPosts(tag?: string): Promise<BlogPostSummaryOut[]> {
  const query = tag ? `?tag=${encodeURIComponent(tag)}` : "";
  return apiFetch<BlogPostSummaryOut[]>(`/blog${query}`);
}

export function getPost(slug: string): Promise<BlogPostOut> {
  return apiFetch<BlogPostOut>(`/blog/${slug}`);
}
