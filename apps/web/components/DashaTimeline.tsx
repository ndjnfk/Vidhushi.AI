"use client";

import { useState } from "react";
import type { MahadashaOut } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

function isCurrent(start: string, end: string, now: number) {
  return new Date(start).getTime() <= now && now < new Date(end).getTime();
}

export default function DashaTimeline({ dasha }: { dasha: MahadashaOut[] }) {
  const { t } = useLanguage();
  const [now] = useState(() => Date.now());
  const [openIndex, setOpenIndex] = useState<number | null>(() => {
    const i = dasha.findIndex((m) => isCurrent(m.start, m.end, Date.now()));
    return i === -1 ? null : i;
  });

  return (
    <section className="border border-line bg-ink/85 p-6 backdrop-blur-sm md:p-8">
      <h2 className="font-display text-2xl uppercase tracking-[0.05em] text-gold">{t("kundli.dasha")}</h2>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {dasha.map((m, i) => {
          const open = openIndex === i;
          const current = isCurrent(m.start, m.end, now);
          return (
            <li key={i}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4 text-left transition-colors hover:text-gold"
              >
                <span className="flex items-center gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className={`h-4 w-4 text-gold transition-transform ${open ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                  <span className={current ? "text-gold" : "text-cream"}>
                    {m.lord} {t("kundli.mahadasha")}
                  </span>
                  {current && (
                    <span className="bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink">
                      {t("kundli.current")}
                    </span>
                  )}
                </span>
                <span className="pl-7 text-sm text-cream/65">
                  {fmt(m.start)} &ndash; {fmt(m.end)}
                </span>
              </button>
              {open && (
                <ul className="mb-4 ml-7 flex flex-col border-l border-line">
                  {m.antardashas.map((a, j) => {
                    const cur = isCurrent(a.start, a.end, now);
                    return (
                      <li
                        key={j}
                        className={`flex flex-wrap justify-between gap-x-6 py-2 pl-5 text-sm ${cur ? "text-gold" : "text-cream/85"}`}
                      >
                        <span>
                          {a.lord} {t("kundli.antardasha")}
                        </span>
                        <span className={cur ? "text-gold" : "text-cream/55"}>
                          {fmt(a.start)} &ndash; {fmt(a.end)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
