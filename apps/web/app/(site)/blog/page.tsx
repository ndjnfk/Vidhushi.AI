"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { listPosts, type BlogPostSummaryOut } from "@/lib/blog";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function BlogPageContent() {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const { t } = useLanguage();
  const [posts, setPosts] = useState<BlogPostSummaryOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPosts(tag).then(setPosts).catch((e) => setError(e.message));
  }, [tag]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("blog.pageTitle")}</h1>
        <p className="text-gray-600">{t("blog.pageSubtitle")}</p>
        {tag && (
          <p className="text-sm mt-1">
            {t("blog.taggedPrefix")} <span className="font-medium">{tag}</span> &middot;{" "}
            <a href="/blog" className="text-orange-600">{t("blog.clearFilter")}</a>
          </p>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex flex-col gap-4">
        {posts.map((p) => (
          <a key={p.id} href={`/blog/${p.slug}`} className="border rounded p-4 hover:shadow">
            <h2 className="font-semibold text-lg">{p.title}</h2>
            <p className="text-sm text-gray-500">{fmtDate(p.created_at)} &middot; {p.author_name}</p>
            <p className="text-gray-600 mt-2">{p.excerpt}</p>
            <div className="flex gap-2 mt-2">
              {p.tags.map((tagName) => (
                <span key={tagName} className="text-xs bg-gray-100 rounded px-2 py-1">{tagName}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
      {posts.length === 0 && !error && <p className="text-gray-500">{t("blog.noPosts")}</p>}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <BlogPageContent />
    </Suspense>
  );
}
