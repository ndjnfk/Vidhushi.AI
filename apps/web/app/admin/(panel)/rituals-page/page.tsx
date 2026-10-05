"use client";

import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { defaultRitualsContent, type RitualIntentionItem, type RitualsContent } from "@/lib/useRitualsContent";
import ChannelToggles from "../../_components/ChannelToggles";
import ImagePicker from "../../_components/ImagePicker";
import { BTN, INPUT, ListEditor, Section, Text } from "../../_components/ContentEditor";
import { getRitualsPage, saveRitualsPage, uploadHomeImage } from "../../_lib/api";

const newId = () => `r-${Math.random().toString(36).slice(2, 10)}`;

// The Rituals page: hero text and photo, intentions, urgent-wish section and
// the enquiry steps. Empty boxes / built-in lists show the original content.
export default function AdminRitualsPageEditor() {
  const { t } = useLanguage();
  const d = defaultRitualsContent(t);
  const [c, setC] = useState<RitualsContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getRitualsPage().then(setC).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!c) return <div className="px-5 py-10 text-cream/60 md:px-12">{msg?.text ?? t("common.loading")}</div>;

  const set = (patch: Partial<RitualsContent>) => setC((cur) => (cur ? { ...cur, ...patch } : cur));
  const text = (k: keyof RitualsContent, label: string, max: number, area?: boolean) => (
    <Text label={label} value={(c[k] as string) ?? ""} onChange={(v) => set({ [k]: v })} placeholder={d[k] as string} max={max} area={area} />
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      setC(await saveRitualsPage(c!));
      setMsg({ ok: true, text: t("adminRituals.saved") });
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
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminRituals.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminRituals.intro")}</p>

        <Section title={t("adminHome.hero")}>
          <div className="grid gap-6 md:grid-cols-[200px_1fr]">
            <div>
              <p className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70">{t("adminProducts.photo")}</p>
              <ImagePicker url={c.hero_image_url} upload={async (dataUrl) => (await uploadHomeImage("rituals-hero", dataUrl)).url}
                onChange={(u) => set({ hero_image_url: u })} aspect="aspect-[4/5]" />
              <p className="mt-2 text-xs text-cream/50">{t("adminRituals.photoHint")}</p>
            </div>
            <div className="flex flex-col gap-5">
              {text("hero_title", t("adminHome.heading"), 120)}
              {text("hero_text", t("adminHome.text"), 800, true)}
              {text("charges_note", t("adminRituals.chargesNote"), 600, true)}
            </div>
          </div>
        </Section>

        <Section title={t("adminRituals.intentions")} hint={t("adminRituals.intentionsHint")}>
          {text("intentions_title", t("adminHome.heading"), 120)}
          {text("intentions_subtitle", t("adminTarot.subtitle"), 300)}
          <ListEditor<RitualIntentionItem>
            label={t("adminRituals.intentions")} items={c.intentions} defaults={d.intentions} max={30}
            addLabel={t("adminRituals.addIntention")} onChange={(intentions) => set({ intentions })}
            blank={() => ({ id: newId(), name: "", price: null, price_usd: null, channels: ["chat"] })}
            render={(i, update) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]">
                <input className={INPUT} value={i.name} maxLength={80} required placeholder={t("adminTarot.name")} aria-label={t("adminTarot.name")}
                  onChange={(e) => update({ ...i, name: e.target.value })} />
                <input type="number" min={0} max={10000000} className={INPUT} value={i.price ?? ""} placeholder={t("adminHome.ratePrice")} aria-label={t("adminHome.ratePrice")}
                  onChange={(e) => update({ ...i, price: e.target.value === "" ? null : Number(e.target.value) })} />
                <input type="number" min={0} max={10000000} className={INPUT} value={i.price_usd ?? ""} placeholder={t("adminHome.ratePriceUsd")} aria-label={t("adminHome.ratePriceUsd")}
                  onChange={(e) => update({ ...i, price_usd: e.target.value === "" ? null : Number(e.target.value) })} />
                <div className="flex flex-col gap-1.5 sm:col-span-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-cream/65">{t("adminRituals.channels")}</span>
                  <ChannelToggles value={i.channels ?? ["chat"]} onChange={(channels) => update({ ...i, channels })} />
                </div>
              </div>
            )}
          />
        </Section>

        <Section title={t("adminRituals.urgent")}>
          {text("urgent_title", t("adminHome.heading"), 120)}
          {text("urgent_lead", t("adminRituals.urgentLead"), 300)}
          {text("urgent_body", t("adminHome.text"), 1000, true)}
        </Section>

        <Section title={t("adminRituals.how")}>
          {text("how_title", t("adminHome.heading"), 120)}
          {text("how_intro", t("adminTarot.subtitle"), 600, true)}
          <ListEditor<string>
            label={t("adminRituals.steps")} items={c.steps} defaults={d.steps} max={8}
            addLabel={t("adminTarot.addStep")} onChange={(steps) => set({ steps })} blank={() => ""}
            render={(s, update) => (
              <input className={INPUT} value={s} maxLength={200} required placeholder={t("adminTarot.stepTitle")}
                onChange={(e) => update(e.target.value)} />
            )}
          />
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
