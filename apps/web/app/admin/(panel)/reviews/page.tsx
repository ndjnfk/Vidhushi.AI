"use client";

import { useEffect, useState } from "react";
import Stars from "@/components/reviews/Stars";
import { parseUtc } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { deleteReview, listAdminReviews, setReviewHidden, type AdminReviewOut } from "../../_lib/api";

const BTN = "inline-flex items-center justify-center gap-2 px-5 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors disabled:opacity-50";
const FILTERS = ["all", "visible", "hidden"] as const;
type Filter = (typeof FILTERS)[number];

// Every customer review: Hide takes one off the public pages (reversible),
// Delete removes it for good.
export default function AdminReviewsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdminReviewOut[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    listAdminReviews().then(setRows).catch((e: Error) => setError(e.message));
  }, []);

  async function run(id: string, action: () => Promise<void>) {
    setBusy(id);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const toggle = (r: AdminReviewOut) => run(r.id, async () => {
    const updated = await setReviewHidden(r.id, !r.hidden);
    setRows((cur) => cur && cur.map((x) => (x.id === r.id ? updated : x)));
  });

  const remove = (r: AdminReviewOut) => {
    if (!confirm(t("adminReviews.deleteConfirm").replace("{name}", r.name))) return;
    run(r.id, async () => {
      await deleteReview(r.id);
      setRows((cur) => cur && cur.filter((x) => x.id !== r.id));
    });
  };

  const counts = {
    all: rows?.length ?? 0,
    visible: rows?.filter((r) => !r.hidden).length ?? 0,
    hidden: rows?.filter((r) => r.hidden).length ?? 0,
  };
  const shown = rows?.filter((r) => filter === "all" || (filter === "hidden") === r.hidden) ?? null;

  return (
    <div className="px-5 py-10 md:px-12 md:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-cream/70">{t("admin.panel")}</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] uppercase tracking-[0.04em] text-gold">{t("adminReviews.title")}</h1>
        <p className="mt-3 max-w-2xl text-cream/70">{t("adminReviews.intro")}</p>

        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((f) => (
            <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
              className={`border px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-colors ${
                filter === f ? "border-gold bg-gold/15 text-gold" : "border-line text-cream/70 hover:border-cream/40"
              }`}>
              {t(`adminReviews.filter.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>

        {!shown ? (
          <p className="mt-10 text-cream/70">{error ?? t("common.loading")}</p>
        ) : shown.length === 0 ? (
          <p className="mt-10 text-cream/70">{t("review.none")}</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {shown.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-start gap-4 border p-6 ${r.hidden ? "border-line opacity-60" : "border-line bg-ink-soft/60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm text-cream/60">
                      <span className="font-bold text-cream">{r.name}</span> · {r.label} · {t(`adminReviews.kind.${r.target_kind}`)} ·{" "}
                      {parseUtc(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {r.hidden && <span className="border border-line px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-cream/60">{t("adminReviews.hiddenBadge")}</span>}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-cream/90">&ldquo;{r.text}&rdquo;</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => toggle(r)} disabled={busy === r.id}
                    className={`${BTN} border border-cream/40 hover:border-gold hover:text-gold`}>
                    {t(r.hidden ? "adminReviews.show" : "adminReviews.hide")}
                  </button>
                  <button type="button" onClick={() => remove(r)} disabled={busy === r.id}
                    className={`${BTN} border border-line text-cream/70 hover:border-red-400 hover:text-red-300`}>
                    {t("adminReviews.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {rows && error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
