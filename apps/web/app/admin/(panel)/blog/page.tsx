"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { formatPostDate } from "@/lib/blog";
import { deletePost, listAdminPosts, updatePost, type AdminBlogPost } from "../../_lib/api";
import { seoChecks } from "../../_lib/blogSeo";

const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

// Blog posts: drafts and published, newest first.
export default function AdminBlogPage() {
  const [rows, setRows] = useState<AdminBlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listAdminPosts().then(setRows).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function togglePublished(p: AdminBlogPost) {
    await updatePost(p.id, { published: !p.published });
    load();
  }

  async function remove(p: AdminBlogPost) {
    if (!window.confirm(`Delete "${p.title}" permanently?`)) return;
    await deletePost(p.id);
    load();
  }

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">Admin panel</p>
            <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">Blog</h1>
          </div>
          <Link href="/admin/blog/new" className={`${BTN} bg-white text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            New post
          </Link>
        </div>

        {!rows ? (
          <p className="mt-10 text-cream/70">{error ?? "Loading…"}</p>
        ) : rows.length === 0 ? (
          <div className="mt-10 border border-line p-10 text-center text-cream/70">
            No posts yet. Write your first article — it goes live on /blog when you publish it.
          </div>
        ) : (
          <ul className="mt-10 divide-y divide-line border-y border-line">
            {rows.map((p) => {
              const failing = seoChecks(p).filter((c) => !c.ok).length;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-5 py-4">
                  <div className="h-16 w-24 shrink-0 overflow-hidden bg-ink-soft">
                    {p.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.cover_image_url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <p className="font-display text-xl uppercase tracking-[0.04em] text-gold">{p.title}</p>
                    <p className="mt-1 text-sm text-cream/60">
                      <span className={p.published ? "text-emerald-400" : "text-cream"}>{p.published ? "Published" : "Draft"}</span>
                      {" · "}{formatPostDate(p)} · /blog/{p.slug} · {p.reading_minutes} min read
                      {" · "}
                      <span className={failing ? "text-amber-300" : "text-emerald-400"}>{failing ? `${failing} SEO tip${failing > 1 ? "s" : ""}` : "SEO ✓"}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/blog/${p.id}`} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>Edit</Link>
                    {p.published && (
                      <a href={`/blog/${p.slug}`} target="_blank" className={`${BTN} border border-line text-cream/70 hover:border-gold hover:text-gold`}>View</a>
                    )}
                    <button type="button" onClick={() => togglePublished(p)} className={`${BTN} border border-line text-cream/70 hover:border-gold hover:text-gold`}>
                      {p.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" onClick={() => remove(p)} className={`${BTN} border border-line text-cream/50 hover:border-red-400 hover:text-red-300`}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
