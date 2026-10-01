import Link from "next/link";
import Sparkle from "@/components/Sparkle";
import T from "@/components/T";
import { formatPostDate, publishedDate, type BlogPostSummaryOut } from "@/lib/blog";

// One article in the blog grid. `featured` is the wide first card.
export default function PostCard({ post, featured = false }: { post: BlogPostSummaryOut; featured?: boolean }) {
  return (
    <article className={`group relative flex flex-col border border-line bg-ink/85 backdrop-blur-sm transition-colors hover:border-gold/60 ${featured ? "md:col-span-2 md:flex-row" : ""}`}>
      <div className={`relative overflow-hidden bg-ink-soft ${featured ? "aspect-[16/10] md:aspect-auto md:w-[55%]" : "aspect-[16/10]"}`}>
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkle className="h-10 w-10 text-gold/40" />
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col p-6 ${featured ? "md:p-10" : ""}`}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">
          <time dateTime={publishedDate(post).toISOString()}>{formatPostDate(post)}</time>
          <Sparkle className="h-2 w-2 text-gold" />
          <span>{post.reading_minutes} <T k="blog.minRead" /></span>
        </p>
        <h2 className={`mt-4 font-display uppercase leading-[1.15] tracking-[0.04em] text-gold ${featured ? "text-[clamp(1.7rem,2.6vw,2.4rem)]" : "text-[1.45rem]"}`}>
          {/* The stretched link makes the whole card clickable. */}
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">{post.title}</Link>
        </h2>
        {post.excerpt && <p className="mt-4 leading-relaxed text-cream/75">{post.excerpt}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="border border-line px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-cream/60">{tag}</span>
          ))}
          <span className="ml-auto text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold">
            <T k="blog.readMore" /> →
          </span>
        </div>
      </div>
    </article>
  );
}
