"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { sectionOrder, type HomeSection } from "@/lib/useHomeContent";
import { getHomeContent, saveHomeLayout } from "../_lib/api";

// Show/hide + up/down controls for the home page sections, shared by the
// Home page and Tarot sessions editors. The layout is saved on its own
// (PUT /admin/home/layout) so each editor can save it with its content.

export interface HomeLayout {
  hidden: HomeSection[];
  order: HomeSection[];
}

export function useHomeLayout() {
  const [layout, setLayout] = useState<HomeLayout | null>(null);

  useEffect(() => {
    getHomeContent()
      .then((c) => setLayout({ hidden: c.hidden_sections ?? [], order: sectionOrder(c) }))
      .catch(() => setLayout({ hidden: [], order: sectionOrder(null) }));
  }, []);

  const toggle = (s: HomeSection) =>
    setLayout((l) => l && { ...l, hidden: l.hidden.includes(s) ? l.hidden.filter((x) => x !== s) : [...l.hidden, s] });

  // Swap `s` with its neighbour among `within` (the sections this editor shows).
  const move = (s: HomeSection, by: -1 | 1, within: HomeSection[]) =>
    setLayout((l) => {
      if (!l) return l;
      const mine = l.order.filter((x) => within.includes(x));
      const other = mine[mine.indexOf(s) + by];
      if (!other) return l;
      const order = [...l.order];
      const i = order.indexOf(s), j = order.indexOf(other);
      [order[i], order[j]] = [order[j], order[i]];
      return { ...l, order };
    });

  const save = async () => {
    if (!layout) return;
    const c = await saveHomeLayout({ hidden_sections: layout.hidden, section_order: layout.order });
    setLayout({ hidden: c.hidden_sections, order: sectionOrder(c) });
  };

  return { layout, toggle, move, save };
}

const ARROW = "flex h-9 w-9 items-center justify-center border border-line text-cream/70 transition-colors hover:border-gold hover:text-gold disabled:pointer-events-none disabled:opacity-25";

export function SectionControls({ section, within, ctl }: {
  section: HomeSection;
  within: HomeSection[];
  ctl: ReturnType<typeof useHomeLayout>;
}) {
  const { t } = useLanguage();
  if (!ctl.layout) return null;
  const on = !ctl.layout.hidden.includes(section);
  const mine = ctl.layout.order.filter((x) => within.includes(x));
  const i = mine.indexOf(section);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={() => ctl.move(section, -1, within)} disabled={i <= 0} aria-label={t("adminHome.moveUp")} title={t("adminHome.moveUp")} className={ARROW}>↑</button>
      <button type="button" onClick={() => ctl.move(section, 1, within)} disabled={i >= mine.length - 1} aria-label={t("adminHome.moveDown")} title={t("adminHome.moveDown")} className={ARROW}>↓</button>
      <button type="button" role="switch" aria-checked={on} onClick={() => ctl.toggle(section)}
        className={`ml-1 flex items-center gap-3 border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors ${on ? "border-gold/60 text-gold" : "border-line text-cream/55"} hover:border-gold`}>
        {on ? t("adminHome.shown") : t("adminHome.hidden")}
        <span className={`flex h-5 w-9 items-center rounded-full border p-0.5 transition-colors ${on ? "border-gold bg-gold/25" : "border-cream/30"}`}>
          <span className={`h-3.5 w-3.5 rounded-full transition-transform ${on ? "translate-x-4 bg-gold" : "bg-cream/50"}`} />
        </span>
      </button>
    </div>
  );
}
