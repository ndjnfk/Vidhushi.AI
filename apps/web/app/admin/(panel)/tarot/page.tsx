"use client";

import { useEffect, useState } from "react";
import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  CHANNELS,
  defaultTarotContent,
  TAROT_ICONS,
  type SessionGroup,
  type TarotContent,
  type TarotSessionItem,
} from "@/lib/useTarotContent";
import { getTarotContent, saveTarotContent } from "../../_lib/api";

const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/35 focus:border-gold";
const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const OUTLINE = `${BTN} border border-cream/40 hover:border-gold hover:text-gold`;
const REMOVE = `${BTN} border border-line text-cream/60 hover:border-red-400 hover:text-red-300`;
const SMALL = "flex h-10 w-10 items-center justify-center border border-line text-cream/70 hover:border-gold hover:text-gold disabled:opacity-30";
const CARD = "mt-8 border border-line bg-ink-soft/60 p-6 md:p-8";

const GROUPS: { value: SessionGroup; key: string }[] = [
  { value: "call", key: "adminTarot.groupCall" },
  { value: "reading", key: "adminTarot.groupReading" },
  { value: "area", key: "adminTarot.groupArea" },
];

const newId = () => `s-${Math.random().toString(36).slice(2, 10)}`;

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h2 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-cream/55">{hint}</p>}
      <div className="mt-6 flex flex-col gap-5">{children}</div>
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
        <textarea className={`${INPUT} min-h-24 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
      ) : (
        <input className={INPUT} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={max} />
      )}
    </label>
  );
}

/** A list that is either "built-in" (empty in the database) or customised. */
function ListEditor<T>({ label, items, defaults, onChange, render, blank, max, addLabel }: {
  label: string;
  items: T[];
  defaults: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => React.ReactNode;
  blank: () => T;
  max: number;
  addLabel: string;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className={LABEL}>{label}</p>
      {items.length === 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p className="text-sm text-cream/55">{t("adminTarot.builtIn")}</p>
          <button type="button" onClick={() => onChange(defaults.map((d) => structuredClone(d)))} className={OUTLINE}>
            {t("adminTarot.customise")}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-3 border border-line p-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" aria-label={t("adminTarot.moveUp")} title={t("adminTarot.moveUp")} disabled={i === 0}
                  onClick={() => onChange(move(items, i, -1))} className={SMALL}>↑</button>
                <button type="button" aria-label={t("adminTarot.moveDown")} title={t("adminTarot.moveDown")} disabled={i === items.length - 1}
                  onClick={() => onChange(move(items, i, 1))} className={SMALL}>↓</button>
                <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className={REMOVE}>
                  {t("adminSite.remove")}
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {items.length < max && (
              <button type="button" onClick={() => onChange([...items, blank()])} className={OUTLINE}>+ {addLabel}</button>
            )}
            <button type="button" onClick={() => onChange([])} className={`${BTN} border border-line text-cream/60 hover:border-gold hover:text-gold`}>
              {t("adminTarot.useBuiltIn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTarotPage() {
  const { t } = useLanguage();
  const d = defaultTarotContent(t);
  const [c, setC] = useState<TarotContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getTarotContent().then(setC).catch((e: Error) => setMsg({ ok: false, text: e.message }));
  }, []);

  if (!c) return <div className="px-5 py-10 text-cream/60 md:px-12">{msg?.text ?? t("common.loading")}</div>;

  const set = (patch: Partial<TarotContent>) => setC((cur) => (cur ? { ...cur, ...patch } : cur));
  const text = (k: keyof TarotContent, label: string, max: number, area?: boolean) => (
    <Text label={label} value={c[k] as string} onChange={(v) => set({ [k]: v })} placeholder={d[k] as string} max={max} area={area} />
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      setC(await saveTarotContent(c!));
      setMsg({ ok: true, text: t("adminTarot.saved") });
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
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminTarot.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminTarot.intro")}</p>

        {/* Hero extras */}
        <Section title={t("adminTarot.hero")} hint={t("adminTarot.heroHint")}>
          {text("tagline", t("adminTarot.tagline"), 200)}
          <ListEditor<string>
            label={t("adminTarot.badges")} items={c.badges} defaults={d.badges} max={6} addLabel={t("adminTarot.addBadge")}
            onChange={(badges) => set({ badges })} blank={() => ""}
            render={(b, setB) => (
              <input className={INPUT} value={b} maxLength={40} required placeholder={t("adminTarot.badge")}
                onChange={(e) => setB(e.target.value)} />
            )}
          />
        </Section>

        {/* Sessions */}
        <Section title={t("adminTarot.sessions")} hint={t("adminTarot.sessionsHint")}>
          {text("sessions_title", t("adminHome.heading"), 120)}
          {text("sessions_subtitle", t("adminTarot.subtitle"), 300)}
          <ListEditor<TarotSessionItem>
            label={t("adminTarot.sessions")} items={c.sessions} defaults={d.sessions} max={30} addLabel={t("adminTarot.addSession")}
            onChange={(sessions) => set({ sessions })}
            blank={() => ({ id: newId(), group: "reading", name: "", description: "", price: null, tag: "", channels: [...CHANNELS] })}
            render={(s, setS) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>{t("adminTarot.group")}</span>
                  <select className={`${INPUT} bg-ink`} value={s.group} onChange={(e) => setS({ ...s, group: e.target.value as SessionGroup })}>
                    {GROUPS.map((g) => <option key={g.value} value={g.value}>{t(g.key)}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>{t("adminTarot.name")}</span>
                  <input className={INPUT} value={s.name} maxLength={80} required onChange={(e) => setS({ ...s, name: e.target.value })} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>{t("adminTarot.price")}</span>
                  <input type="number" min={0} max={10000000} className={INPUT} value={s.price ?? ""} placeholder={t("tarot.priceOnRequest")}
                    onChange={(e) => setS({ ...s, price: e.target.value === "" ? null : Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>{t("adminTarot.tag")}</span>
                  <input className={INPUT} value={s.tag} maxLength={30} onChange={(e) => setS({ ...s, tag: e.target.value })} />
                </label>
                <fieldset className="flex flex-col gap-2 sm:col-span-2">
                  <legend className={`${LABEL} mb-1`}>{t("adminTarot.channels")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((ch) => {
                      const on = (s.channels ?? CHANNELS).includes(ch);
                      const only = on && (s.channels ?? CHANNELS).length === 1;
                      return (
                        <button key={ch} type="button" aria-pressed={on} disabled={only} title={only ? t("adminTarot.channelsMin") : undefined}
                          onClick={() => {
                            const cur = s.channels ?? CHANNELS;
                            setS({ ...s, channels: CHANNELS.filter((c) => (c === ch ? !on : cur.includes(c))) });
                          }}
                          className={`flex items-center gap-2 border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed ${
                            on ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/60 hover:border-cream/40"
                          }`}>
                          <span aria-hidden="true">{on ? "✓" : "+"}</span>
                          {t(`adminTarot.channel.${ch}`)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-cream/50">{t("adminTarot.channelsHint")}</p>
                </fieldset>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={LABEL}>{t("adminTarot.description")}</span>
                  <textarea className={`${INPUT} min-h-20 resize-y`} value={s.description} maxLength={500}
                    onChange={(e) => setS({ ...s, description: e.target.value })} />
                </label>
              </div>
            )}
          />
        </Section>

        {/* Areas */}
        <Section title={t("adminTarot.areas")} hint={t("adminTarot.areasHint")}>
          {text("areas_title", t("adminHome.heading"), 120)}
          {text("areas_subtitle", t("adminTarot.subtitle"), 300, true)}
          {text("areas_note", t("adminTarot.note"), 500, true)}
        </Section>

        {/* Modalities */}
        <Section title={t("adminTarot.modalities")}>
          {text("modalities_title", t("adminHome.heading"), 120)}
          {text("modalities_intro", t("adminTarot.subtitle"), 500, true)}
          <ListEditor
            label={t("adminTarot.modalities")} items={c.modalities} defaults={d.modalities} max={12} addLabel={t("adminTarot.addModality")}
            onChange={(modalities) => set({ modalities })} blank={() => ({ name: "", icon: "any" })}
            render={(m, setM) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <input className={INPUT} value={m.name} maxLength={40} required placeholder={t("adminTarot.name")}
                  onChange={(e) => setM({ ...m, name: e.target.value })} />
                <select className={`${INPUT} bg-ink`} value={m.icon} aria-label={t("adminTarot.icon")} onChange={(e) => setM({ ...m, icon: e.target.value })}>
                  {TAROT_ICONS.map((i) => <option key={i} value={i}>{t("adminTarot.icon")}: {i}</option>)}
                </select>
              </div>
            )}
          />
          {text("modalities_note", t("adminTarot.note"), 800, true)}
        </Section>

        {/* How to book */}
        <Section title={t("adminTarot.how")}>
          {text("how_title", t("adminHome.heading"), 120)}
          <ListEditor
            label={t("adminTarot.how")} items={c.steps} defaults={d.steps} max={6} addLabel={t("adminTarot.addStep")}
            onChange={(steps) => set({ steps })} blank={() => ({ title: "", body: "", items: [] })}
            render={(s, setS) => (
              <div className="flex flex-col gap-3">
                <input className={INPUT} value={s.title} maxLength={120} required placeholder={t("adminTarot.stepTitle")}
                  onChange={(e) => setS({ ...s, title: e.target.value })} />
                <textarea className={`${INPUT} min-h-16 resize-y`} value={s.body} maxLength={500} placeholder={t("adminTarot.stepBody")}
                  onChange={(e) => setS({ ...s, body: e.target.value })} />
                <textarea className={`${INPUT} min-h-20 resize-y`} value={s.items.join("\n")} placeholder={t("adminTarot.stepItems")}
                  onChange={(e) => setS({ ...s, items: e.target.value.split("\n").slice(0, 10) })} />
              </div>
            )}
          />
          {text("how_note", t("adminTarot.note"), 500, true)}
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
