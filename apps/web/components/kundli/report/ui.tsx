"use client";

import Sparkle from "@/components/Sparkle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { READING } from "@/lib/kundliReading";
import { REPORT } from "@/lib/kundliReport";

// Shared pieces for the kundli report tabs.

export function useReportText() {
  const { locale } = useLanguage();
  const lang = locale === "hi" ? "hi" : "en";
  const R = READING[lang];
  return {
    R, // profile text: signs, planets, nakshatras…
    P: REPORT[lang], // report text: tabs, predictions, doshas…
    lang,
    planet: (name: string) => R.planets[name] ?? name,
    sign: (i: number) => R.signs[i] ?? "—",
    date: (iso: string, withTime = false) =>
      new Date(iso).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
        day: "numeric", month: "short", year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      }),
  };
}

export const CARD = "border border-line bg-ink-soft/70 p-6 md:p-8";
export const EYEBROW = "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cream/60";

export function TabHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-3 font-display text-[clamp(1.6rem,3vw,2.2rem)] uppercase tracking-[0.04em] text-gold">
        <Sparkle className="h-3.5 w-3.5 shrink-0" />
        {title}
      </h2>
      {hint && <p className="mt-2 max-w-3xl leading-relaxed text-cream/70">{hint}</p>}
    </div>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-5 mt-12 font-display text-xl uppercase tracking-[0.05em] text-gold first:mt-0">{children}</h3>;
}

export type Tone = "good" | "ok" | "mild" | "warn";

const TONE: Record<Tone, string> = {
  good: "border-gold/70 text-gold",
  ok: "border-cream/40 text-cream/80",
  mild: "border-amber-200/60 text-amber-200",
  warn: "border-red-300/60 text-red-300",
};

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex shrink-0 items-center border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] ${TONE[tone]}`}>
      {children}
    </span>
  );
}

// Label / value rows inside a card.
export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-6 py-3">
          <dt className="text-[12px] font-extrabold uppercase tracking-[0.12em] text-cream/60">{label}</dt>
          <dd className="text-right text-cream">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 leading-relaxed text-cream/85">
          <Sparkle className="mt-[0.45em] h-2.5 w-2.5 shrink-0 text-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
