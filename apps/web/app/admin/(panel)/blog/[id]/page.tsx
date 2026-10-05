"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PostBody from "@/components/blog/PostBody";
import Sparkle from "@/components/Sparkle";
import { SITE_URL } from "@/lib/seo";
import { createPost, getAdminPost, updatePost, uploadBlogImage, type AdminBlogPost, type BlogPostIn } from "../../../_lib/api";
import { searchDescription, searchTitle, seoChecks, slugify, wordCount } from "../../../_lib/blogSeo";
import { prepareImage } from "../../../_lib/image";

const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/40 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const TOOL = "border border-line px-3 py-1.5 text-xs font-bold text-cream/80 hover:border-gold hover:text-gold disabled:opacity-50";

const EMPTY: BlogPostIn = {
  title: "", slug: "", excerpt: "", body: "", tags: [], author_name: "Vidushi Ji", published: false,
  seo_title: "", meta_description: "", cover_image_url: null, cover_image_alt: "",
};

async function pickAndUpload(file: File | undefined): Promise<string | null> {
  if (!file) return null;
  return (await uploadBlogImage(await prepareImage(file))).url;
}

function Counter({ n, min, max }: { n: number; min: number; max: number }) {
  return <span className={`text-xs ${n >= min && n <= max ? "text-emerald-400" : "text-amber-300"}`}>{n} / {min}–{max}</span>;
}

