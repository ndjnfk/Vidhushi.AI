import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookConsultationButton from "@/components/booking/BookConsultation";
import PostBody from "@/components/blog/PostBody";
import PostCard from "@/components/blog/PostCard";
import Sparkle from "@/components/Sparkle";
import Starfield from "@/components/Starfield";
import T from "@/components/T";
import { formatPostDate, getPost, listPosts, publishedDate } from "@/lib/blog";
import { parseUtc } from "@/lib/bookings";
import { JsonLd, SITE_NAME, SITE_URL, pageMetadata, snippet } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Blog", robots: { index: false } };
  const meta = pageMetadata(post.seo_title || post.title, post.meta_description || snippet(post.excerpt || post.body), `/blog/${post.slug}`);
  return {
    ...meta,
    keywords: post.tags,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: publishedDate(post).toISOString(),
      modifiedTime: parseUtc(post.updated_at).toISOString(),
      authors: [post.author_name || SITE_NAME],
      tags: post.tags,
      ...(post.cover_image_url && { images: [{ url: post.cover_image_url, alt: post.cover_image_alt || post.title }] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  // Up to three other posts, preferring ones that share a tag.
  const others = ((await listPosts()) ?? []).filter((p) => p.id !== post.id);
  const related = [
    ...others.filter((p) => p.tags.some((t) => post.tags.includes(t))),
    ...others.filter((p) => !p.tags.some((t) => post.tags.includes(t))),
  ].slice(0, 3);

  const url = `${SITE_URL}/blog/${post.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.seo_title || post.title,
        description: post.meta_description || snippet(post.excerpt || post.body),
        datePublished: publishedDate(post).toISOString(),
        dateModified: parseUtc(post.updated_at).toISOString(),
        author: { "@type": "Person", name: post.author_name || SITE_NAME, url: `${SITE_URL}/about` },
        publisher: { "@id": `${SITE_URL}/#person` },
        mainEntityOfPage: url,
        url,
        keywords: post.tags.join(", "),
        ...(post.cover_image_url && { image: post.cover_image_url }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="relative -mx-6 -my-8 min-h-[calc(100vh-97px)] overflow-hidden bg-ink font-body text-cream">
      <JsonLd data={schema} />
      <Starfield seed={317} />
      <article className="relative z-10 mx-auto max-w-3xl px-6 py-20">
        <p className="flex flex-wrap items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/80">
          <Link href="/" className="hover:text-gold"><T k="nav.home" /></Link>
          <Sparkle className="h-2.5 w-2.5 text-gold" />
          <Link href="/blog" className="hover:text-gold"><T k="nav.blog" /></Link>
        </p>

        <h1 className="mt-6 font-display text-[clamp(2.2rem,4.4vw,3.6rem)] uppercase leading-[1.08] tracking-[0.04em] text-gold">{post.title}</h1>

        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60">
          <span>{post.author_name}</span>
          <Sparkle className="h-2 w-2 text-gold" />
          <time dateTime={publishedDate(post).toISOString()}>{formatPostDate(post)}</time>
          <Sparkle className="h-2 w-2 text-gold" />
          <span>{post.reading_minutes} <T k="blog.minRead" /></span>
        </p>

        {post.excerpt && <p className="mt-8 border-l-2 border-gold pl-5 text-[1.2rem] leading-relaxed text-cream/85">{post.excerpt}</p>}

        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="mt-10 aspect-[1200/630] w-full border border-line object-cover" />
        )}

        <div className="mt-10">
          <PostBody markdown={post.body} />
        </div>

        {post.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 border-t border-line pt-8">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="border border-line px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-cream/70 hover:border-gold hover:text-gold">
                {tag}
              </Link>
            ))}
          </div>
        )}

        <aside className="mt-12 border border-gold/50 bg-gold/10 p-8 text-center">
          <Sparkle className="mx-auto h-5 w-5 text-gold" />
          <p className="mt-4 font-display text-2xl uppercase tracking-[0.04em] text-gold"><T k="blog.ctaTitle" /></p>
          <p className="mx-auto mt-3 max-w-lg text-cream/80"><T k="blog.ctaText" /></p>
          <BookConsultationButton className="mt-6 inline-flex items-center justify-center gap-3 bg-white px-8 py-4 text-[13px] font-extrabold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold">
            <Sparkle className="h-3 w-3 text-gold-deep" />
            <T k="blog.ctaButton" />
          </BookConsultationButton>
        </aside>
      </article>

      {related.length > 0 && (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
          <h2 className="font-display text-[1.8rem] uppercase tracking-[0.04em] text-gold"><T k="blog.related" /></h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        </section>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
        <Link href="/blog" className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-gold hover:text-cream">
          ← <T k="blog.backToJournal" />
        </Link>
      </div>
    </div>
  );
}
