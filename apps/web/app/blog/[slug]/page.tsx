"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getPost, type BlogPostOut } from "@/lib/blog";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [post, setPost] = useState<BlogPostOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPost(params.slug).then(setPost).catch((e) => setError(e.message));
  }, [params.slug]);

  if (!post) return <p>{error ?? t("common.loading")}</p>;

  return (
    <article className="flex flex-col gap-4 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">{post.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{fmtDate(post.created_at)} &middot; {post.author_name}</p>
        <div className="flex gap-2 mt-2">
          {post.tags.map((tagName) => (
            <a key={tagName} href={`/blog?tag=${encodeURIComponent(tagName)}`} className="text-xs bg-gray-100 rounded px-2 py-1">
              {tagName}
            </a>
          ))}
        </div>
      </div>
      <div className="prose max-w-none">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
      <a href="/blog" className="text-orange-600 text-sm">&larr; {t("blog.backToJournal")}</a>
    </article>
  );
}