// Write or edit one article. "new" in the URL creates a post on first save.
export default function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const [saved, setSaved] = useState<AdminBlogPost | null>(null);
  const [f, setF] = useState<BlogPostIn>(EMPTY);
  const [tagText, setTagText] = useState("");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const body = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    getAdminPost(id)
      .then((p) => {
        setSaved(p);
        setF({
          title: p.title, slug: p.slug, excerpt: p.excerpt, body: p.body, tags: p.tags, author_name: p.author_name,
          published: p.published, seo_title: p.seo_title, meta_description: p.meta_description,
          cover_image_url: p.cover_image_url, cover_image_alt: p.cover_image_alt,
        });
        setTagText(p.tags.join(", "));
      })
      .catch((e: Error) => setMessage({ ok: false, text: e.message }))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof BlogPostIn>(k: K, v: BlogPostIn[K]) => setF((x) => ({ ...x, [k]: v }));
  const tags = tagText.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const post = { ...f, tags };
  const checks = seoChecks(post);

  function onTitle(v: string) {
    setF((x) => ({ ...x, title: v, slug: slugTouched ? x.slug : slugify(v) }));
  }

  // Wrap the selection (or insert a placeholder) in the body textarea.
  function format(before: string, after = "", placeholder = "text") {
    const el = body.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const chosen = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + chosen + after + value.slice(e);
    set("body", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + chosen.length);
    });
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBusy(true);
    try {
      const url = await pickAndUpload(file);
      if (url) set("cover_image_url", url);
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function insertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setBusy(true);
    try {
      const url = await pickAndUpload(file);
      if (url) format("![", `](${url})`, "describe the image");
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function save(publish: boolean) {
    setBusy(true);
    setMessage(null);
    const payload: BlogPostIn = {
      ...f,
      title: f.title.trim(), slug: f.slug.trim(), excerpt: f.excerpt.trim(), tags,
      seo_title: f.seo_title.trim(), meta_description: f.meta_description.trim(), cover_image_alt: f.cover_image_alt.trim(),
      author_name: f.author_name.trim() || "Vidushi Ji", published: publish,
    };
    try {
      const p = saved ? await updatePost(saved.id, payload) : await createPost(payload);
      setSaved(p);
      set("published", p.published);
      setMessage({ ok: true, text: p.published ? "Published — live on the blog within a minute." : "Saved as draft (not visible on the site)." });
      if (!saved) router.replace(`/admin/blog/${p.id}`);
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="px-12 py-14 text-cream/70">{message?.text ?? "Loading…"}</p>;

  const slugChangedLive = !!saved?.published && f.slug !== saved.slug;
  const canSave = f.title.trim() && f.slug.trim() && f.body.trim() && !busy;

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin/blog" className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70 hover:text-gold">← All posts</Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-[clamp(2rem,3.6vw,3rem)] uppercase tracking-[0.04em] text-gold">{isNew ? "New post" : "Edit post"}</h1>
          <div className="flex flex-wrap gap-2">
            {saved?.published && (
              <a href={`/blog/${saved.slug}`} target="_blank" className={`${BTN} border border-line text-cream/70 hover:border-gold hover:text-gold`}>View live</a>
            )}
            <button type="button" disabled={!canSave} onClick={() => save(false)} className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
              {f.published ? "Unpublish & save" : "Save draft"}
            </button>
            <button type="button" disabled={!canSave} onClick={() => save(true)} className={`${BTN} bg-white text-ink hover:bg-gold`}>
              <Sparkle className="h-3 w-3 text-gold-deep" />
              {f.published ? "Update" : "Publish"}
            </button>
          </div>
        </div>
        {message && <p className={`mt-4 border px-4 py-3 text-sm ${message.ok ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300"}`}>{message.text}</p>}

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* ---- Content ---- */}
          <div className="flex min-w-0 flex-col gap-5">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Title (the H1 on the page)</span>
              <input className={`${INPUT} font-display text-xl`} value={f.title} onChange={(e) => onTitle(e.target.value)} maxLength={150}
                placeholder="e.g. Manglik Dosha: Meaning, Effects and Remedies" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>URL</span>
              <div className="flex items-center border border-line focus-within:border-gold">
                <span className="pl-4 text-sm text-cream/50">/blog/</span>
                <input className="w-full bg-transparent px-1 py-3 text-cream outline-none" value={f.slug} maxLength={80}
                  onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value) || e.target.value.toLowerCase()); }} />
              </div>
              {slugChangedLive && <span className="text-xs text-amber-300">This post is live: changing its URL breaks links already shared or indexed by Google.</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Summary <span className="normal-case tracking-normal text-cream/50">(shown on the blog list and under the title)</span></span>
              <textarea className={`${INPUT} min-h-[90px]`} value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} maxLength={300}
                placeholder="Two sentences: what the reader will learn." />
            </label>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={LABEL}>Article</span>
                <div className="flex gap-1">
                  {(["write", "preview"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTab(t)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] ${tab === t ? "bg-gold text-ink" : "border border-line text-cream/70"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {tab === "write" ? (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={TOOL} onClick={() => format("\n## ", "\n", "Section heading")}>H2</button>
                    <button type="button" className={TOOL} onClick={() => format("\n### ", "\n", "Sub-heading")}>H3</button>
                    <button type="button" className={TOOL} onClick={() => format("**", "**")}><b>B</b></button>
                    <button type="button" className={TOOL} onClick={() => format("*", "*")}><i>I</i></button>
                    <button type="button" className={TOOL} onClick={() => format("\n- ", "\n", "List item")}>• List</button>
                    <button type="button" className={TOOL} onClick={() => format("\n> ", "\n", "Quote")}>❝ Quote</button>
                    <button type="button" className={TOOL} onClick={() => format("[", "](/kundli)", "link text")}>Link</button>
                    <button type="button" className={TOOL} disabled={busy} onClick={() => imageInput.current?.click()}>Image</button>
                    <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={insertImage} />
                  </div>
                  <textarea ref={body} className={`${INPUT} min-h-[480px] font-mono text-[15px] leading-relaxed`} value={f.body}
                    onChange={(e) => set("body", e.target.value)}
                    placeholder={"Start with an introduction.\n\n## First section\nExplain clearly...\n\n## Second section\n...\n\nLink to a service: [get your free kundli](/kundli)"} />
                  <span className="text-xs text-cream/50">{wordCount(f.body)} words · Markdown: ## heading, **bold**, - list, [text](/link)</span>
                </>
              ) : (
                <div className="min-h-[480px] border border-line bg-ink-soft p-6">
                  {f.body.trim() ? <PostBody markdown={f.body} /> : <p className="text-cream/50">Nothing to preview yet.</p>}
                </div>
              )}
            </div>
          </div>

          {/* ---- Sidebar: cover, tags, SEO ---- */}
          <aside className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <span className={LABEL}>Cover image</span>
              <div className="flex aspect-[1200/630] items-center justify-center overflow-hidden border border-dashed border-cream/25 bg-ink-soft">
                {f.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.cover_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkle className="h-8 w-8 text-gold/40" />
                )}
              </div>
              <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadCover} />
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={() => coverInput.current?.click()} className={`${BTN} flex-1 border border-cream/40 hover:border-gold hover:text-gold`}>
                  {f.cover_image_url ? "Change" : "Upload"}
                </button>
                {f.cover_image_url && (
                  <button type="button" onClick={() => set("cover_image_url", null)} className={`${BTN} border border-line text-cream/60 hover:border-gold hover:text-gold`}>Remove</button>
                )}
              </div>
              <input className={INPUT} value={f.cover_image_alt} onChange={(e) => set("cover_image_alt", e.target.value)} maxLength={150}
                placeholder="Alt text: describe the image" />
              <span className="text-xs text-cream/50">PNG, JPEG or WebP, up to 3 MB. Best size: 1200 × 630 px — also used as the share image.</span>
            </section>

            <section className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Tags</span>
                <input className={INPUT} value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="kundli, marriage, remedies" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Author</span>
                <input className={INPUT} value={f.author_name} onChange={(e) => set("author_name", e.target.value)} maxLength={80} />
              </label>
            </section>

            <section className="flex flex-col gap-3 border border-line p-5">
              <span className={LABEL}>Google search</span>
              <label className="flex flex-col gap-1.5">
                <span className="flex justify-between text-xs text-cream/60">SEO title (optional) <Counter n={searchTitle(post).length} min={30} max={60} /></span>
                <input className={INPUT} value={f.seo_title} onChange={(e) => set("seo_title", e.target.value)} maxLength={70} placeholder={f.title || "Defaults to the title"} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex justify-between text-xs text-cream/60">Meta description (optional) <Counter n={searchDescription(post).length} min={70} max={160} /></span>
                <textarea className={`${INPUT} min-h-[90px]`} value={f.meta_description} onChange={(e) => set("meta_description", e.target.value)} maxLength={170}
                  placeholder={f.excerpt || "Defaults to the summary"} />
              </label>

              {/* What the result roughly looks like on Google. */}
              <div className="mt-1 bg-white p-4 font-sans">
                <p className="truncate text-xs text-[#4d5156]">{SITE_URL.replace("https://", "")} › blog › {f.slug || "…"}</p>
                <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{searchTitle(post)}</p>
                <p className="mt-1 line-clamp-3 text-sm text-[#4d5156]">{searchDescription(post) || "Add a summary or meta description."}</p>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <span className={LABEL}>SEO checklist · {checks.filter((c) => c.ok).length}/{checks.length}</span>
              <ul className="flex flex-col gap-2">
                {checks.map((c) => (
                  <li key={c.label} className="flex gap-2 text-sm">
                    <span className={c.ok ? "text-emerald-400" : "text-amber-300"}>{c.ok ? "✓" : "○"}</span>
                    <span>
                      <span className="text-cream">{c.label}</span>
                      {!c.ok && <span className="block text-xs text-cream/55">{c.hint}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
