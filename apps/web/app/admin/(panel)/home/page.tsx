"use client";

import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { HomeContent, Testimonial } from "@/lib/useHomeContent";
import ImagePicker from "../../_components/ImagePicker";
import { getHomeContent, saveHomeContent, uploadHomeImage } from "../../_lib/api";

const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/35 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const CARD = "mt-8 border border-line bg-ink-soft/60 p-6 md:p-8";

const newReviewSlot = () => `review-${Math.random().toString(36).slice(2, 10)}`;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-cream/55">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Text({ label, value, onChange, placeholder, area, max }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; area?: boolean; max: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL}>{label}</span>
      {area ? (
        <textarea className={`${INPUT} min-h-28 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
      ) : (
        <input className={INPUT} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
      )}
    </label>
  );
}

export default function AdminHomePage() {
  const { t } = useLanguage();
  const [c, setC] = useState<HomeContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getHomeContent().then(setC).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!c) return <div className="px-5 py-10 text-cream/60 md:px-12">{msg?.text ?? t("common.loading")}</div>;

  const set = (patch: Partial<HomeContent>) => setC((cur) => (cur ? { ...cur, ...patch } : cur));
  const setReview = (i: number, patch: Partial<Testimonial>) =>
    setC((cur) => cur && { ...cur, testimonials: cur.testimonials.map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const setStat = (i: number, patch: Partial<HomeContent["stats"][number]>) =>
    setC((cur) => cur && { ...cur, stats: cur.stats.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const up = (slot: string) => async (dataUrl: string) => (await uploadHomeImage(slot, dataUrl)).url;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      setC(await saveHomeContent(c!));
      setMsg({ ok: true, text: t("adminHome.saved") });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminHome.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminHome.intro")}</p>

        {/* Hero */}
        <Section title={t("adminHome.hero")}>
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <div>
              <p className={`${LABEL} mb-2`}>{t("adminProducts.photo")}</p>
              <ImagePicker url={c.hero_image_url} fallback="/home/hero.jpg" upload={up("hero")} onChange={(u) => set({ hero_image_url: u })} />
            </div>
            <div className="flex flex-col gap-5">
              <Text label={t("adminHome.heading")} value={c.hero_title} onChange={(v) => set({ hero_title: v })} placeholder={t("tarot.heroTitle")} max={200} />
              <Text label={t("adminHome.text")} value={c.hero_text} onChange={(v) => set({ hero_text: v })} placeholder={t("tarot.heroIntro")} area max={1000} />
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title={t("adminHome.about")}>
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`${LABEL} mb-2`}>{t("adminHome.leftPhoto")}</p>
                <ImagePicker url={c.about_image1_url} upload={up("about1")} onChange={(u) => set({ about_image1_url: u })} />
              </div>
              <div>
                <p className={`${LABEL} mb-2`}>{t("adminHome.rightPhoto")}</p>
                <ImagePicker url={c.about_image2_url} fallback={c.hero_image_url ?? "/home/hero.jpg"} upload={up("about2")} onChange={(u) => set({ about_image2_url: u })} />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <Text label={t("adminHome.heading")} value={c.about_title} onChange={(v) => set({ about_title: v })} placeholder={t("about.title")} max={200} />
              <Text label={t("adminHome.text")} value={c.about_text} onChange={(v) => set({ about_text: v })} placeholder={t("about.intro")} area max={2000} />
              <label className="flex flex-col gap-2">
                <span className={LABEL}>{t("about.yearsExperience")}</span>
                <input type="number" min={0} max={100} className={`${INPUT} max-w-[140px]`} value={c.years_experience}
                  onChange={(e) => set({ years_experience: Number(e.target.value) })} required />
              </label>
            </div>
          </div>
        </Section>

        {/* About page */}
        <Section title={t("adminHome.aboutPage")} hint={t("adminHome.aboutPageHint")}>
          <div className="flex flex-col gap-5">
            <Text label={t("adminHome.storyHeading")} value={c.story_title} onChange={(v) => set({ story_title: v })} placeholder={t("about.storyTitle")} max={200} />
            <Text label={t("adminHome.storyText")} value={c.story_text} onChange={(v) => set({ story_text: v })} placeholder={`${t("about.story1")}\n\n${t("about.story2")}`} area max={5000} />
            <div>
              <p className={LABEL}>{t("adminHome.cards")}</p>
              {c.values.length === 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <p className="text-sm text-cream/55">{t("adminHome.cardsDefault")}</p>
                  <button type="button"
                    onClick={() => set({ values: [
                      { title: t("about.valueTraditionTitle"), body: t("about.valueTraditionBody") },
                      { title: t("about.valuePrecisionTitle"), body: t("about.valuePrecisionBody") },
                      { title: t("about.valueCareTitle"), body: t("about.valueCareBody") },
                    ] })}
                    className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>{t("adminHome.editCards")}</button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {c.values.map((v, i) => (
                    <div key={i} className="grid gap-3 border border-line p-4 sm:grid-cols-[220px_1fr_auto] sm:items-start">
                      <input className={INPUT} value={v.title} maxLength={80} required placeholder={t("adminHome.heading")}
                        onChange={(e) => setC((cur) => cur && { ...cur, values: cur.values.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                      <textarea className={`${INPUT} min-h-20 resize-y`} value={v.body} maxLength={500} required placeholder={t("adminHome.text")}
                        onChange={(e) => setC((cur) => cur && { ...cur, values: cur.values.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} />
                      <button type="button" onClick={() => setC((cur) => cur && { ...cur, values: cur.values.filter((_, j) => j !== i) })}
                        className={`${BTN} border border-line text-cream/60 hover:border-red-400 hover:text-red-300`}>{t("adminSite.remove")}</button>
                    </div>
                  ))}
                  {c.values.length < 6 && (
                    <button type="button" onClick={() => set({ values: [...c.values, { title: "", body: "" }] })}
                      className={`${BTN} self-start border border-cream/40 hover:border-gold hover:text-gold`}>+ {t("adminHome.addCard")}</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Stats */}
        <Section title={t("adminHome.stats")} hint={t("adminHome.statsHint")}>
          <div className="flex flex-col gap-3">
            {c.stats.map((s, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[140px_70px_1fr_auto] sm:items-center">
                <input type="number" min={0} className={INPUT} value={s.value} aria-label="Number" onChange={(e) => setStat(i, { value: Number(e.target.value) })} required />
                <input className={INPUT} value={s.suffix} aria-label="Suffix" maxLength={4} onChange={(e) => setStat(i, { suffix: e.target.value })} placeholder="+" />
                <input className={INPUT} value={s.label} aria-label="Label" maxLength={60} onChange={(e) => setStat(i, { label: e.target.value })} required placeholder="Happy Customers" />
                <button type="button" onClick={() => set({ stats: c.stats.filter((_, j) => j !== i) })}
                  className={`${BTN} border border-line text-cream/60 hover:border-red-400 hover:text-red-300`}>{t("adminSite.remove")}</button>
              </div>
            ))}
            {c.stats.length < 4 && (
              <button type="button" onClick={() => set({ stats: [...c.stats, { label: "", value: 0, suffix: "+" }] })}
                className={`${BTN} self-start border border-cream/40 hover:border-gold hover:text-gold`}>+ {t("adminHome.addStat")}</button>
            )}
          </div>
        </Section>

        {/* Testimonials */}
        <Section title={t("adminHome.reviews")} hint={t("adminHome.reviewsHint")}>
          <div className="flex flex-col gap-5">
            {c.testimonials.map((r, i) => (
              <div key={i} className="grid gap-5 border border-line p-5 sm:grid-cols-[110px_1fr]">
                <div>
                  <ImagePicker url={r.photo_url} upload={up(newReviewSlot())} onChange={(u) => setReview(i, { photo_url: u })} aspect="aspect-square" round />
                </div>
                <div className="flex flex-col gap-3">
                  <textarea className={`${INPUT} min-h-20 resize-y`} value={r.quote} maxLength={1000} required placeholder={t("adminHome.quote")}
                    onChange={(e) => setReview(i, { quote: e.target.value })} />
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
                    <input className={INPUT} value={r.name} maxLength={80} required placeholder={t("booking.name")} onChange={(e) => setReview(i, { name: e.target.value })} />
                    <input className={INPUT} value={r.detail} maxLength={80} placeholder={t("adminHome.detailPh")} onChange={(e) => setReview(i, { detail: e.target.value })} />
                    <select className={`${INPUT} bg-ink`} value={r.rating} aria-label="Rating" onChange={(e) => setReview(i, { rating: Number(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={() => set({ testimonials: c.testimonials.filter((_, j) => j !== i) })}
                    className={`${BTN} self-start border border-line text-cream/60 hover:border-red-400 hover:text-red-300`}>{t("adminSite.remove")}</button>
                </div>
              </div>
            ))}
            <button type="button" disabled={c.testimonials.length >= 20}
              onClick={() => set({ testimonials: [...c.testimonials, { quote: "", name: "", detail: "", rating: 5, photo_url: null }] })}
              className={`${BTN} self-start border border-cream/40 hover:border-gold hover:text-gold`}>+ {t("adminHome.addReview")}</button>
          </div>
        </Section>

        <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-line bg-ink py-5">
          <button type="submit" disabled={busy} className={`${BTN} bg-white px-8 py-4 text-ink hover:bg-gold`}>
            <Sparkle className="h-3 w-3 text-gold-deep" />
            {t("common.save")}
          </button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? "text-gold" : "text-red-400"}`}>{msg.text}</p>}
        </div>
      </div>
    </form>
  );
}
