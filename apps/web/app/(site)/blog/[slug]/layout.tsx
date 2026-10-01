import type { Metadata } from "next";
import type { BlogPostOut } from "@/lib/blog";
import { JsonLd, SITE_NAME, SITE_URL, fetchPublic, pageMetadata, snippet } from "@/lib/seo";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

const getPost = (slug: string) => fetchPublic<BlogPostOut>(`/blog/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Journal" };
  const meta = pageMetadata(post.title, snippet(post.excerpt || post.body), `/blog/${post.slug}`);
  return { ...meta, openGraph: { ...meta.openGraph, type: "article", publishedTime: post.created_at, modifiedTime: post.updated_at } };
}

export default async function BlogPostLayout({ children, params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  return (
    <>
      {post && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: snippet(post.excerpt || post.body),
            datePublished: post.created_at,
            dateModified: post.updated_at,
            author: { "@type": "Person", name: post.author_name || SITE_NAME },
            publisher: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
            mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
            keywords: post.tags.join(", "),
          }}
        />
      )}
      {children}
    </>
  );
}
