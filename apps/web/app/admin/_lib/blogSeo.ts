// On-page SEO checklist for the blog editor. Tips, not rules: the admin can
// publish either way.

export interface SeoInput {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  tags: string[];
  seo_title: string;
  meta_description: string;
  cover_image_url: string | null;
  cover_image_alt: string;
}

export interface SeoCheck {
  label: string;
  ok: boolean;
  hint: string;
}

// The site appends " | Vidushi Ji" to every page title (see lib/seo.tsx).
export const TITLE_SUFFIX = " | Vidushi Ji";

export const searchTitle = (p: Pick<SeoInput, "title" | "seo_title">) => (p.seo_title.trim() || p.title.trim()) + TITLE_SUFFIX;
export const searchDescription = (p: Pick<SeoInput, "excerpt" | "meta_description">) => p.meta_description.trim() || p.excerpt.trim();

export const wordCount = (markdown: string) => markdown.replace(/[#*_>`[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export function seoChecks(p: SeoInput): SeoCheck[] {
  const title = searchTitle(p).length;
  const desc = searchDescription(p).length;
  const words = wordCount(p.body);
  const h2 = (p.body.match(/^##\s+\S/gm) ?? []).length;
  const internal = /\]\(\/(?!\/)/.test(p.body);
  return [
    { label: "Search title length", ok: title >= 30 && title <= 60, hint: `${title} characters including "${TITLE_SUFFIX.trim()}" — aim for 30–60 so Google shows it in full.` },
    { label: "Meta description length", ok: desc >= 70 && desc <= 160, hint: `${desc} characters — aim for 70–160. Summarise the article and invite the click.` },
    { label: "Article length", ok: words >= 600, hint: `${words} words — 600+ words of genuinely useful content ranks better than short posts.` },
    { label: "Subheadings", ok: h2 >= 2, hint: `${h2} "## " subheading(s) — break the article into at least 2 sections.` },
    { label: "Link to a service page", ok: internal, hint: "Link to /kundli, /matching, /rituals or /pricing, e.g. [free kundli](/kundli)." },
    { label: "Cover image with alt text", ok: !!p.cover_image_url && p.cover_image_alt.trim().length >= 5, hint: "Add a cover image and describe it in the alt text (used by Google Images and screen readers)." },
    { label: "Short URL", ok: p.slug.length > 0 && p.slug.length <= 60 && p.slug.split("-").length <= 7, hint: "Keep the URL short: 3–6 words with the main keyword, e.g. manglik-dosha-remedies." },
    { label: "Topic tags", ok: p.tags.length >= 1, hint: "Add 1–3 tags so related articles link to each other." },
  ];
}
