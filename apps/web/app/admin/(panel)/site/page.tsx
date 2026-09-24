"use client";

import { useEffect, useState } from "react";
import { SOCIAL_LABELS, SocialGlyph } from "@/components/SocialIcons";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { SocialPlatform } from "@/lib/useSiteInfo";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "../../_lib/api";

type Field = "phone" | "email" | "address" | "hours" | "whatsapp";
const FIELDS: { key: Field; label: string; type?: string; placeholder: string; hint?: string }[] = [
  { key: "phone", label: "contact.phone", type: "tel", placeholder: "+91 98765 43210" },
  { key: "email", label: "contact.email", type: "email", placeholder: "you@example.com" },
  { key: "address", label: "contact.address", placeholder: "Street, City – PIN" },
  { key: "hours", label: "contact.hours", placeholder: "Mon–Sat, 10:00 am – 7:00 pm" },
  { key: "whatsapp", label: "WhatsApp", type: "tel", placeholder: "91 98765 43210", hint: "adminSite.whatsappHint" },
];
const PLATFORMS = Object.keys(SOCIAL_LABELS) as SocialPlatform[];
const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/35 focus:border-gold disabled:opacity-40";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className="flex items-center gap-3 text-sm text-cream/75">
      <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-gold" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

export default function AdminSitePage() {
  const { t } = useLanguage();
  const [s, setS] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getSiteSettings().then(setS).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!s) return <div className="px-5 py-10 text-cream/60 md:px-12">{msg?.text ?? t("common.loading")}</div>;

  // Functional updates so quick successive edits never work on a stale copy.
  const update = (patch: Partial<SiteSettings>) => setS((cur) => (cur ? { ...cur, ...patch } : cur));
  const setLink = (i: number, patch: Partial<SiteSettings["social_links"][number]>) =>
    setS((cur) => cur && { ...cur, social_links: cur.social_links.map((l, j) => (j === i ? { ...l, ...patch } : l)) });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      setS(await saveSiteSettings({ ...s!, social_links: s!.social_links.filter((l) => l.url.trim()) }));
      setMsg({ ok: true, text: t("adminSite.saved") });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminSite.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminSite.intro")}</p>

        <section className="mt-10 border border-line bg-ink-soft/60 p-6 md:p-8">
          <h2 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{t("adminSite.contact")}</h2>
          <div className="mt-6 flex flex-col divide-y divide-line">
            {FIELDS.map((f) => {
              const on = s[`show_${f.key}`];
              return (
                <div key={f.key} className="grid gap-3 py-5 md:grid-cols-[160px_1fr_auto] md:items-center md:gap-6">
                  <label htmlFor={`f-${f.key}`} className={LABEL}>{f.label.includes(".") ? t(f.label) : f.label}</label>
                  <div>
                    <input id={`f-${f.key}`} type={f.type ?? "text"} className={INPUT} value={s[f.key]} placeholder={f.placeholder}
                      onChange={(e) => update({ [f.key]: e.target.value } as Partial<SiteSettings>)} disabled={!on} maxLength={300} />
                    {f.hint && <p className="mt-1.5 text-xs text-cream/45">{t(f.hint)}</p>}
                  </div>
                  <Toggle on={on} label={t("adminSite.show")} onChange={(v) => update({ [`show_${f.key}`]: v } as Partial<SiteSettings>)} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 border border-line bg-ink-soft/60 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{t("adminSite.social")}</h2>
              <p className="mt-1 text-sm text-cream/60">{t("adminSite.socialHint")}</p>
            </div>
            <button type="button" disabled={s.social_links.length >= 12}
              onClick={() => update({ social_links: [...s.social_links, { platform: PLATFORMS.find((p) => !s.social_links.some((l) => l.platform === p)) ?? "website", url: "" }] })}
              className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
              + {t("adminSite.addLink")}
            </button>
          </div>
          {s.social_links.length === 0 ? (
            <p className="mt-6 text-sm text-cream/50">{t("adminSite.noLinks")}</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-3">
              {s.social_links.map((l, i) => (
                <li key={i} className="grid gap-3 sm:grid-cols-[auto_180px_1fr_auto] sm:items-center">
                  <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-dashed border-gold/50 text-gold sm:flex">
                    <SocialGlyph platform={l.platform} />
                  </span>
                  <select className={`${INPUT} bg-ink`} value={l.platform} aria-label="Platform"
                    onChange={(e) => setLink(i, { platform: e.target.value as SocialPlatform })}>
                    {PLATFORMS.map((p) => <option key={p} value={p}>{SOCIAL_LABELS[p]}</option>)}
                  </select>
                  <input className={INPUT} value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} maxLength={300}
                    placeholder="https://instagram.com/your-page" aria-label="URL" />
                  <button type="button" onClick={() => setS((cur) => cur && { ...cur, social_links: cur.social_links.filter((_, j) => j !== i) })}
                    className={`${BTN} border border-line text-cream/70 hover:border-red-400 hover:text-red-300`}>
                    {t("adminSite.remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

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
