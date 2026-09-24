"use client";

import { useEffect, useRef } from "react";

export interface StatusTab<K extends string> {
  key: K;
  label: string;
  count: number;
  /** Needs the admin's action: the count shows in gold. */
  urgent?: boolean;
}

// Filter tabs for admin lists. Scrolls sideways (with a visible scrollbar)
// when the tabs don't fit, and keeps the active tab in view — including when
// the page switches tabs itself after an action.
export default function StatusTabs<K extends string>({ tabs, active, onSelect }: {
  tabs: StatusTab<K>[];
  active: K;
  onSelect: (key: K) => void;
}) {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <div ref={bar} className="thin-scrollbar mt-10 overflow-x-auto pb-2">
      <nav role="tablist" className="flex w-max min-w-full gap-7 border-b border-line">
        {tabs.map((tab) => {
          const on = tab.key === active;
          return (
            <button key={tab.key} type="button" role="tab" aria-selected={on} data-tab={tab.key} onClick={() => onSelect(tab.key)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-[13px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                on ? "border-gold text-gold" : "border-transparent text-cream/65 hover:text-cream"}`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tracking-normal ${
                  tab.urgent ? "bg-gold text-ink" : "bg-cream/10 text-cream/75"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Short confirmation after the page moved to another tab; hides after 5s. */
export function MovedNotice({ text, onClose }: { text: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!text) return;
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [text, onClose]);
  if (!text) return null;
  return (
    // Floats at the bottom so it stays visible while the page scrolls to the moved card.
    <p role="status"
      className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,460px)] -translate-x-1/2 items-center justify-between gap-4 border border-gold/60 bg-ink-soft px-5 py-3.5 text-sm text-gold shadow-[0_10px_40px_-10px_#000] md:left-[calc(50%+8rem)]">
      <span>✓ {text}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss" className="text-cream/60 hover:text-cream">✕</button>
    </p>
  );
}
