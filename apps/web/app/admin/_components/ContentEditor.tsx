"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

// Building blocks for the admin "content" editors (Tarot sessions, Rituals page):
// a titled section, a text field whose placeholder is the built-in text, and a
// list that is either "built-in" (empty in the database) or customised.

export const INPUT = "w-full border border-line bg-transparent px-4 py-3 text-cream outline-none placeholder:text-cream/35 focus:border-gold";
export const LABEL = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/70";
export const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const OUTLINE = `${BTN} border border-cream/40 hover:border-gold hover:text-gold`;
const REMOVE = `${BTN} border border-line text-cream/60 hover:border-red-400 hover:text-red-300`;
const SMALL = "flex h-10 w-10 items-center justify-center border border-line text-cream/70 hover:border-gold hover:text-gold disabled:opacity-30";

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// `actions` sits at the right of the title (e.g. show/hide + move buttons);
// `muted` dims the section when it is hidden on the site.
export function Section({ title, hint, children, actions, muted }: {
  title: string; hint?: string; children?: React.ReactNode; actions?: React.ReactNode; muted?: boolean;
}) {
  return (
    <section className={`mt-8 border p-6 transition-colors md:p-8 ${muted ? "border-dashed border-line bg-transparent" : "border-line bg-ink-soft/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className={muted ? "opacity-45" : ""}>
          <h2 className="font-display text-2xl uppercase tracking-[0.04em] text-gold">{title}</h2>
          {hint && <p className="mt-1 text-sm text-cream/55">{hint}</p>}
        </div>
        {actions}
      </div>
      {children && <div className={`mt-6 flex flex-col gap-5 ${muted ? "opacity-45" : ""}`}>{children}</div>}
    </section>
  );
}

export function Text({ label, value, onChange, placeholder, area, max }: {
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
export function ListEditor<T>({ label, items, defaults, onChange, render, blank, max, addLabel }: {
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
