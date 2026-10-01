import Link from "next/link";
import PostCard from "@/components/blog/PostCard";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import T from "@/components/T";
import { listPosts } from "@/lib/blog";

const CHIP = "border px-3.5 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.12em] transition-colors";

// Server-rendered so search engines see every article title and summary.
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams;
  const [posts, all] = await Promise.all([listPosts(tag), tag ? listPosts() : null]);
  const tags = [...new Set((all ?? posts ?? []).flatMap((p) => p.tags))].sort();

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
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} featured={i === 0 && !tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
