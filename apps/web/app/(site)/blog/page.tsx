import type { Metadata } from "next";
import Link from "next/link";
import PostCard from "@/components/blog/PostCard";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import T from "@/components/T";
import { BLOG_PAGE, listPostsPage } from "@/lib/blog";

const CHIP = "border px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.12em] transition-colors";
const PAGE_BTN = "inline-flex h-11 min-w-11 items-center justify-center border px-3 text-[13px] font-extrabold uppercase tracking-[0.12em] transition-colors";

const pageHref = (tag: string | undefined, page: number) => {
  const q = new URLSearchParams();
  if (tag) q.set("tag", tag);
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return s ? `/blog?${s}` : "/blog";
};

type Search = { searchParams: Promise<{ tag?: string; page?: string }> };

// Topic-filtered lists repeat posts already listed on /blog, so search engines
// follow their links but don't index them (they were showing up as duplicate
// pages). Later pages keep their own canonical URL.
export async function generateMetadata({ searchParams }: Search): Promise<Metadata> {
  const { tag, page } = await searchParams;
  if (tag) return { robots: { index: false, follow: true } };
  const n = Number.parseInt(page ?? "1", 10) || 1;
  return n > 1 ? { alternates: { canonical: `/blog?page=${n}` } } : {};
}

// Server-rendered so search engines see every article title and summary.
export default async function BlogPage({ searchParams }: Search) {
  const { tag, page: pageParam } = await searchParams;
  // Only this page's posts are fetched (BLOG_PAGE at a time).
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const data = await listPostsPage(page, tag);
  const posts = data?.items ?? null;
  const tags = data?.tags ?? [];
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / BLOG_PAGE));
  const shown = posts ?? [];
  // A wide first card only when the count is odd, so the two-column grid
  // always fills its rows (two posts sit side by side).
  const featureFirst = shown.length % 2 === 1;

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <Starfield seed={211} />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <p className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold"><T k="nav.home" /></Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <span className="text-gold"><T k="nav.blog" /></span>
        </p>
        <h1 className="mt-6 font-display text-[clamp(2.6rem,5vw,4.4rem)] uppercase leading-[1.05] tracking-[0.04em] text-gold">
          <T k="blog.pageTitle" />
        </h1>
        <p className="mt-4 max-w-2xl text-[1.1rem] leading-relaxed text-cream/80"><T k="blog.pageSubtitle" /></p>

        {tags.length > 1 && (
          <nav aria-label="Topics" className="mt-10 flex flex-wrap gap-2">
            <Link href="/blog" className={`${CHIP} ${!tag ? "border-gold bg-gold text-ink" : "border-line text-cream/75 hover:border-gold hover:text-gold"}`}>
              <T k="blog.allTopics" />
            </Link>
            {tags.map((t) => (
              <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}
                className={`${CHIP} ${t === tag ? "border-gold bg-gold text-ink" : "border-line text-cream/75 hover:border-gold hover:text-gold"}`}>
                {t}
              </Link>
            ))}
          </nav>
        )}

        {posts === null ? (
          <p className="mt-12 text-cream/70"><T k="blog.loadError" /></p>
        ) : posts.length === 0 ? (
          <div className="mt-12 border border-line bg-ink/85 p-10 text-center">
            <Sparkle className="mx-auto h-6 w-6 text-gold" />
            <p className="mt-4 text-cream/75"><T k="blog.noPosts" /></p>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {shown.map((p, i) => (
                <PostCard key={p.id} post={p} featured={i === 0 && featureFirst} />
              ))}
            </div>
            {pages > 1 && (
              <nav aria-label="Pages" className="mt-12 flex flex-wrap items-center justify-center gap-2">
                {page > 1 && (
                  <Link href={pageHref(tag, page - 1)} rel="prev" className={`${PAGE_BTN} border-line text-cream/80 hover:border-gold hover:text-gold`}>
                    ← <span className="ml-2"><T k="blog.newer" /></span>
                  </Link>
                )}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={pageHref(tag, n)} aria-current={n === page ? "page" : undefined}
                    className={`${PAGE_BTN} ${n === page ? "border-gold bg-gold text-ink" : "border-line text-cream/80 hover:border-gold hover:text-gold"}`}>
                    {n}
                  </Link>
                ))}
                {page < pages && (
                  <Link href={pageHref(tag, page + 1)} rel="next" className={`${PAGE_BTN} border-line text-cream/80 hover:border-gold hover:text-gold`}>
                    <span className="mr-2"><T k="blog.older" /></span> →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
